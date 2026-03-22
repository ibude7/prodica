import type { LookupRequest, ScanOutcome, PipelineStep } from '../domain/types'
import { scanBarcodeFromImage } from './barcode'
import { runOcr } from './ocr'
import { classifyVisual } from './vision'
import { fetchProductLookup } from '../api/productLookupApi'

/**
 * Barcode (ZXing) → Open Food Facts / catalog → OCR (Tesseract) → text search / mock catalog.
 * No fingerprint-based fake products.
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

    const vision = await classifyVisual()
    steps.push(vision.step)

    return {
      status: 'no_match',
      steps,
      hint: 'No match for this barcode in our catalog or Open Food Facts, and OCR did not yield a reliable product. Try centering the barcode or the product name, with good light.',
    }
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'Unexpected error during scan pipeline.'
    return { status: 'error', message, steps }
  }
}
