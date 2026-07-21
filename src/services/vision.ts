import { apiUrl } from '../api/apiBase'
import { identifyWithFirebaseAi } from '../firebase/identify'
import type { IdentifiedEntity, PipelineStep } from '../domain/types'

export interface IdentifyHints {
  ocrText?: string
  barcode?: string
}

async function identifyViaServer(
  imageBlob: Blob,
  hints: IdentifyHints,
): Promise<{
  entity: IdentifiedEntity | null
  error?: string
}> {
  const url = apiUrl('/v1/identify')
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
      return {
        entity: null,
        error: body?.error ?? `Identify failed (HTTP ${res.status})`,
      }
    }
    const data = (await res.json()) as { entity: IdentifiedEntity }
    return { entity: data.entity }
  } catch (e) {
    return {
      entity: null,
      error:
        e instanceof Error
          ? e.message
          : 'Server identify unavailable',
    }
  }
}

async function identifyViaFirebase(
  imageBlob: Blob,
  hints: IdentifyHints,
): Promise<{
  entity: IdentifiedEntity | null
  error?: string
}> {
  try {
    const entity = await identifyWithFirebaseAi({
      imageBlob,
      ocrText: hints.ocrText,
      barcode: hints.barcode,
    })
    return { entity }
  } catch (e) {
    return {
      entity: null,
      error: e instanceof Error ? e.message : 'Firebase AI identify failed',
    }
  }
}

/**
 * Visual identify.
 * - Production (Vercel/Render): server Vertex first (reliable with ADC on Render),
 *   then Firebase Vertex AI.
 * - Dev: Firebase first (App Check debug), then local API.
 */
export async function identifyFromImage(
  imageBlob: Blob,
  hints: IdentifyHints = {},
): Promise<{
  entity: IdentifiedEntity | null
  step: PipelineStep
  error?: string
}> {
  const serverFirst = import.meta.env.PROD

  if (serverFirst) {
    const server = await identifyViaServer(imageBlob, hints)
    if (server.entity) {
      return {
        entity: server.entity,
        step: {
          step: 'visual',
          outcome: `Server identified as ${server.entity.kind}: ${server.entity.name.value ?? 'unknown'}`,
        },
      }
    }
    const firebase = await identifyViaFirebase(imageBlob, hints)
    if (firebase.entity) {
      return {
        entity: firebase.entity,
        step: {
          step: 'visual',
          outcome: `Firebase AI identified as ${firebase.entity.kind}: ${firebase.entity.name.value ?? 'unknown'} (server: ${server.error ?? 'failed'})`,
        },
      }
    }
    const message = `AI: ${firebase.error ?? 'failed'}${server.error ? ` · Server: ${server.error}` : ''}`
    return {
      entity: null,
      error: message,
      step: { step: 'visual', outcome: message },
    }
  }

  const firebase = await identifyViaFirebase(imageBlob, hints)
  if (firebase.entity) {
    return {
      entity: firebase.entity,
      step: {
        step: 'visual',
        outcome: `Firebase AI identified as ${firebase.entity.kind}: ${firebase.entity.name.value ?? 'unknown'}`,
      },
    }
  }

  const server = await identifyViaServer(imageBlob, hints)
  if (server.entity) {
    return {
      entity: server.entity,
      step: {
        step: 'visual',
        outcome: `Server fallback identified as ${server.entity.kind}: ${server.entity.name.value ?? 'unknown'} (Firebase: ${firebase.error ?? 'failed'})`,
      },
    }
  }

  const message = `AI: ${firebase.error ?? 'failed'}${server.error ? ` · Server: ${server.error}` : ''}`
  return {
    entity: null,
    error: message,
    step: { step: 'visual', outcome: message },
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
