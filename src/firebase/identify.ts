import {
  getAI,
  getGenerativeModel,
  Schema,
  VertexAIBackend,
} from 'firebase/ai'

import { coerceLlmPayload } from '../domain/coerceLlm'
import { ENTITY_KINDS, identifiedEntityLlmSchema } from '../domain/entitySchema'
import { llmToIdentifiedEntity } from '../domain/intelligence'
import type { IdentifiedEntity, ScanSource } from '../domain/types'
import { getFirebaseApp } from './app'
import { initFirebaseAppCheck } from './appCheck'
import { DEFAULT_GEMINI_MODEL, DEFAULT_VERTEX_LOCATION } from './defaults'

const SYSTEM_PROMPT = `You are Prodica, a universal visual identification system.
Given a photo (and optional OCR/barcode hints), identify the primary subject.

Rules:
- Pick the best matching kind from the schema. Use "other" only when nothing fits well.
- Fill every applicable facet field deeply. Use null or empty arrays when unknown — never invent barcodes, ISBNs, VINs, or exact catalog IDs.
- If uncertain about a specific identity, lower confidence, say so in scanNotes, and describe what you can see.
- Medical / pet / animal content is informational only — never diagnose or prescribe.
- For sex_position: keep copy factual, tasteful, and non-explicit; include safetyNotes.
- confidence is 0–1. Typical visual ID without a barcode: 0.45–0.85.
- id should be a short slug like "vision-<kind>-<short-name>".
- summary: 1–3 sentences useful to a curious user.
- tags: short searchable labels.
- warnings: safety, legal age, allergen, or uncertainty flags when relevant.
- Return one JSON object matching the response schema exactly.`

const labelValueSchema = Schema.object({
  properties: {
    label: Schema.string(),
    value: Schema.string(),
  },
})

/** Loose facets bag — validated/narrowed by Zod after generation */
const facetsSchema = Schema.object({
  properties: {
    ingredients: Schema.string(),
    allergens: Schema.array({ items: Schema.string() }),
    nutritionFacts: Schema.array({ items: labelValueSchema }),
    contents: Schema.string(),
    origin: Schema.string(),
    storage: Schema.string(),
    pairings: Schema.array({ items: Schema.string() }),
    doNotPair: Schema.array({ items: Schema.string() }),
    abv: Schema.number(),
    style: Schema.string(),
    region: Schema.string(),
    grapesOrGrains: Schema.string(),
    tastingNotes: Schema.array({ items: Schema.string() }),
    servingTemp: Schema.string(),
    activeIngredients: Schema.array({ items: Schema.string() }),
    dosage: Schema.string(),
    contraindications: Schema.array({ items: Schema.string() }),
    sideEffects: Schema.array({ items: Schema.string() }),
    form: Schema.string(),
    benefits: Schema.array({ items: Schema.string() }),
    warnings: Schema.array({ items: Schema.string() }),
    skinTypes: Schema.array({ items: Schema.string() }),
    usage: Schema.string(),
    claims: Schema.array({ items: Schema.string() }),
    useCase: Schema.string(),
    surfaces: Schema.array({ items: Schema.string() }),
    safetyNotes: Schema.array({ items: Schema.string() }),
    authors: Schema.array({ items: Schema.string() }),
    isbn: Schema.string(),
    publisher: Schema.string(),
    year: Schema.number(),
    genre: Schema.array({ items: Schema.string() }),
    pages: Schema.number(),
    synopsis: Schema.string(),
    themes: Schema.array({ items: Schema.string() }),
    directors: Schema.array({ items: Schema.string() }),
    cast: Schema.array({ items: Schema.string() }),
    runtimeMinutes: Schema.number(),
    whereKnownFor: Schema.string(),
    creators: Schema.array({ items: Schema.string() }),
    seasons: Schema.number(),
    artists: Schema.array({ items: Schema.string() }),
    album: Schema.string(),
    duration: Schema.string(),
    label: Schema.string(),
    notableFor: Schema.string(),
    platforms: Schema.array({ items: Schema.string() }),
    developers: Schema.array({ items: Schema.string() }),
    publishers: Schema.array({ items: Schema.string() }),
    make: Schema.string(),
    model: Schema.string(),
    bodyStyle: Schema.string(),
    powertrain: Schema.string(),
    notableSpecs: Schema.array({ items: labelValueSchema }),
    type: Schema.string(),
    materials: Schema.array({ items: Schema.string() }),
    era: Schema.string(),
    dimensionsEstimate: Schema.string(),
    care: Schema.string(),
    brand: Schema.string(),
    category: Schema.string(),
    keySpecs: Schema.array({ items: labelValueSchema }),
    connectivity: Schema.array({ items: Schema.string() }),
    garmentType: Schema.string(),
    sizeEstimate: Schema.string(),
    species: Schema.string(),
    breedEstimate: Schema.string(),
    traits: Schema.array({ items: Schema.string() }),
    careBasics: Schema.array({ items: Schema.string() }),
    ageEstimate: Schema.string(),
    commonName: Schema.string(),
    habitat: Schema.string(),
    conservationStatus: Schema.string(),
    scientificName: Schema.string(),
    lightNeeds: Schema.string(),
    toxicityNotes: Schema.string(),
    artist: Schema.string(),
    medium: Schema.string(),
    subject: Schema.string(),
    significance: Schema.string(),
    location: Schema.string(),
    country: Schema.string(),
    builtOrOpened: Schema.string(),
    visitorTips: Schema.array({ items: Schema.string() }),
    knownFor: Schema.array({ items: Schema.string() }),
    occupation: Schema.string(),
    nationality: Schema.string(),
    lifespan: Schema.string(),
    notableWorks: Schema.array({ items: Schema.string() }),
    commonNames: Schema.array({ items: Schema.string() }),
    difficulty: Schema.string(),
    description: Schema.string(),
    tips: Schema.array({ items: Schema.string() }),
    categoryGuess: Schema.string(),
    attributes: Schema.array({ items: labelValueSchema }),
    relatedTopics: Schema.array({ items: Schema.string() }),
    howToLearnMore: Schema.string(),
  },
  optionalProperties: [
    'ingredients',
    'allergens',
    'nutritionFacts',
    'contents',
    'origin',
    'storage',
    'pairings',
    'doNotPair',
    'abv',
    'style',
    'region',
    'grapesOrGrains',
    'tastingNotes',
    'servingTemp',
    'activeIngredients',
    'dosage',
    'contraindications',
    'sideEffects',
    'form',
    'benefits',
    'warnings',
    'skinTypes',
    'usage',
    'claims',
    'useCase',
    'surfaces',
    'safetyNotes',
    'authors',
    'isbn',
    'publisher',
    'year',
    'genre',
    'pages',
    'synopsis',
    'themes',
    'directors',
    'cast',
    'runtimeMinutes',
    'whereKnownFor',
    'creators',
    'seasons',
    'artists',
    'album',
    'duration',
    'label',
    'notableFor',
    'platforms',
    'developers',
    'publishers',
    'make',
    'model',
    'bodyStyle',
    'powertrain',
    'notableSpecs',
    'type',
    'materials',
    'era',
    'dimensionsEstimate',
    'care',
    'brand',
    'category',
    'keySpecs',
    'connectivity',
    'garmentType',
    'sizeEstimate',
    'species',
    'breedEstimate',
    'traits',
    'careBasics',
    'ageEstimate',
    'commonName',
    'habitat',
    'conservationStatus',
    'scientificName',
    'lightNeeds',
    'toxicityNotes',
    'artist',
    'medium',
    'subject',
    'significance',
    'location',
    'country',
    'builtOrOpened',
    'visitorTips',
    'knownFor',
    'occupation',
    'nationality',
    'lifespan',
    'notableWorks',
    'commonNames',
    'difficulty',
    'description',
    'tips',
    'categoryGuess',
    'attributes',
    'relatedTopics',
    'howToLearnMore',
  ],
})

const entityResponseSchema = Schema.object({
  properties: {
    id: Schema.string(),
    kind: Schema.enumString({ enum: [...ENTITY_KINDS] }),
    name: Schema.string(),
    subtitle: Schema.string(),
    summary: Schema.string(),
    confidence: Schema.number(),
    tags: Schema.array({ items: Schema.string() }),
    warnings: Schema.array({ items: Schema.string() }),
    scanNotes: Schema.string(),
    facets: facetsSchema,
  },
  optionalProperties: ['subtitle', 'scanNotes'],
})

async function blobToInlinePart(blob: Blob): Promise<{
  inlineData: { data: string; mimeType: string }
}> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'))
    reader.readAsDataURL(blob)
  })
  const comma = dataUrl.indexOf(',')
  const data = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl
  return {
    inlineData: {
      data,
      mimeType: blob.type || 'image/jpeg',
    },
  }
}

export async function identifyWithFirebaseAi(input: {
  imageBlob: Blob
  ocrText?: string
  barcode?: string
}): Promise<IdentifiedEntity> {
  await initFirebaseAppCheck()

  const location =
    import.meta.env.VITE_FIREBASE_VERTEX_LOCATION?.trim() ||
    DEFAULT_VERTEX_LOCATION
  const ai = getAI(getFirebaseApp(), {
    backend: new VertexAIBackend(location),
    // Required when Firebase enforces App Check replay protection for AI Logic
    useLimitedUseAppCheckTokens: true,
  })
  const modelName =
    import.meta.env.VITE_FIREBASE_AI_MODEL?.trim() || DEFAULT_GEMINI_MODEL
  const model = getGenerativeModel(ai, {
    model: modelName,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: entityResponseSchema,
    },
  })

  const hintParts: string[] = [
    'Identify the primary subject in this image and return structured JSON.',
  ]
  if (input.barcode) {
    hintParts.push(`Barcode hint (may be unrelated if misread): ${input.barcode}`)
  }
  if (input.ocrText?.trim()) {
    hintParts.push(`OCR text hint:\n${input.ocrText.trim().slice(0, 1200)}`)
  }

  const imagePart = await blobToInlinePart(input.imageBlob)
  const result = await model.generateContent([hintParts.join('\n\n'), imagePart])
  const text = result.response.text()
  if (!text?.trim()) {
    throw new Error('Firebase AI returned an empty response.')
  }

  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(text)
  } catch {
    throw new Error('Firebase AI returned non-JSON output.')
  }

  const coerced = coerceLlmPayload(parsedJson)
  const validated = identifiedEntityLlmSchema.safeParse(coerced)
  if (!validated.success) {
    throw new Error(
      `Firebase AI JSON failed validation: ${validated.error.issues[0]?.message ?? 'invalid'}`,
    )
  }

  const source: ScanSource =
    input.barcode || input.ocrText?.trim() ? 'combined' : 'visual'
  return llmToIdentifiedEntity(validated.data, source)
}
