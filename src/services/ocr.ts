import type { PipelineStep } from '../domain/types'

export interface OcrResult {
  text: string
  quality: number
}

/** Stub — replace with Tesseract.js or cloud OCR */
export async function runOcr(
  _blob: Blob,
  fingerprint: string,
): Promise<{ result: OcrResult; step: PipelineStep }> {
  await delay(150 + (Number.parseInt(fingerprint.slice(2, 4), 16) % 100))

  const mod = Number.parseInt(fingerprint.slice(0, 8), 16) % 7
  let text = ''
  let quality = 0.35

  if (mod === 2) {
    text = 'Château de Lumière Bordeaux Supérieur — Product of France'
    quality = 0.88
  } else if (mod === 3) {
    text = 'Crunchy Oats Honey Bar Morning Trail'
    quality = 0.62
  } else if (mod === 4) {
    text = 'blurry label text fragment...'
    quality = 0.28
  } else if (mod === 5) {
    text = ''
    quality = 0.1
  }

  const step: PipelineStep = {
    step: 'ocr',
    outcome:
      text.length > 0
        ? `OCR extracted ${text.length} characters (mock)`
        : 'OCR produced little usable text (mock)',
  }

  return { result: { text, quality }, step }
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
