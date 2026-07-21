import type { IdentifiedEntity, LookupRequest } from '../domain/types'
import {
  lookupOpenFoodFactsByBarcode,
  searchOpenFoodFactsByText,
} from '../services/openFoodFacts'

function resolveLookupUrl(): string {
  const base = import.meta.env.VITE_API_BASE
  if (typeof base === 'string' && base.length > 0) {
    return `${base.replace(/\/$/, '')}/v1/entities/lookup`
  }
  if (import.meta.env.DEV) {
    return '/api/v1/entities/lookup'
  }
  return '/v1/entities/lookup'
}

async function lookupFromOpenFoodFacts(
  request: LookupRequest,
): Promise<IdentifiedEntity | null> {
  if (request.kind === 'barcode') {
    return lookupOpenFoodFactsByBarcode(request.code)
  }
  if (request.kind === 'ocr') {
    return searchOpenFoodFactsByText(request.text)
  }
  return null
}

/**
 * Calls the HTTP lookup API when available; on failure looks up Open Food Facts
 * directly in the browser.
 */
export async function fetchEntityLookup(
  request: LookupRequest,
): Promise<IdentifiedEntity | null> {
  const url = resolveLookupUrl()
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }
    const data = (await res.json()) as {
      entity?: IdentifiedEntity | null
      product?: IdentifiedEntity | null
    }
    return data.entity ?? data.product ?? null
  } catch {
    return lookupFromOpenFoodFacts(request)
  }
}

/** @deprecated Use fetchEntityLookup */
export const fetchProductLookup = fetchEntityLookup
