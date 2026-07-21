import type {
  ConfidenceLevel,
  DataProvenance,
  IdentifiedEntity,
  LookupRequest,
  ScanSource,
} from './types'
import type { IdentifiedEntityLlm } from './entitySchema'
import type { CatalogRecord } from '../mocks/catalog'

export function scoreConfidence(input: {
  request: LookupRequest
  matchScore: number
}): number {
  const { request, matchScore } = input
  let base = matchScore
  if (request.kind === 'barcode') {
    base *= 0.95 + Math.min(request.signalStrength, 1) * 0.05
  } else if (request.kind === 'ocr') {
    base *= 0.55 + Math.min(request.quality, 1) * 0.35
  } else {
    base *= 0.4 + Math.min(request.confidence, 1) * 0.45
  }
  return Math.min(1, Math.max(0, base))
}

export function toConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 0.78) return 'high'
  if (score >= 0.45) return 'medium'
  return 'low'
}

/** Wrap LLM structured output into the UI entity model */
export function llmToIdentifiedEntity(
  raw: IdentifiedEntityLlm,
  source: ScanSource = 'visual',
): IdentifiedEntity {
  const provenance: DataProvenance =
    source === 'barcode' ? 'confirmed' : 'inferred'
  const conf = Math.min(1, Math.max(0, raw.confidence))
  const imageQuery =
    typeof raw.imageQuery === 'string' && raw.imageQuery.trim()
      ? raw.imageQuery.trim()
      : raw.name?.trim() || undefined
  return {
    id: raw.id,
    kind: raw.kind,
    name: { value: raw.name, provenance },
    subtitle: { value: raw.subtitle, provenance },
    summary: raw.summary,
    confidence: conf,
    confidenceLevel: toConfidenceLevel(conf),
    source,
    tags: raw.tags,
    warnings: raw.warnings,
    scanNotes: raw.scanNotes ?? undefined,
    imageQuery,
    images: [],
    facets: raw.facets,
  } as IdentifiedEntity
}

/** Build an IdentifiedEntity from a mock catalog row */
export function catalogToIdentifiedEntity(
  record: CatalogRecord,
  ctx: {
    source: ScanSource
    baseProvenance: DataProvenance
    confidence: number
    scanNotes?: string
  },
): IdentifiedEntity {
  const bp = ctx.baseProvenance
  const conf = ctx.confidence
  const level = toConfidenceLevel(conf)

  if (record.category === 'wine' || record.alcoholPercent != null) {
    return {
      id: record.id,
      kind: 'alcohol',
      name: { value: record.name, provenance: bp },
      subtitle: { value: record.brand, provenance: bp },
      summary: `${record.name} — ${record.category} from ${record.origin}.`,
      confidence: conf,
      confidenceLevel: level,
      source: ctx.source,
      tags: [record.category, record.origin].filter(Boolean),
      warnings: record.warnings,
      scanNotes: ctx.scanNotes,
      imageQuery: [record.name, record.brand].filter(Boolean).join(' '),
      images: [],
      facets: {
        abv: record.alcoholPercent,
        style: record.category === 'wine' ? 'Wine' : null,
        region: record.region ?? null,
        grapesOrGrains: record.grapeVariety ?? null,
        tastingNotes: [],
        pairings: record.pairings,
        servingTemp: null,
        contents: record.contents || null,
        origin: record.origin || null,
        ingredients: record.ingredients || null,
      },
    }
  }

  if (record.category === 'medicine') {
    return {
      id: record.id,
      kind: 'medicine',
      name: { value: record.name, provenance: bp },
      subtitle: { value: record.brand, provenance: bp },
      summary: `${record.name} (${record.brand}). Informational only — not medical advice.`,
      confidence: conf,
      confidenceLevel: level,
      source: ctx.source,
      tags: ['medicine'],
      warnings: record.warnings,
      scanNotes: ctx.scanNotes,
      imageQuery: [record.name, record.brand].filter(Boolean).join(' '),
      images: [],
      facets: {
        activeIngredients: record.activeIngredients ?? [],
        dosage: record.dosageWarnings ?? null,
        contraindications: record.doNotPair,
        sideEffects: [],
        storage: record.storage || null,
        form: null,
        contents: record.contents || null,
      },
    }
  }

  return {
    id: record.id,
    kind: 'food',
    name: { value: record.name, provenance: bp },
    subtitle: { value: record.brand, provenance: bp },
    summary: `${record.name} by ${record.brand}.`,
    confidence: conf,
    confidenceLevel: level,
    source: ctx.source,
    tags: [record.category, record.origin].filter(Boolean),
    warnings: record.warnings,
    scanNotes: ctx.scanNotes,
    imageQuery: [record.name, record.brand].filter(Boolean).join(' '),
    images: [],
    facets: {
      ingredients: record.ingredients || null,
      allergens: [],
      nutritionFacts: record.nutritionFacts,
      contents: record.contents || null,
      origin: record.origin || null,
      storage: record.storage || null,
      pairings: record.pairings,
      doNotPair: record.doNotPair,
    },
  }
}

/** @deprecated Use catalogToIdentifiedEntity */
export const catalogToProductResult = catalogToIdentifiedEntity
