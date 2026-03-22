import type { PipelineStep } from '../domain/types'

export interface VisualClassificationResult {
  label: string
  confidence: number
}

/** Stub — replace with on-device or cloud classifier */
export async function classifyVisual(
  _blob: Blob,
  fingerprint: string,
): Promise<{ result: VisualClassificationResult; step: PipelineStep }> {
  await delay(180 + (Number.parseInt(fingerprint.slice(4, 6), 16) % 120))

  const mod = Number.parseInt(fingerprint.slice(0, 8), 16) % 7
  let label = 'packaged product'
  let confidence = 0.42

  if (mod === 3) {
    label = 'granola bar'
    confidence = 0.71
  } else if (mod === 4) {
    label = 'unlabeled glass bottle'
    confidence = 0.58
  } else if (mod === 5) {
    label = 'unknown shelf item'
    confidence = 0.31
  }

  const step: PipelineStep = {
    step: 'visual',
    outcome: `Visual label: “${label}” @ ${(confidence * 100).toFixed(0)}% (mock)`,
  }

  return { result: { label, confidence }, step }
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
