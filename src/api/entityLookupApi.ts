import type { IdentifiedEntity, LookupRequest } from '../domain/types'
import { normalizeIdentifiedEntity } from '../domain/normalizeEntity'
import {
  lookupOpenFoodFactsByBarcode,
  searchOpenFoodFactsByText,
} from '../services/openFoodFacts'
import { apiUrl } from './apiBase'

function normalizeOrNull(
  entity: IdentifiedEntity | null | undefined,
): IdentifiedEntity | null {
  return entity ? normalizeIdentifiedEntity(entity) : null
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
  const url = apiUrl('/v1/entities/lookup')
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
    return normalizeOrNull(data.entity ?? data.product ?? null)
  } catch {
    return normalizeOrNull(await lookupFromOpenFoodFacts(request))
  }
}

/** @deprecated Use fetchEntityLookup */
export const fetchProductLookup = fetchEntityLookup
