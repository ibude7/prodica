import type {
  EntityImage,
  EntityKind,
} from '../src/domain/types'

const MAX_IMAGES = 6
const FETCH_MS = 6_000

export type ServerEnrichInput = {
  kind: EntityKind
  name: string
  tags?: string[]
  imageQuery?: string
  barcode?: string
  /** Optional URLs from Gemini grounding metadata */
  groundingUrls?: string[]
}

function dedupe(images: EntityImage[]): EntityImage[] {
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

function queryFor(input: ServerEnrichInput): string {
  return (
    input.imageQuery?.trim() ||
    [input.name, ...(input.tags ?? []).slice(0, 2)].filter(Boolean).join(' ')
  ).trim()
}

async function fetchJson(
  url: string,
  init?: RequestInit,
): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(FETCH_MS),
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Prodica/1.0 (https://github.com/ibude7/prodica)',
        ...(init?.headers ?? {}),
      },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

/** Wikipedia REST summary thumbnail + original */
async function fromWikimedia(query: string): Promise<EntityImage[]> {
  if (!query) return []
  const title = encodeURIComponent(query.replace(/\s+/g, '_'))
  const summary = (await fetchJson(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`,
  )) as {
    title?: string
    thumbnail?: { source?: string }
    originalimage?: { source?: string }
    description?: string
    type?: string
  } | null

  // If exact title miss, try search
  let resolved = summary
  if (!resolved || resolved.type === 'disambiguation' || !resolved.originalimage) {
    const search = (await fetchJson(
      `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&namespace=0&format=json`,
    )) as unknown[] | null
    const firstTitle =
      Array.isArray(search) && Array.isArray(search[1])
        ? String(search[1][0] ?? '')
        : ''
    if (firstTitle && firstTitle !== query) {
      resolved = (await fetchJson(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(firstTitle.replace(/\s+/g, '_'))}`,
      )) as typeof summary
    }
  }

  if (!resolved) return []
  const url = resolved.originalimage?.source || resolved.thumbnail?.source
  if (!url) return []
  return [
    {
      url,
      thumbUrl: resolved.thumbnail?.source,
      caption: resolved.title || query,
      source: 'wikimedia',
      provenance: 'inferred',
    },
  ]
}

/** Optional Google Custom Search Image API */
async function fromGoogleCse(query: string): Promise<EntityImage[]> {
  const key = process.env.GOOGLE_CSE_KEY?.trim()
  const cx = process.env.GOOGLE_CSE_CX?.trim()
  if (!key || !cx || !query) return []

  const url =
    `https://www.googleapis.com/customsearch/v1?` +
    new URLSearchParams({
      key,
      cx,
      q: query,
      searchType: 'image',
      num: '4',
      safe: 'active',
    }).toString()

  const data = (await fetchJson(url)) as {
    items?: { link?: string; title?: string; image?: { thumbnailLink?: string } }[]
  } | null
  if (!data?.items?.length) return []

  return data.items
    .filter((i) => typeof i.link === 'string' && i.link.length > 0)
    .map((i) => ({
      url: i.link as string,
      thumbUrl: i.image?.thumbnailLink,
      caption: i.title,
      source: 'cse' as const,
      provenance: 'inferred' as const,
    }))
}

/** Convert grounding page URLs into image candidates via Wikimedia when possible */
async function fromGroundingUrls(urls: string[]): Promise<EntityImage[]> {
  const out: EntityImage[] = []
  for (const u of urls.slice(0, 4)) {
    try {
      const parsed = new URL(u)
      if (
        parsed.hostname.endsWith('wikipedia.org') &&
        parsed.pathname.includes('/wiki/')
      ) {
        const title = decodeURIComponent(
          parsed.pathname.split('/wiki/')[1] ?? '',
        ).replace(/_/g, ' ')
        if (title) {
          out.push(...(await fromWikimedia(title)))
        }
      }
    } catch {
      // ignore bad URLs
    }
  }
  return out
}

/**
 * Server-side layered image enrichment:
 * grounding → Wikimedia → optional Google CSE.
 */
export async function enrichMedia(
  input: ServerEnrichInput,
): Promise<EntityImage[]> {
  const q = queryFor(input)
  const parts = await Promise.all([
    input.groundingUrls?.length
      ? fromGroundingUrls(input.groundingUrls)
      : Promise.resolve([] as EntityImage[]),
    fromWikimedia(q),
    fromGoogleCse(q),
  ])
  return dedupe(parts.flat())
}
