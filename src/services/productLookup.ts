import type { LookupRequest, ProductResult } from '../domain/types'
import {
  catalogToProductResult,
  scoreConfidence,
} from '../domain/intelligence'
import { CATALOG } from '../mocks/catalog'

function normalizeBarcode(code: string): string {
  return code.replace(/\D/g, '')
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter(Boolean)
}

/** Mock resolver — replace with HTTP client later */
export function lookupProduct(request: LookupRequest): ProductResult | null {
  if (request.kind === 'barcode') {
    const code = normalizeBarcode(request.code)
    for (const row of CATALOG) {
      for (const b of row.barcodes) {
        if (normalizeBarcode(b) === code) {
          const matchScore = 0.98
          const conf = scoreConfidence({ request, matchScore })
          return catalogToProductResult(row, {
            source: 'barcode',
            baseProvenance: 'confirmed',
            confidence: conf,
            scanNotes: 'Matched via barcode lookup (mock database).',
          })
        }
      }
    }
    return null
  }

  if (request.kind === 'ocr') {
    const tokens = tokenize(request.text)
    let best: { row: (typeof CATALOG)[0]; score: number } | null = null
    for (const row of CATALOG) {
      let score = 0
      for (const t of tokens) {
        if (row.nameTokens.some((k) => k.includes(t) || t.includes(k))) {
          score += 2
        }
      }
      for (const nt of row.nameTokens) {
        if (request.text.toLowerCase().includes(nt)) score += 3
      }
      if (score > (best?.score ?? 0)) best = { row, score }
    }
    if (best && best.score >= 3) {
      const conf = scoreConfidence({
        request,
        matchScore: Math.min(0.92, 0.45 + best.score * 0.08),
      })
      return catalogToProductResult(best.row, {
        source: 'ocr',
        baseProvenance: 'confirmed',
        confidence: conf,
        scanNotes: 'Matched using OCR text against catalog (mock).',
      })
    }
    return null
  }

  const label = request.label.toLowerCase()
  for (const row of CATALOG) {
    for (const vl of row.visualLabels) {
      if (label.includes(vl) || vl.includes(label)) {
        const conf = scoreConfidence({
          request,
          matchScore: 0.72,
        })
        return catalogToProductResult(row, {
          source: 'visual',
          baseProvenance: 'confirmed',
          confidence: conf,
          scanNotes: 'Matched via visual classification label (mock).',
        })
      }
    }
  }
  return null
}
