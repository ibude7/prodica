import type {
  EntityImage,
  EntityKind,
  IdentifiedEntity,
} from '../domain/types'
import { apiUrl } from '../api/apiBase'

const ENRICH_TIMEOUT_MS = 5_000
const MAX_IMAGES = 6

export type EnrichInput = {
  kind: EntityKind
  name: string
  tags?: string[]
  imageQuery?: string
  barcode?: string
  /** Existing images (e.g. from Open Food Facts) to merge/dedupe */
  existing?: EntityImage[]
}

function dedupeImages(images: EntityImage[]): EntityImage[] {
  const seen = new Set<string>()
  const out: EntityImage[] = []
  for (const img of images) {
    const key = img.url.split('?')[0]
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(img)
  }
  return out.slice(0, MAX_IMAGES)
}

/** Fetch reference images via the server enrich endpoint (Wikimedia + CSE + grounding). */
export async function enrichEntityImages(
  input: EnrichInput,
  signal?: AbortSignal,
): Promise<EntityImage[]> {
  const existing = input.existing ?? []
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), ENRICH_TIMEOUT_MS)
    const onAbort = () => controller.abort()
    signal?.addEventListener('abort', onAbort)

    try {
      const res = await fetch(apiUrl('/v1/enrich'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: input.kind,
          name: input.name,
          tags: input.tags ?? [],
          imageQuery: input.imageQuery,
          barcode: input.barcode,
        }),
        signal: controller.signal,
      })
      if (!res.ok) {
        return dedupeImages(existing)
      }
      const data = (await res.json()) as { images?: EntityImage[] }
      return dedupeImages([...existing, ...(data.images ?? [])])
    } finally {
      clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
    }
  } catch {
    return dedupeImages(existing)
  }
}

/** Attach enriched images onto an entity (non-blocking tolerant). */
export async function withEnrichedImages(
  entity: IdentifiedEntity,
  opts?: { barcode?: string; signal?: AbortSignal },
): Promise<IdentifiedEntity> {
  const existing = entity.images ?? []
  // Already well-stocked (e.g. server identify + OFF) — skip extra round-trip
  if (existing.length >= 3) {
    return { ...entity, images: existing }
  }
  const name = entity.name?.value ?? 'Unknown'
  const images = await enrichEntityImages(
    {
      kind: entity.kind,
      name,
      tags: entity.tags ?? [],
      imageQuery: entity.imageQuery ?? name,
      barcode: opts?.barcode,
      existing,
    },
    opts?.signal,
  )
  return { ...entity, images }
}

/** Proxy a remote image URL through the API (CORS / hotlink safe). */
export function proxiedImageUrl(remoteUrl: string): string {
  if (
    remoteUrl.startsWith('blob:') ||
    remoteUrl.startsWith('data:') ||
    remoteUrl.startsWith('/')
  ) {
    return remoteUrl
  }
  return apiUrl(`/v1/image?url=${encodeURIComponent(remoteUrl)}`)
}
