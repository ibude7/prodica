import { createHash } from 'node:crypto'

import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText, Output, type LanguageModel } from 'ai'

import {
  identifiedEntityLlmSchema,
  type IdentifiedEntityLlm,
} from '../src/domain/entitySchema'
import { llmToIdentifiedEntity } from '../src/domain/intelligence'
import type { IdentifiedEntity, ScanSource } from '../src/domain/types'
import {
  DEFAULT_GEMINI_MODEL,
  FIREBASE_DEFAULTS,
} from '../src/firebase/defaults'

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
- warnings: safety, legal age, allergen, or uncertainty flags when relevant.`

/**
 * Gemini Developer API key resolution for Render/server.
 * Prefer explicit env; fall back to Firebase project web API key (prodica1).
 */
function geminiApiKey(): string | undefined {
  // Prefer Firebase project web key (Gemini Developer API via prodica1),
  // then explicit Gemini/AI Studio keys, so a denied Studio key on Render
  // does not override the working Firebase key.
  return (
    process.env.FIREBASE_API_KEY ||
    process.env.VITE_FIREBASE_API_KEY ||
    FIREBASE_DEFAULTS.apiKey ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    undefined
  )
}

function resolveModel(): LanguageModel {
  const geminiKey = geminiApiKey()
  if (geminiKey) {
    const google = createGoogleGenerativeAI({ apiKey: geminiKey })
    return google(
      process.env.GEMINI_MODEL?.trim() ||
        process.env.VITE_FIREBASE_AI_MODEL?.trim() ||
        DEFAULT_GEMINI_MODEL,
    )
  }

  if (process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN) {
    return 'openai/gpt-5.4'
  }

  throw new Error(
    'No vision API key configured. Set GEMINI_API_KEY / FIREBASE_API_KEY or AI_GATEWAY_API_KEY on the server.',
  )
}

export async function identifyWithVision(input: {
  imageBuffer: Buffer
  mediaType: string
  ocrText?: string
  barcode?: string
}): Promise<IdentifiedEntity> {
  const model = resolveModel()

  const hintParts: string[] = [
    'Identify the primary subject in this image and return structured data.',
  ]
  if (input.barcode) {
    hintParts.push(`Barcode hint (may be unrelated if misread): ${input.barcode}`)
  }
  if (input.ocrText?.trim()) {
    const clipped = input.ocrText.trim().slice(0, 1200)
    hintParts.push(`OCR text hint:\n${clipped}`)
  }

  const result = await generateText({
    model,
    output: Output.object({ schema: identifiedEntityLlmSchema }),
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', image: input.imageBuffer, mediaType: input.mediaType },
          { type: 'text', text: hintParts.join('\n\n') },
        ],
      },
    ],
  })

  const raw = result.output
  if (!raw) {
    throw new Error('Model returned no structured identification.')
  }

  const normalized = ensureId(raw, input.imageBuffer)
  const source: ScanSource =
    input.barcode || input.ocrText?.trim() ? 'combined' : 'visual'
  return llmToIdentifiedEntity(normalized, source)
}

function ensureId(raw: IdentifiedEntityLlm, buf: Buffer): IdentifiedEntityLlm {
  if (raw.id?.trim()) return raw
  const hash = createHash('sha256').update(buf).digest('hex').slice(0, 8)
  return { ...raw, id: `vision-${raw.kind}-${hash}` }
}
