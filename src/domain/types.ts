/** How a field was obtained — shown in UI for transparency */
export type DataProvenance = 'confirmed' | 'inferred'

/** Where the primary match came from */
export type ScanSource = 'barcode' | 'ocr' | 'visual' | 'combined'

export type ConfidenceLevel = 'high' | 'medium' | 'low'

export type ProductCategory =
  | 'wine'
  | 'food'
  | 'medicine'
  | 'supplements'
  | 'cosmetics'
  | 'household'
  | 'fragrance'
  | 'other'

export interface NutritionFact {
  label: string
  value: string
}

/** Single normalized product view for the result screen */
export interface ProductResult {
  id: string
  name: ProductField<string>
  brand: ProductField<string>
  category: ProductField<ProductCategory>
  origin: ProductField<string>
  ingredients: ProductField<string>
  /** Package size / net contents */
  contents: ProductField<string>
  nutritionFacts: ProductField<NutritionFact[]>
  /** Alcohol by volume (0–100), mainly wine & some drinks */
  alcoholPercent: ProductField<number>
  warnings: ProductField<string[]>
  storage: ProductField<string>
  pairings: ProductField<string[]>
  doNotPair: ProductField<string[]>
  /** Wine: region / appellation */
  region?: ProductField<string>
  /** Wine: dominant grape or blend note */
  grapeVariety?: ProductField<string>
  /** Medicine / supplements */
  activeIngredients?: ProductField<string[]>
  dosageWarnings?: ProductField<string>
  /** 0–1 overall match confidence */
  confidence: number
  confidenceLevel: ConfidenceLevel
  source: ScanSource
  /** Human-readable trace for debugging / power users */
  scanNotes?: string
}

export interface ProductField<T> {
  value: T | null
  provenance: DataProvenance
}

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
      result: ProductResult
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
