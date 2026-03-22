import type { LookupRequest, ProductResult } from '../domain/types'
import { lookupProduct } from '../services/productLookup'
import {
  lookupOpenFoodFactsByBarcode,
  searchOpenFoodFactsByText,
} from '../services/openFoodFacts'

function resolveLookupUrl(): string {
  const base = import.meta.env.VITE_API_BASE
  if (typeof base === 'string' && base.length > 0) {
    return `${base.replace(/\/$/, '')}/v1/products/lookup`
  }
  if (import.meta.env.DEV) {
    return '/api/v1/products/lookup'
  }
  return '/v1/products/lookup'
}

/**
 * Calls the HTTP lookup API when configured (dev proxy or `VITE_API_BASE`),
 * otherwise resolves against the in-memory mock catalog in the browser.
 */
export async function fetchProductLookup(
  request: LookupRequest,
): Promise<ProductResult | null> {
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
    const data = (await res.json()) as { product: ProductResult | null }
    return data.product ?? null
  } catch {
    let product = lookupProduct(request)
    if (!product && request.kind === 'barcode') {
      product = await lookupOpenFoodFactsByBarcode(request.code)
    }
    if (!product && request.kind === 'ocr') {
      product = await searchOpenFoodFactsByText(request.text)
    }
    return product
  }
}
