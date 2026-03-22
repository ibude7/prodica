import type { BrowserMultiFormatReader } from '@zxing/browser'
import type { PipelineStep } from '../domain/types'

export interface BarcodeScanResult {
  code: string | null
  signalStrength: number
}

let readerPromise: Promise<BrowserMultiFormatReader> | null = null

async function getReader(): Promise<BrowserMultiFormatReader> {
  readerPromise ??= import('@zxing/browser').then(
    ({ BrowserMultiFormatReader }) => new BrowserMultiFormatReader(),
  )
  return readerPromise
}

/**
 * Decode 1D/2D barcodes from a captured frame using ZXing (lazy-loaded).
 * Falls back gracefully when no symbol is found.
 */
export async function scanBarcodeFromImage(
  blob: Blob,
): Promise<{ result: BarcodeScanResult; step: PipelineStep }> {
  const { NotFoundException } = await import('@zxing/library')
  const reader = await getReader()
  const url = URL.createObjectURL(blob)
  try {
    const result = await reader.decodeFromImageUrl(url)
    const raw = result.getText().trim()
    const normalized = normalizeBarcodeText(raw)
    const step: PipelineStep = {
      step: 'barcode',
      outcome: normalized
        ? `Detected barcode ${normalized} (ZXing)`
        : `Decoder returned empty text (ZXing)`,
    }
    return {
      result: {
        code: normalized || null,
        signalStrength: normalized ? 0.96 : 0.35,
      },
      step,
    }
  } catch (e) {
    if (e instanceof NotFoundException) {
      return {
        result: { code: null, signalStrength: 0.35 },
        step: {
          step: 'barcode',
          outcome: 'No barcode detected in frame (ZXing)',
        },
      }
    }
    return {
      result: { code: null, signalStrength: 0.35 },
      step: {
        step: 'barcode',
        outcome: `Barcode scan error: ${e instanceof Error ? e.message : String(e)}`,
      },
    }
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Keep digits (and letters for Code128) — strip whitespace; prefer EAN/UPC style digit strings */
function normalizeBarcodeText(text: string): string {
  const digits = text.replace(/\D/g, '')
  if (digits.length >= 8) return digits
  const compact = text.replace(/\s+/g, '')
  return compact.length > 0 ? compact : ''
}
