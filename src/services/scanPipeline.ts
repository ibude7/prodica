import type {
  IdentifiedEntity,
  LookupRequest,
  ScanOutcome,
  PipelineStep,
} from '../domain/types'
import { normalizeIdentifiedEntity } from '../domain/normalizeEntity'
import { scanBarcodeFromImage } from './barcode'
import { runOcr } from './ocr'
import { identifyFromImage } from './vision'
import { fetchEntityLookup } from '../api/entityLookupApi'
import { prepareImageForVision } from './imagePrep'

function withCapturedPhoto(
  entity: IdentifiedEntity,
  capturedPhoto: string,
): IdentifiedEntity {
  return normalizeIdentifiedEntity({ ...entity, capturedPhoto })
}

/**
 * Fast path: barcode → OFF, then race OCR→OFF against vision.
 * Vision starts immediately (no waiting on Tesseract). Images enrich later in the UI.
 */
export async function runScanPipeline(imageBlob: Blob): Promise<ScanOutcome> {
  const steps: PipelineStep[] = []
  const capturedPhoto = URL.createObjectURL(imageBlob)
  let barcodeCode: string | undefined

  try {
    const barcode = await scanBarcodeFromImage(imageBlob)
    steps.push(barcode.step)

    if (barcode.result.code) {
      barcodeCode = barcode.result.code
      const req: LookupRequest = {
        kind: 'barcode',
        code: barcode.result.code,
        signalStrength: barcode.result.signalStrength,
      }
      const hit = await fetchEntityLookup(req)
      if (hit) {
        return {
          status: 'success',
          result: withCapturedPhoto(hit, capturedPhoto),
          steps,
        }
      }
    }

    const visionBlob = await prepareImageForVision(imageBlob)

    // Start vision immediately — do not wait for OCR
    const visionPromise = identifyFromImage(visionBlob, {
      barcode: barcodeCode,
    })

    const ocrJob = (async (): Promise<{
      hit: IdentifiedEntity | null
      step: PipelineStep
    }> => {
      try {
        const ocr = await runOcr(imageBlob)
        if (ocr.result.text.trim().length === 0 || ocr.result.quality < 0.22) {
          return { hit: null, step: ocr.step }
        }
        const ocrHit = await fetchEntityLookup({
          kind: 'ocr',
          text: ocr.result.text,
          quality: ocr.result.quality,
        })
        return { hit: ocrHit, step: ocr.step }
      } catch {
        return {
          hit: null,
          step: { step: 'ocr', outcome: 'OCR unavailable' },
        }
      }
    })()

    type Win =
      | { kind: 'ocr'; entity: IdentifiedEntity; ocrStep: PipelineStep }
      | {
          kind: 'vision'
          entity: IdentifiedEntity | null
          step: PipelineStep
          error?: string
          ocrStep?: PipelineStep
        }

    const win = await new Promise<Win>((resolve) => {
      let done = false
      let ocrResult: { hit: IdentifiedEntity | null; step: PipelineStep } | undefined

      const finish = (w: Win) => {
        if (done) return
        done = true
        resolve(w)
      }

      void ocrJob.then((r) => {
        ocrResult = r
        if (r.hit) finish({ kind: 'ocr', entity: r.hit, ocrStep: r.step })
      })

      void visionPromise.then((vision) => {
        if (vision.entity) {
          finish({
            kind: 'vision',
            entity: vision.entity,
            step: vision.step,
            error: vision.error,
            ocrStep: ocrResult?.step,
          })
          return
        }
        void ocrJob.then((r) => {
          if (r.hit) {
            finish({ kind: 'ocr', entity: r.hit, ocrStep: r.step })
          } else {
            finish({
              kind: 'vision',
              entity: null,
              step: vision.step,
              error: vision.error,
              ocrStep: r.step,
            })
          }
        })
      })
    })

    if (win.kind === 'ocr') {
      steps.push(win.ocrStep)
      return {
        status: 'success',
        result: withCapturedPhoto(win.entity, capturedPhoto),
        steps,
      }
    }

    if (win.ocrStep) steps.push(win.ocrStep)
    steps.push(win.step)

    if (win.entity) {
      return {
        status: 'success',
        result: withCapturedPhoto(win.entity, capturedPhoto),
        steps,
      }
    }

    return {
      status: 'no_match',
      steps,
      hint:
        win.error ??
        'Could not identify this image. Try a clearer photo with the subject centered and well lit.',
    }
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'Unexpected error during scan pipeline.'
    return { status: 'error', message, steps }
  }
}
