import type { IdentifiedEntity, LookupRequest } from '../domain/types'

/**
 * Legacy mock-catalog resolver — disabled so scans cannot return demo products.
 * Prefer Open Food Facts / vision identify.
 */
export function lookupProduct(_request: LookupRequest): IdentifiedEntity | null {
  void _request
  return null
}
