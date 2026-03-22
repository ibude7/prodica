import type { PipelineStep } from '../domain/types'

export interface VisualClassificationResult {
  label: string
  confidence: number
}

/**
 * Placeholder — no on-device image classifier wired yet.
 * We do not guess a product from this alone (avoids misleading matches).
 */
export async function classifyVisual(): Promise<{
  result: VisualClassificationResult
  step: PipelineStep
}> {
  const result: VisualClassificationResult = {
    label: 'unclassified product photo',
    confidence: 0.15,
  }
  const step: PipelineStep = {
    step: 'visual',
    outcome:
      'Visual classification not configured — use a clear barcode or label photo',
  }
  return { result: result, step }
}
