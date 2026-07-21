import type { EntityKind, IdentifiedEntityLlm } from './entitySchema'

/** How a field was obtained — shown in UI for transparency */
export type DataProvenance = 'confirmed' | 'inferred'

/** Where the primary match came from */
export type ScanSource = 'barcode' | 'ocr' | 'visual' | 'combined'

export type ConfidenceLevel = 'high' | 'medium' | 'low'

export type { EntityKind }

export type EntityImageSource =
  | 'openfoodfacts'
  | 'wikimedia'
  | 'grounding'
  | 'cse'
  | 'captured'

/** Reference or captured image attached to an identified entity */
export interface EntityImage {
  url: string
  thumbUrl?: string
  caption?: string
  source: EntityImageSource
  provenance: DataProvenance
}

export interface NutritionFact {
  label: string
  value: string
}

export interface EntityField<T> {
  value: T | null
  provenance: DataProvenance
}

/** Normalized entity for the result screen (LLM or structured DB) */
export type IdentifiedEntity = {
  [K in EntityKind]: {
    id: string
    kind: K
    name: EntityField<string>
    subtitle: EntityField<string>
    summary: string
    confidence: number
    confidenceLevel: ConfidenceLevel
    source: ScanSource
    tags: string[]
    warnings: string[]
    scanNotes?: string
    /** Canonical search term for reference-image enrichment */
    imageQuery?: string
    /** Reference images from OFF / Wikimedia / grounding / CSE */
    images: EntityImage[]
    /** Object URL or data URL of the user's captured photo */
    capturedPhoto?: string
    facets: Extract<IdentifiedEntityLlm, { kind: K }>['facets']
  }
}[EntityKind]

/** API / service layer: one of several lookup strategies */
export type LookupRequest =
  | { kind: 'barcode'; code: string; signalStrength: number }
  | { kind: 'ocr'; text: string; quality: number }
  | { kind: 'visual'; label: string; confidence: number }

export interface PipelineStep {
  step: 'barcode' | 'ocr' | 'visual'
  outcome: string
}

export type ScanOutcome =
  | {
      status: 'success'
      result: IdentifiedEntity
      steps: PipelineStep[]
    }
  | {
      status: 'no_match'
      steps: PipelineStep[]
      hint?: string
    }
  | {
      status: 'error'
      message: string
      steps?: PipelineStep[]
    }

/** @deprecated Use IdentifiedEntity — kept only for transitional imports */
export type ProductResult = IdentifiedEntity
export type ProductCategory = EntityKind
export type ProductField<T> = EntityField<T>
