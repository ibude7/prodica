import type { EntityImage, IdentifiedEntity } from './types'

/** Ensure runtime entities always have fields the UI assumes exist. */
export function normalizeIdentifiedEntity(
  entity: IdentifiedEntity,
): IdentifiedEntity {
  const images = Array.isArray(entity.images)
    ? (entity.images.filter(
        (img): img is EntityImage =>
          !!img && typeof img === 'object' && typeof img.url === 'string',
      ) as EntityImage[])
    : []

  const nameValue =
    entity.name && typeof entity.name === 'object'
      ? entity.name
      : {
          value: typeof entity.name === 'string' ? entity.name : 'Unknown',
          provenance: 'inferred' as const,
        }

  const subtitleValue =
    entity.subtitle && typeof entity.subtitle === 'object'
      ? entity.subtitle
      : {
          value:
            typeof entity.subtitle === 'string' ? entity.subtitle : null,
          provenance: 'inferred' as const,
        }

  return {
    ...entity,
    name: nameValue,
    subtitle: subtitleValue,
    tags: Array.isArray(entity.tags) ? entity.tags : [],
    warnings: Array.isArray(entity.warnings) ? entity.warnings : [],
    images,
    confidenceLevel: entity.confidenceLevel ?? 'medium',
    source: entity.source ?? 'visual',
  } as IdentifiedEntity
}
