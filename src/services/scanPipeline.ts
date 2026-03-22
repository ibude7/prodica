import type { LookupRequest, ScanOutcome, PipelineStep } from '../domain/types'
import { scanBarcodeFromImage } from './barcode'
import { runOcr } from './ocr'
import { classifyVisual, lookupByVisualLabel } from './vision'
import { fetchProductLookup } from '../api/productLookupApi'

/**
 * Barcode (ZXing) → Open Food Facts / catalog → OCR (Tesseract) → text search / catalog →
 * Visual classification fallback → no match.
 */
export async function runScanPipeline(imageBlob: Blob): Promise<ScanOutcome> {
  const steps: PipelineStep[] = []

  try {
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

    const ocr = await runOcr(imageBlob)
    steps.push(ocr.step)

    if (ocr.result.text.trim().length > 0 && ocr.result.quality >= 0.22) {
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

    // Visual classification fallback — uses OCR text to match catalog visualLabels
    const vision = await classifyVisual(ocr.result.text)
    steps.push(vision.step)

    if (vision.result.confidence >= 0.4) {
      const visualHit = lookupByVisualLabel(
        vision.result.label,
        vision.result.confidence,
      )
      if (visualHit) {
        return { status: 'success', result: visualHit, steps }
      }
    }

    return {
      status: 'no_match',
      steps,
      hint: 'No match found via barcode, OCR, or visual classification. Try centering the barcode or product name with good lighting.',
    }
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'Unexpected error during scan pipeline.'
    return { status: 'error', message, steps }
  }
}
