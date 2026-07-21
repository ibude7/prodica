import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'

import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createVertex } from '@ai-sdk/google-vertex'
import { generateText, type LanguageModel } from 'ai'
import { OAuth2Client } from 'google-auth-library'

import { coerceLlmPayload } from '../src/domain/coerceLlm'
import {
  identifiedEntityLlmSchema,
  type IdentifiedEntityLlm,
} from '../src/domain/entitySchema'
import { llmToIdentifiedEntity } from '../src/domain/intelligence'
import type { IdentifiedEntity, ScanSource } from '../src/domain/types'
import {
  DEFAULT_GEMINI_MODEL,
  DEFAULT_VERTEX_LOCATION,
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
- warnings: safety, legal age, allergen, or uncertainty flags when relevant.
- Return one JSON object only (no markdown).`

function geminiApiKey(): string | undefined {
  return (
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    undefined
  )
}

function vertexProject(): string {
  return (
    process.env.GOOGLE_CLOUD_PROJECT?.trim() ||
    process.env.GOOGLE_VERTEX_PROJECT?.trim() ||
    process.env.GCLOUD_PROJECT?.trim() ||
    process.env.VITE_FIREBASE_PROJECT_ID?.trim() ||
    FIREBASE_DEFAULTS.projectId
  )
}

function vertexLocation(): string {
  return (
    process.env.GOOGLE_CLOUD_LOCATION?.trim() ||
    process.env.GOOGLE_VERTEX_LOCATION?.trim() ||
    process.env.VITE_FIREBASE_VERTEX_LOCATION?.trim() ||
    DEFAULT_VERTEX_LOCATION
  )
}

function modelId(): string {
  return (
    process.env.GEMINI_MODEL?.trim() ||
    process.env.VITE_FIREBASE_AI_MODEL?.trim() ||
    DEFAULT_GEMINI_MODEL
  )
}

/** Prefer gcloud user ADC when org policy blocks service-account keys. */
function gcloudAccessToken(): string {
  return execFileSync('gcloud', ['auth', 'print-access-token'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
}

function vertexAuthOptions() {
  if (
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.GOOGLE_CLIENT_EMAIL ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ||
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  ) {
    // ADC / SA JSON (file path or written by ensureGoogleApplicationCredentials)
    return undefined
  }

  // Local only: mint tokens via logged-in gcloud CLI (not available on Render).
  try {
    gcloudAccessToken()
  } catch {
    return undefined
  }
  const client = new OAuth2Client()
  client.getAccessToken = async () => ({ token: gcloudAccessToken() })
  return { authClient: client }
}

/**
 * Prefer Vertex AI (billing-enabled). Falls back to Gemini Developer API key,
 * then Vercel AI Gateway.
 */
function resolveModel(): LanguageModel {
  const useVertex =
    process.env.VERTEX_AI !== '0' &&
    process.env.GEMINI_PROVIDER?.trim() !== 'google-ai'

  if (useVertex) {
    const vertex = createVertex({
      project: vertexProject(),
      location: vertexLocation(),
      googleAuthOptions: vertexAuthOptions(),
    })
    return vertex(modelId())
  }

  const geminiKey = geminiApiKey()
  if (geminiKey) {
    const google = createGoogleGenerativeAI({ apiKey: geminiKey })
    return google(modelId())
  }

  if (process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN) {
    return 'openai/gpt-5.4'
  }

  throw new Error(
    'No server vision backend. Use Vertex (gcloud auth login / GOOGLE_APPLICATION_CREDENTIALS) or set GEMINI_API_KEY / AI_GATEWAY_API_KEY.',
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
    'Identify the primary subject in this image and return structured JSON matching the Prodica entity schema (kind, name, summary, confidence, tags, warnings, scanNotes, facets).',
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

  const text = result.text?.trim()
  if (!text) {
    throw new Error('Model returned no structured identification.')
  }

  let parsed: unknown
  try {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
    parsed = JSON.parse(fenced?.[1]?.trim() || text)
  } catch {
    throw new Error('Model returned non-JSON identification.')
  }

  const coerced = coerceLlmPayload(parsed)
  const validated = identifiedEntityLlmSchema.safeParse(coerced)
  if (!validated.success) {
    throw new Error(
      `Identification failed schema: ${validated.error.issues[0]?.message ?? 'invalid'}`,
    )
  }

  const normalized = ensureId(validated.data, input.imageBuffer)
  const source: ScanSource =
    input.barcode || input.ocrText?.trim() ? 'combined' : 'visual'
  return llmToIdentifiedEntity(normalized, source)
}

function ensureId(raw: IdentifiedEntityLlm, buf: Buffer): IdentifiedEntityLlm {
  if (raw.id?.trim()) return raw
  const hash = createHash('sha256').update(buf).digest('hex').slice(0, 8)
  return { ...raw, id: `vision-${raw.kind}-${hash}` }
}
