import { z } from 'zod'

export const ENTITY_KINDS = [
  'food',
  'alcohol',
  'medicine',
  'supplement',
  'cosmetic',
  'household',
  'book',
  'movie',
  'tv_show',
  'song',
  'game',
  'automobile',
  'furniture',
  'electronics',
  'clothing',
  'pet',
  'animal',
  'plant',
  'artwork',
  'landmark',
  'person',
  'sex_position',
  'other',
] as const

export const entityKindSchema = z.enum(ENTITY_KINDS)

const labelValue = z.object({
  label: z.string(),
  value: z.string(),
})

const foodFacetsSchema = z.object({
  ingredients: z.string().nullable(),
  allergens: z.array(z.string()),
  nutritionFacts: z.array(labelValue),
  contents: z.string().nullable(),
  origin: z.string().nullable(),
  storage: z.string().nullable(),
  pairings: z.array(z.string()),
  doNotPair: z.array(z.string()),
})

const alcoholFacetsSchema = z.object({
  abv: z.number().nullable(),
  style: z.string().nullable(),
  region: z.string().nullable(),
  grapesOrGrains: z.string().nullable(),
  tastingNotes: z.array(z.string()),
  pairings: z.array(z.string()),
  servingTemp: z.string().nullable(),
  contents: z.string().nullable(),
  origin: z.string().nullable(),
  ingredients: z.string().nullable(),
})

const medicineFacetsSchema = z.object({
  activeIngredients: z.array(z.string()),
  dosage: z.string().nullable(),
  contraindications: z.array(z.string()),
  sideEffects: z.array(z.string()),
  storage: z.string().nullable(),
  form: z.string().nullable(),
  contents: z.string().nullable(),
})

const supplementFacetsSchema = z.object({
  activeIngredients: z.array(z.string()),
  dosage: z.string().nullable(),
  benefits: z.array(z.string()),
  warnings: z.array(z.string()),
  contents: z.string().nullable(),
})

const cosmeticFacetsSchema = z.object({
  ingredients: z.string().nullable(),
  skinTypes: z.array(z.string()),
  usage: z.string().nullable(),
  claims: z.array(z.string()),
  contents: z.string().nullable(),
})

const householdFacetsSchema = z.object({
  useCase: z.string().nullable(),
  ingredients: z.string().nullable(),
  surfaces: z.array(z.string()),
  safetyNotes: z.array(z.string()),
  contents: z.string().nullable(),
})

const bookFacetsSchema = z.object({
  authors: z.array(z.string()),
  isbn: z.string().nullable(),
  publisher: z.string().nullable(),
  year: z.number().nullable(),
  genre: z.array(z.string()),
  pages: z.number().nullable(),
  synopsis: z.string().nullable(),
  themes: z.array(z.string()),
})

const movieFacetsSchema = z.object({
  year: z.number().nullable(),
  directors: z.array(z.string()),
  cast: z.array(z.string()),
  genre: z.array(z.string()),
  runtimeMinutes: z.number().nullable(),
  synopsis: z.string().nullable(),
  whereKnownFor: z.string().nullable(),
})

const tvShowFacetsSchema = z.object({
  year: z.number().nullable(),
  creators: z.array(z.string()),
  cast: z.array(z.string()),
  genre: z.array(z.string()),
  seasons: z.number().nullable(),
  synopsis: z.string().nullable(),
  whereKnownFor: z.string().nullable(),
})

const songFacetsSchema = z.object({
  artists: z.array(z.string()),
  album: z.string().nullable(),
  year: z.number().nullable(),
  genre: z.array(z.string()),
  duration: z.string().nullable(),
  label: z.string().nullable(),
  notableFor: z.string().nullable(),
})

const gameFacetsSchema = z.object({
  platforms: z.array(z.string()),
  developers: z.array(z.string()),
  publishers: z.array(z.string()),
  year: z.number().nullable(),
  genre: z.array(z.string()),
  synopsis: z.string().nullable(),
})

const automobileFacetsSchema = z.object({
  make: z.string().nullable(),
  model: z.string().nullable(),
  year: z.number().nullable(),
  bodyStyle: z.string().nullable(),
  powertrain: z.string().nullable(),
  notableSpecs: z.array(labelValue),
})

const furnitureFacetsSchema = z.object({
  type: z.string().nullable(),
  materials: z.array(z.string()),
  style: z.string().nullable(),
  era: z.string().nullable(),
  dimensionsEstimate: z.string().nullable(),
  care: z.string().nullable(),
})

const electronicsFacetsSchema = z.object({
  brand: z.string().nullable(),
  model: z.string().nullable(),
  category: z.string().nullable(),
  keySpecs: z.array(labelValue),
  connectivity: z.array(z.string()),
})

const clothingFacetsSchema = z.object({
  garmentType: z.string().nullable(),
  materials: z.array(z.string()),
  style: z.string().nullable(),
  sizeEstimate: z.string().nullable(),
  care: z.string().nullable(),
  brand: z.string().nullable(),
})

const petFacetsSchema = z.object({
  species: z.string().nullable(),
  breedEstimate: z.string().nullable(),
  traits: z.array(z.string()),
  careBasics: z.array(z.string()),
  ageEstimate: z.string().nullable(),
})

const animalFacetsSchema = z.object({
  species: z.string().nullable(),
  commonName: z.string().nullable(),
  habitat: z.string().nullable(),
  traits: z.array(z.string()),
  conservationStatus: z.string().nullable(),
})

const plantFacetsSchema = z.object({
  commonName: z.string().nullable(),
  scientificName: z.string().nullable(),
  careBasics: z.array(z.string()),
  lightNeeds: z.string().nullable(),
  toxicityNotes: z.string().nullable(),
})

const artworkFacetsSchema = z.object({
  artist: z.string().nullable(),
  medium: z.string().nullable(),
  year: z.string().nullable(),
  style: z.string().nullable(),
  subject: z.string().nullable(),
  significance: z.string().nullable(),
})

const landmarkFacetsSchema = z.object({
  location: z.string().nullable(),
  country: z.string().nullable(),
  builtOrOpened: z.string().nullable(),
  significance: z.string().nullable(),
  visitorTips: z.array(z.string()),
})

const personFacetsSchema = z.object({
  knownFor: z.array(z.string()),
  occupation: z.string().nullable(),
  nationality: z.string().nullable(),
  lifespan: z.string().nullable(),
  notableWorks: z.array(z.string()),
})

const sexPositionFacetsSchema = z.object({
  commonNames: z.array(z.string()),
  difficulty: z.string().nullable(),
  description: z.string().nullable(),
  tips: z.array(z.string()),
  safetyNotes: z.array(z.string()),
})

const otherFacetsSchema = z.object({
  categoryGuess: z.string().nullable(),
  attributes: z.array(labelValue),
  relatedTopics: z.array(z.string()),
  howToLearnMore: z.string().nullable(),
})

const coreFields = {
  id: z.string(),
  name: z.string(),
  subtitle: z.string().nullable(),
  summary: z.string(),
  confidence: z.number().min(0).max(1),
  tags: z.array(z.string()),
  warnings: z.array(z.string()),
  scanNotes: z.string().nullable(),
}

/** LLM / API output schema — plain values; provenance applied when mapping to IdentifiedEntity */
export const identifiedEntityLlmSchema = z.discriminatedUnion('kind', [
  z.object({ ...coreFields, kind: z.literal('food'), facets: foodFacetsSchema }),
  z.object({
    ...coreFields,
    kind: z.literal('alcohol'),
    facets: alcoholFacetsSchema,
  }),
  z.object({
    ...coreFields,
    kind: z.literal('medicine'),
    facets: medicineFacetsSchema,
  }),
  z.object({
    ...coreFields,
    kind: z.literal('supplement'),
    facets: supplementFacetsSchema,
  }),
  z.object({
    ...coreFields,
    kind: z.literal('cosmetic'),
    facets: cosmeticFacetsSchema,
  }),
  z.object({
    ...coreFields,
    kind: z.literal('household'),
    facets: householdFacetsSchema,
  }),
  z.object({ ...coreFields, kind: z.literal('book'), facets: bookFacetsSchema }),
  z.object({
    ...coreFields,
    kind: z.literal('movie'),
    facets: movieFacetsSchema,
  }),
  z.object({
    ...coreFields,
    kind: z.literal('tv_show'),
    facets: tvShowFacetsSchema,
  }),
  z.object({ ...coreFields, kind: z.literal('song'), facets: songFacetsSchema }),
  z.object({ ...coreFields, kind: z.literal('game'), facets: gameFacetsSchema }),
  z.object({
    ...coreFields,
    kind: z.literal('automobile'),
    facets: automobileFacetsSchema,
  }),
  z.object({
    ...coreFields,
    kind: z.literal('furniture'),
    facets: furnitureFacetsSchema,
  }),
  z.object({
    ...coreFields,
    kind: z.literal('electronics'),
    facets: electronicsFacetsSchema,
  }),
  z.object({
    ...coreFields,
    kind: z.literal('clothing'),
    facets: clothingFacetsSchema,
  }),
  z.object({ ...coreFields, kind: z.literal('pet'), facets: petFacetsSchema }),
  z.object({
    ...coreFields,
    kind: z.literal('animal'),
    facets: animalFacetsSchema,
  }),
  z.object({
    ...coreFields,
    kind: z.literal('plant'),
    facets: plantFacetsSchema,
  }),
  z.object({
    ...coreFields,
    kind: z.literal('artwork'),
    facets: artworkFacetsSchema,
  }),
  z.object({
    ...coreFields,
    kind: z.literal('landmark'),
    facets: landmarkFacetsSchema,
  }),
  z.object({
    ...coreFields,
    kind: z.literal('person'),
    facets: personFacetsSchema,
  }),
  z.object({
    ...coreFields,
    kind: z.literal('sex_position'),
    facets: sexPositionFacetsSchema,
  }),
  z.object({
    ...coreFields,
    kind: z.literal('other'),
    facets: otherFacetsSchema,
  }),
])

export type IdentifiedEntityLlm = z.infer<typeof identifiedEntityLlmSchema>
export type EntityKind = z.infer<typeof entityKindSchema>
