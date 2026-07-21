import type { IdentifiedEntity } from './types'

/** Apply user-confirmed name/subtitle overrides for display */
export function applyUserCorrections(
  base: IdentifiedEntity,
  edits: { name?: string; subtitle?: string },
): IdentifiedEntity {
  let next = base
  if (edits.name !== undefined && edits.name.length > 0) {
    next = {
      ...next,
      name: { value: edits.name, provenance: 'confirmed' },
    }
  }
  if (edits.subtitle !== undefined && edits.subtitle.length > 0) {
    next = {
      ...next,
      subtitle: { value: edits.subtitle, provenance: 'confirmed' },
    }
  }
  return next
}
