import { ENTITY_KINDS, type EntityKind } from './entitySchema'

function arr(v?: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === 'string')
}

function labelValues(v?: unknown): { label: string; value: string }[] {
  if (!Array.isArray(v)) return []
  return v
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .map((x) => ({
      label: typeof x.label === 'string' ? x.label : '',
      value:
        typeof x.value === 'string'
          ? x.value
          : x.value == null
            ? ''
            : String(x.value),
    }))
}

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

function str(v: unknown): string | null {
  return typeof v === 'string' ? v : null
}

/** artwork.year is string | null in schema */
function yearField(v: unknown): string | number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') return v
  return null
}

export function emptyFacetsForKind(kind: EntityKind): Record<string, unknown> {
  const a = () => [] as string[]
  const lv = () => [] as { label: string; value: string }[]
  switch (kind) {
    case 'food':
      return {
        ingredients: null,
        allergens: a(),
        nutritionFacts: lv(),
        contents: null,
        origin: null,
        storage: null,
        pairings: a(),
        doNotPair: a(),
      }
    case 'alcohol':
      return {
        abv: null,
        style: null,
        region: null,
        grapesOrGrains: null,
        tastingNotes: a(),
        pairings: a(),
        servingTemp: null,
        contents: null,
        origin: null,
        ingredients: null,
      }
    case 'medicine':
      return {
        activeIngredients: a(),
        dosage: null,
        contraindications: a(),
        sideEffects: a(),
        storage: null,
        form: null,
        contents: null,
      }
    case 'supplement':
      return {
        activeIngredients: a(),
        dosage: null,
        benefits: a(),
        warnings: a(),
        contents: null,
      }
    case 'cosmetic':
      return {
        ingredients: null,
        skinTypes: a(),
        usage: null,
        claims: a(),
        contents: null,
      }
    case 'household':
      return {
        useCase: null,
        ingredients: null,
        surfaces: a(),
        safetyNotes: a(),
        contents: null,
      }
    case 'book':
      return {
        authors: a(),
        isbn: null,
        publisher: null,
        year: null,
        genre: a(),
        pages: null,
        synopsis: null,
        themes: a(),
      }
    case 'movie':
      return {
        year: null,
        directors: a(),
        cast: a(),
        genre: a(),
        runtimeMinutes: null,
        synopsis: null,
        whereKnownFor: null,
      }
    case 'tv_show':
      return {
        year: null,
        creators: a(),
        cast: a(),
        genre: a(),
        seasons: null,
        synopsis: null,
        whereKnownFor: null,
      }
    case 'song':
      return {
        artists: a(),
        album: null,
        year: null,
        genre: a(),
        duration: null,
        label: null,
        notableFor: null,
      }
    case 'game':
      return {
        platforms: a(),
        developers: a(),
        publishers: a(),
        year: null,
        genre: a(),
        synopsis: null,
      }
    case 'automobile':
      return {
        make: null,
        model: null,
        year: null,
        bodyStyle: null,
        powertrain: null,
        notableSpecs: lv(),
      }
    case 'furniture':
      return {
        type: null,
        materials: a(),
        style: null,
        era: null,
        dimensionsEstimate: null,
        care: null,
      }
    case 'electronics':
      return {
        brand: null,
        model: null,
        category: null,
        keySpecs: lv(),
        connectivity: a(),
      }
    case 'clothing':
      return {
        garmentType: null,
        materials: a(),
        style: null,
        sizeEstimate: null,
        care: null,
        brand: null,
      }
    case 'pet':
      return {
        species: null,
        breedEstimate: null,
        traits: a(),
        careBasics: a(),
        ageEstimate: null,
      }
    case 'animal':
      return {
        species: null,
        commonName: null,
        habitat: null,
        traits: a(),
        conservationStatus: null,
      }
    case 'plant':
      return {
        commonName: null,
        scientificName: null,
        careBasics: a(),
        lightNeeds: null,
        toxicityNotes: null,
      }
    case 'artwork':
      return {
        artist: null,
        medium: null,
        year: null,
        style: null,
        subject: null,
        significance: null,
      }
    case 'landmark':
      return {
        location: null,
        country: null,
        builtOrOpened: null,
        significance: null,
        visitorTips: a(),
      }
    case 'person':
      return {
        knownFor: a(),
        occupation: null,
        nationality: null,
        lifespan: null,
        notableWorks: a(),
      }
    case 'sex_position':
      return {
        commonNames: a(),
        difficulty: null,
        description: null,
        tips: a(),
        safetyNotes: a(),
      }
    case 'other':
    default:
      return {
        categoryGuess: null,
        attributes: lv(),
        relatedTopics: a(),
        howToLearnMore: null,
      }
  }
}

const STRING_ARRAY_KEYS = new Set([
  'allergens',
  'pairings',
  'doNotPair',
  'tastingNotes',
  'activeIngredients',
  'contraindications',
  'sideEffects',
  'benefits',
  'warnings',
  'skinTypes',
  'claims',
  'surfaces',
  'safetyNotes',
  'authors',
  'genre',
  'themes',
  'directors',
  'cast',
  'creators',
  'artists',
  'platforms',
  'developers',
  'publishers',
  'materials',
  'connectivity',
  'traits',
  'careBasics',
  'visitorTips',
  'knownFor',
  'notableWorks',
  'commonNames',
  'tips',
  'relatedTopics',
])

const LABEL_VALUE_KEYS = new Set([
  'nutritionFacts',
  'notableSpecs',
  'keySpecs',
  'attributes',
])

const NUMBER_KEYS = new Set([
  'abv',
  'year',
  'pages',
  'runtimeMinutes',
  'seasons',
])

function normalizeFacetValue(
  kind: EntityKind,
  key: string,
  value: unknown,
): unknown {
  if (LABEL_VALUE_KEYS.has(key)) return labelValues(value)
  if (STRING_ARRAY_KEYS.has(key)) return arr(value)
  if (key === 'year' && kind === 'artwork') return yearField(value)
  if (NUMBER_KEYS.has(key)) return num(value)
  if (value === undefined) return null
  if (value === null || typeof value === 'string' || typeof value === 'number') {
    return value
  }
  return str(value)
}

/** Coerce messy LLM JSON into something Zod can validate. */
export function coerceLlmPayload(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw
  const o = raw as Record<string, unknown>
  const kind: EntityKind =
    typeof o.kind === 'string' &&
    (ENTITY_KINDS as readonly string[]).includes(o.kind)
      ? (o.kind as EntityKind)
      : 'other'
  const baseFacets = emptyFacetsForKind(kind)
  const incoming =
    o.facets && typeof o.facets === 'object'
      ? (o.facets as Record<string, unknown>)
      : {}
  const facets: Record<string, unknown> = { ...baseFacets }
  for (const key of Object.keys(baseFacets)) {
    facets[key] = normalizeFacetValue(
      kind,
      key,
      key in incoming ? incoming[key] : baseFacets[key],
    )
  }

  const confidenceRaw = o.confidence
  const confidence =
    typeof confidenceRaw === 'number' && Number.isFinite(confidenceRaw)
      ? Math.min(1, Math.max(0, confidenceRaw))
      : 0.5

  const name =
    typeof o.name === 'string' && o.name.trim() ? o.name : 'Unknown'
  return {
    id: typeof o.id === 'string' && o.id.trim() ? o.id : `vision-${kind}`,
    kind,
    name,
    subtitle: str(o.subtitle),
    summary: typeof o.summary === 'string' ? o.summary : '',
    confidence,
    tags: arr(o.tags),
    warnings: arr(o.warnings),
    scanNotes: str(o.scanNotes),
    imageQuery: str(o.imageQuery) ?? name,
    facets,
  }
}
