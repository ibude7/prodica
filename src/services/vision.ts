import type { IdentifiedEntity, PipelineStep } from '../domain/types'

export interface IdentifyHints {
  ocrText?: string
  barcode?: string
}

function resolveIdentifyUrl(): string {
  const base = import.meta.env.VITE_API_BASE
  if (typeof base === 'string' && base.length > 0) {
    return `${base.replace(/\/$/, '')}/v1/identify`
  }
  if (import.meta.env.DEV) {
    return '/api/v1/identify'
  }
  return '/v1/identify'
}

/**
 * Universal visual identify via server (AI Gateway multimodal model).
 */
export async function identifyFromImage(
  imageBlob: Blob,
  hints: IdentifyHints = {},
): Promise<{
  entity: IdentifiedEntity | null
  step: PipelineStep
  error?: string
}> {
  const url = resolveIdentifyUrl()
  const form = new FormData()
  form.append('image', imageBlob, 'capture.jpg')
  if (hints.ocrText?.trim()) form.append('ocrText', hints.ocrText.trim())
  if (hints.barcode?.trim()) form.append('barcode', hints.barcode.trim())

  try {
    const res = await fetch(url, { method: 'POST', body: form })
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as {
        error?: string
      } | null
      const message = body?.error ?? `Identify failed (HTTP ${res.status})`
      return {
        entity: null,
        error: message,
        step: {
          step: 'visual',
          outcome: message,
        },
      }
    }
    const data = (await res.json()) as { entity: IdentifiedEntity }
    return {
      entity: data.entity,
      step: {
        step: 'visual',
        outcome: `Identified as ${data.entity.kind}: ${data.entity.name.value ?? 'unknown'}`,
      },
    }
  } catch (e) {
    const message =
      e instanceof Error
        ? e.message
        : 'Visual identify unavailable — is the API running with AI_GATEWAY_API_KEY?'
    return {
      entity: null,
      error: message,
      step: { step: 'visual', outcome: message },
    }
  }
}

/** @deprecated Use identifyFromImage */
export async function classifyVisual(): Promise<{
  result: { label: string; confidence: number }
  step: PipelineStep
}> {
  return {
    result: { label: 'unclassified', confidence: 0 },
    step: {
      step: 'visual',
      outcome: 'Use identifyFromImage instead of classifyVisual',
    },
  }
}
