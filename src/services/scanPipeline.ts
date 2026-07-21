import type { LookupRequest, ScanOutcome, PipelineStep } from '../domain/types'
import { scanBarcodeFromImage } from './barcode'
import { runOcr } from './ocr'
import { identifyFromImage } from './vision'
import { fetchEntityLookup } from '../api/entityLookupApi'

/**
 * Barcode → Open Food Facts → OCR text search → vision LLM (universal).
 */
export async function runScanPipeline(imageBlob: Blob): Promise<ScanOutcome> {
  const steps: PipelineStep[] = []
  let barcodeCode: string | undefined
  let ocrText: string | undefined

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
        return { status: 'success', result: hit, steps }
      }
    }

    const ocr = await runOcr(imageBlob)
    steps.push(ocr.step)
    ocrText = ocr.result.text

    if (ocr.result.text.trim().length > 0 && ocr.result.quality >= 0.22) {
      const ocrReq: LookupRequest = {
        kind: 'ocr',
        text: ocr.result.text,
        quality: ocr.result.quality,
      }
      const ocrHit = await fetchEntityLookup(ocrReq)
      if (ocrHit) {
        return { status: 'success', result: ocrHit, steps }
      }
    }

    const vision = await identifyFromImage(imageBlob, {
      ocrText,
      barcode: barcodeCode,
    })
    steps.push(vision.step)

    if (vision.entity) {
      return { status: 'success', result: vision.entity, steps }
    }

    return {
      status: 'no_match',
      steps,
      hint:
        vision.error ??
        'Could not identify this image. Try a clearer photo with the subject centered and well lit.',
    }
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'Unexpected error during scan pipeline.'
    return { status: 'error', message, steps }
  }
}
