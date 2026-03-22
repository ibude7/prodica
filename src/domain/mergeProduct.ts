import type { ProductResult } from './types'

/** Apply user-confirmed name/brand overrides for display */
export function applyUserCorrections(
  base: ProductResult,
  edits: { name?: string; brand?: string },
): ProductResult {
  let next = base
  if (edits.name !== undefined && edits.name.length > 0) {
    next = {
      ...next,
      name: { value: edits.name, provenance: 'confirmed' },
    }
  }
  if (edits.brand !== undefined && edits.brand.length > 0) {
    next = {
      ...next,
      brand: { value: edits.brand, provenance: 'confirmed' },
    }
  }
  return next
}
