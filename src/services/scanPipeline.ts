import type { LookupRequest, ScanOutcome, PipelineStep } from '../domain/types'
import { fingerprintBlob } from '../utils/hash'
import { scanBarcodeFromImage } from './barcode'
import { runOcr } from './ocr'
import { classifyVisual } from './vision'
import { fetchProductLookup } from '../api/productLookupApi'
import { buildFallbackGuess } from '../domain/intelligence'

/**
 * Barcode → OCR → visual fallback, normalized to ProductResult.
 * Deterministic for a given image fingerprint (mock services).
 */
export async function runScanPipeline(imageBlob: Blob): Promise<ScanOutcome> {
  const steps: PipelineStep[] = []

  try {
    const fp = await fingerprintBlob(imageBlob)

    const barcode = await scanBarcodeFromImage(imageBlob)
    steps.push(barcode.step)

    if (barcode.result.code) {
      const req: LookupRequest = {
        kind: 'barcode',
        code: barcode.result.code,
        signalStrength: barcode.result.signalStrength,
      }
      const hit = await fetchProductLookup(req)
      if (hit) {
        return { status: 'success', result: hit, steps }
      }
    }

    const ocr = await runOcr(imageBlob, fp)
    steps.push(ocr.step)

    if (ocr.result.text.trim().length > 0 && ocr.result.quality >= 0.25) {
      const ocrReq: LookupRequest = {
        kind: 'ocr',
        text: ocr.result.text,
        quality: ocr.result.quality,
      }
      const ocrHit = await fetchProductLookup(ocrReq)
      if (ocrHit) {
        return { status: 'success', result: ocrHit, steps }
      }
    }

    const vision = await classifyVisual(imageBlob, fp)
    steps.push(vision.step)

    const visReq: LookupRequest = {
      kind: 'visual',
      label: vision.result.label,
      confidence: vision.result.confidence,
    }
    const visHit = await fetchProductLookup(visReq)
    if (visHit) {
      return { status: 'success', result: visHit, steps }
    }

    const mod = Number.parseInt(fp.slice(0, 8), 16) % 7
    if (mod === 5) {
      return {
        status: 'no_match',
        steps,
        hint: 'No confident match in mock data. Try a clearer photo or different angle.',
      }
    }

    const guess = buildFallbackGuess({
      label: vision.result.label,
      fingerprint: fp,
    })
    return { status: 'success', result: guess, steps }
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'Unexpected error during scan pipeline.'
    return { status: 'error', message, steps }
  }
}
