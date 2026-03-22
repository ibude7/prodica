import type {
  ConfidenceLevel,
  DataProvenance,
  LookupRequest,
  NutritionFact,
  ProductField,
  ProductResult,
  ScanSource,
} from './types'
import type { CatalogRecord } from '../mocks/catalog'

function field<T>(value: T | null, provenance: DataProvenance): ProductField<T> {
  return { value, provenance }
}

/** Map catalog quality + match path to 0–1 confidence */
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

function provenanceForField(
  base: DataProvenance,
  fieldKey: string,
): DataProvenance {
  const inferredKeys = new Set(['pairings', 'doNotPair'])
  if (inferredKeys.has(fieldKey) && base === 'confirmed') return 'inferred'
  return base
}

/** Build a UI model from a catalog row and intelligence context */
export function catalogToProductResult(
  record: CatalogRecord,
  ctx: {
    source: ScanSource
    baseProvenance: DataProvenance
    confidence: number
    scanNotes?: string
  },
): ProductResult {
  const bp = ctx.baseProvenance
  const conf = ctx.confidence
  const level = toConfidenceLevel(conf)

  const nutrition: ProductField<{ label: string; value: string }[]> = field(
    record.nutritionFacts.length ? record.nutritionFacts : null,
    provenanceForField(bp, 'nutritionFacts'),
  )

  const pairings = field(
    record.pairings.length ? record.pairings : null,
    'inferred',
  )
  const doNotPair = field(
    record.doNotPair.length ? record.doNotPair : null,
    'inferred',
  )

  const result: ProductResult = {
    id: record.id,
    name: field(record.name, bp),
    brand: field(record.brand, bp),
    category: field(record.category, bp),
    origin: field(record.origin, bp),
    ingredients: field(record.ingredients, bp),
    contents: field(record.contents, bp),
    nutritionFacts: nutrition,
    alcoholPercent: field(record.alcoholPercent, bp),
    warnings: field(record.warnings.length ? record.warnings : null, bp),
    storage: field(record.storage, bp),
    pairings,
    doNotPair,
    confidence: conf,
    confidenceLevel: level,
    source: ctx.source,
    scanNotes: ctx.scanNotes,
  }

  if (record.region) {
    result.region = field(record.region, bp)
  }
  if (record.grapeVariety) {
    result.grapeVariety = field(record.grapeVariety, bp)
  }
  if (record.activeIngredients?.length) {
    result.activeIngredients = field(record.activeIngredients, bp)
  }
  if (record.dosageWarnings) {
    result.dosageWarnings = field(record.dosageWarnings, bp)
  }

  return result
}

/** Low-confidence “best guess” when nothing matches the catalog */
export function buildFallbackGuess(input: {
  label: string
  fingerprint: string
}): ProductResult {
  const conf = 0.22 + (Number.parseInt(input.fingerprint.slice(0, 4), 16) % 12) / 100
  return {
    id: `guess-${input.fingerprint.slice(0, 6)}`,
    name: field(`Possible product: ${input.label}`, 'inferred'),
    brand: field<string>(null, 'inferred'),
    category: field('other', 'inferred'),
    origin: field<string>(null, 'inferred'),
    ingredients: field<string>(null, 'inferred'),
    contents: field<string>(null, 'inferred'),
    nutritionFacts: field<NutritionFact[]>(null, 'inferred'),
    alcoholPercent: field<number>(null, 'inferred'),
    warnings: field(
      ['Unverified match — do not rely on this for allergies or safety.'],
      'inferred',
    ),
    storage: field<string>(null, 'inferred'),
    pairings: field<string[]>(null, 'inferred'),
    doNotPair: field<string[]>(null, 'inferred'),
    confidence: conf,
    confidenceLevel: 'low',
    source: 'visual',
    scanNotes:
      'No strong match in the mock catalog. Showing a visual-classification label only.',
  }
}
