import { emptyFacetsForKind } from './coerceLlm'
import type { EntityKind } from './entitySchema'
import { ENTITY_KINDS } from './entitySchema'
import type { EntityImage, IdentifiedEntity } from './types'

function asField(
  raw: unknown,
  fallback: string | null,
): { value: string | null; provenance: 'confirmed' | 'inferred' } {
  if (raw && typeof raw === 'object' && 'value' in raw) {
    const v = (raw as { value: unknown }).value
    return {
      value: typeof v === 'string' ? v : v == null ? null : String(v),
      provenance:
        (raw as { provenance?: string }).provenance === 'confirmed'
          ? 'confirmed'
          : 'inferred',
    }
  }
  if (typeof raw === 'string') {
    return { value: raw, provenance: 'inferred' }
  }
  return { value: fallback, provenance: 'inferred' }
}

/** Ensure runtime entities always have fields the UI assumes exist. */
export function normalizeIdentifiedEntity(
  entity: IdentifiedEntity | null | undefined,
): IdentifiedEntity {
  if (!entity || typeof entity !== 'object') {
    return {
      id: 'unknown',
      kind: 'other',
      name: { value: 'Unknown', provenance: 'inferred' },
      subtitle: { value: null, provenance: 'inferred' },
      summary: '',
      confidence: 0.5,
      confidenceLevel: 'medium',
      source: 'visual',
      tags: [],
      warnings: [],
      images: [],
      facets: emptyFacetsForKind('other'),
    } as unknown as IdentifiedEntity
  }

  const kindRaw = (entity as { kind?: unknown }).kind
  const kind: EntityKind =
    typeof kindRaw === 'string' &&
    (ENTITY_KINDS as readonly string[]).includes(kindRaw)
      ? (kindRaw as EntityKind)
      : 'other'

  const images = Array.isArray(entity.images)
    ? entity.images.filter(
        (img): img is EntityImage =>
          !!img &&
          typeof img === 'object' &&
          typeof (img as EntityImage).url === 'string' &&
          (img as EntityImage).url.length > 0,
      )
    : []

  const facetsIn =
    entity.facets && typeof entity.facets === 'object' ? entity.facets : null
  const baseFacets = emptyFacetsForKind(kind)
  const facets = { ...baseFacets, ...(facetsIn as object) }

  const conf =
    typeof entity.confidence === 'number' && Number.isFinite(entity.confidence)
      ? Math.min(1, Math.max(0, entity.confidence))
      : 0.5

  return {
    ...entity,
    id: typeof entity.id === 'string' && entity.id ? entity.id : `vision-${kind}`,
    kind,
    name: asField(entity.name, 'Unknown'),
    subtitle: asField(entity.subtitle, null),
    summary: typeof entity.summary === 'string' ? entity.summary : '',
    confidence: conf,
    confidenceLevel:
      entity.confidenceLevel === 'high' ||
      entity.confidenceLevel === 'medium' ||
      entity.confidenceLevel === 'low'
        ? entity.confidenceLevel
        : conf >= 0.78
          ? 'high'
          : conf >= 0.45
            ? 'medium'
            : 'low',
    source:
      entity.source === 'barcode' ||
      entity.source === 'ocr' ||
      entity.source === 'visual' ||
      entity.source === 'combined'
        ? entity.source
        : 'visual',
    tags: Array.isArray(entity.tags) ? entity.tags.map(String) : [],
    warnings: Array.isArray(entity.warnings) ? entity.warnings.map(String) : [],
    images,
    facets,
  } as unknown as IdentifiedEntity
}
