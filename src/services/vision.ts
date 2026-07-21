import { apiUrl } from '../api/apiBase'
import { identifyWithFirebaseAi } from '../firebase/identify'
import { normalizeIdentifiedEntity } from '../domain/normalizeEntity'
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
    return { entity: normalizeIdentifiedEntity(data.entity) }
  } catch (e) {
    return {
      entity: null,
      error:
        e instanceof Error ? e.message : 'Server identify unavailable',
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
    return { entity: normalizeIdentifiedEntity(entity) }
  } catch (e) {
    return {
      entity: null,
      error: e instanceof Error ? e.message : 'Firebase AI identify failed',
    }
  }
}

/**
 * Visual identify — race server + Firebase; first success wins.
 */
export async function identifyFromImage(
  imageBlob: Blob,
  hints: IdentifyHints = {},
): Promise<{
  entity: IdentifiedEntity | null
  step: PipelineStep
  error?: string
}> {
  const serverP = identifyViaServer(imageBlob, hints)
  const firebaseP = identifyViaFirebase(imageBlob, hints)

  const winner = await new Promise<{
    entity: IdentifiedEntity | null
    label: string
    serverError?: string
    firebaseError?: string
  }>((resolve) => {
    let settled = false
    let serverDone:
      | { entity: IdentifiedEntity | null; error?: string }
      | undefined
    let firebaseDone:
      | { entity: IdentifiedEntity | null; error?: string }
      | undefined

    const tryFinish = () => {
      if (settled) return
      if (serverDone?.entity) {
        settled = true
        resolve({
          entity: serverDone.entity,
          label: 'Server',
          serverError: serverDone.error,
          firebaseError: firebaseDone?.error,
        })
        return
      }
      if (firebaseDone?.entity) {
        settled = true
        resolve({
          entity: firebaseDone.entity,
          label: 'Firebase AI',
          serverError: serverDone?.error,
          firebaseError: firebaseDone.error,
        })
        return
      }
      if (serverDone && firebaseDone) {
        settled = true
        resolve({
          entity: null,
          label: 'none',
          serverError: serverDone.error,
          firebaseError: firebaseDone.error,
        })
      }
    }

    void serverP.then((r) => {
      serverDone = r
      tryFinish()
    })
    void firebaseP.then((r) => {
      firebaseDone = r
      tryFinish()
    })
  })

  if (winner.entity) {
    return {
      entity: winner.entity,
      step: {
        step: 'visual',
        outcome: `${winner.label} identified as ${winner.entity.kind}: ${winner.entity.name.value ?? 'unknown'}`,
      },
    }
  }

  const message = `AI: ${winner.firebaseError ?? 'failed'}${winner.serverError ? ` · Server: ${winner.serverError}` : ''}`
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
