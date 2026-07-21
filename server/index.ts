import path from 'node:path'
import { fileURLToPath } from 'node:url'

import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import multer from 'multer'

import type { IdentifiedEntity, LookupRequest } from '../src/domain/types'
import {
  lookupOpenFoodFactsByBarcode,
  searchOpenFoodFactsByText,
} from '../src/services/openFoodFacts'
import { identifyWithVision } from './identifyWithVision'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')
dotenv.config({ path: path.join(rootDir, '.env') })
dotenv.config({ path: path.join(rootDir, '.env.local'), override: true })

const PORT = Number(process.env.PORT ?? 3030)
const isProd = process.env.NODE_ENV === 'production'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024 },
})

function parseLookupRequest(body: unknown): LookupRequest | null {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>
  if (b.kind === 'barcode') {
    if (typeof b.code !== 'string' || typeof b.signalStrength !== 'number') {
      return null
    }
    return { kind: 'barcode', code: b.code, signalStrength: b.signalStrength }
  }
  if (b.kind === 'ocr') {
    if (typeof b.text !== 'string' || typeof b.quality !== 'number') return null
    return { kind: 'ocr', text: b.text, quality: b.quality }
  }
  if (b.kind === 'visual') {
    if (typeof b.label !== 'string' || typeof b.confidence !== 'number') {
      return null
    }
    return { kind: 'visual', label: b.label, confidence: b.confidence }
  }
  return null
}

const app = express()
if (isProd) {
  app.set('trust proxy', 1)
}
app.use(cors())
app.use(express.json({ limit: '512kb' }))

async function handleEntityLookup(
  req: express.Request,
  res: express.Response,
): Promise<void> {
  const parsed = parseLookupRequest(req.body)
  if (!parsed) {
    res.status(400).json({ error: 'Invalid LookupRequest body' })
    return
  }
  try {
    let entity: IdentifiedEntity | null = null
    if (parsed.kind === 'barcode') {
      entity = await lookupOpenFoodFactsByBarcode(parsed.code)
    } else if (parsed.kind === 'ocr') {
      entity = await searchOpenFoodFactsByText(parsed.text)
    }
    res.json({ entity, product: entity })
  } catch (e) {
    console.error(e)
    res.status(500).json({
      error: e instanceof Error ? e.message : 'Lookup failed',
    })
  }
}

app.post('/v1/entities/lookup', (req, res) => {
  void handleEntityLookup(req, res)
})

/** @deprecated Prefer /v1/entities/lookup */
app.post('/v1/products/lookup', (req, res) => {
  void handleEntityLookup(req, res)
})

app.post('/v1/identify', upload.single('image'), async (req, res) => {
  try {
    const file = req.file
    if (!file?.buffer?.length) {
      res.status(400).json({ error: 'Missing image file field "image"' })
      return
    }
    const ocrText =
      typeof req.body?.ocrText === 'string' ? req.body.ocrText : undefined
    const barcode =
      typeof req.body?.barcode === 'string' ? req.body.barcode : undefined
    const mediaType = file.mimetype || 'image/jpeg'

    const entity = await identifyWithVision({
      imageBuffer: file.buffer,
      mediaType,
      ocrText,
      barcode,
    })
    res.json({ entity })
  } catch (e) {
    console.error(e)
    const message = e instanceof Error ? e.message : 'Identify failed'
    const status =
      message.includes('AI_GATEWAY_API_KEY') ||
      message.includes('GEMINI_API_KEY') ||
      message.includes('No vision API key')
        ? 503
        : 500
    res.status(status).json({ error: message })
  }
})

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'prodica' })
})

if (isProd) {
  const distDir = path.join(__dirname, '../dist')
  app.use(express.static(distDir))
  // SPA fallback so https://prodica.onrender.com serves the Firebase-enabled client
  app.get(/.*/, (req, res, next) => {
    if (req.path.startsWith('/v1/') || req.path === '/health') {
      next()
      return
    }
    res.sendFile(path.join(distDir, 'index.html'), (err) => {
      if (err) next(err)
    })
  })
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(
    `Prodica listening on http://0.0.0.0:${PORT}${isProd ? ' (API + static + Firebase client)' : ' (API only)'}`,
  )
})
