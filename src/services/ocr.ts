import type { PipelineStep } from '../domain/types'

export interface OcrResult {
  text: string
  /** 0–1 heuristic quality for downstream matching */
  quality: number
}

/**
 * Real OCR via Tesseract.js (English). Slow on first run (loads trained data).
 */
export async function runOcr(blob: Blob): Promise<{ result: OcrResult; step: PipelineStep }> {
  const { createWorker } = await import('tesseract.js')
  const url = URL.createObjectURL(blob)
  try {
    const worker = await createWorker('eng')
    const { data } = await worker.recognize(url)
    await worker.terminate()

    const text = data.text.replace(/\s+/g, ' ').trim()
    const conf = typeof data.confidence === 'number' ? data.confidence : 0
    const quality =
      text.length < 4
        ? 0.1
        : Math.min(0.95, Math.max(0.2, conf / 100 + Math.min(0.15, text.length / 500)))

    const step: PipelineStep = {
      step: 'ocr',
      outcome:
        text.length > 0
          ? `OCR read ${text.length} characters (Tesseract, ~${Math.round(conf)}% confidence)`
          : 'OCR found little readable text on this image',
    }

    return { result: { text, quality }, step }
  } catch (e) {
    return {
      result: { text: '', quality: 0.1 },
      step: {
        step: 'ocr',
        outcome: `OCR failed: ${e instanceof Error ? e.message : String(e)}`,
      },
    }
  } finally {
    URL.revokeObjectURL(url)
  }
}
