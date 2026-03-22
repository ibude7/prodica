import type { LookupRequest, PipelineStep, ProductResult } from '../domain/types'
import { CATALOG } from '../mocks/catalog'
import {
  catalogToProductResult,
  scoreConfidence,
} from '../domain/intelligence'

export interface VisualClassificationResult {
  label: string
  confidence: number
}

/**
 * Simple visual classification that matches OCR text against catalog visualLabels.
 * Falls back to a generic label when nothing matches.
 */
export async function classifyVisual(ocrText?: string): Promise<{
  result: VisualClassificationResult
  step: PipelineStep
}> {
  if (ocrText && ocrText.trim().length > 3) {
    const lower = ocrText.toLowerCase()
    for (const row of CATALOG) {
      for (const vl of row.visualLabels) {
        if (lower.includes(vl) || vl.split(' ').every((w) => lower.includes(w))) {
          return {
            result: { label: vl, confidence: 0.55 },
            step: {
              step: 'visual',
              outcome: `Visual label matched: "${vl}" (text-based heuristic)`,
            },
          }
        }
      }
      for (const nt of row.nameTokens) {
        if (lower.includes(nt)) {
          const label = row.visualLabels[0] ?? row.category
          return {
            result: { label, confidence: 0.45 },
            step: {
              step: 'visual',
              outcome: `Visual fallback matched token "${nt}" → label "${label}"`,
            },
          }
        }
      }
    }
  }

  return {
    result: { label: 'unclassified product photo', confidence: 0.15 },
    step: {
      step: 'visual',
      outcome:
        'No visual label match found — try a clearer barcode or label photo',
    },
  }
}

/** Look up a product from a visual classification result */
export function lookupByVisualLabel(
  label: string,
  confidence: number,
): ProductResult | null {
  const lower = label.toLowerCase()
  for (const row of CATALOG) {
    if (row.visualLabels.some((vl) => vl.toLowerCase() === lower)) {
      const request: LookupRequest = { kind: 'visual', label, confidence }
      const matchScore = 0.5 + confidence * 0.4
      const conf = scoreConfidence({ request, matchScore })
      return catalogToProductResult(row, {
        source: 'visual',
        baseProvenance: 'inferred',
        confidence: conf,
        scanNotes: `Matched via visual label "${label}" (heuristic). Verify details on the package.`,
      })
    }
  }
  return null
}
