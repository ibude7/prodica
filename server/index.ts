import path from 'node:path'
import { fileURLToPath } from 'node:url'

import cors from 'cors'
import express from 'express'
import type { LookupRequest, ProductResult } from '../src/domain/types'
import { lookupProduct } from '../src/services/productLookup'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT ?? 3030)
const isProd = process.env.NODE_ENV === 'production'

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

app.post('/v1/products/lookup', (req, res) => {
  const parsed = parseLookupRequest(req.body)
  if (!parsed) {
    res.status(400).json({ error: 'Invalid LookupRequest body' })
    return
  }
  const product: ProductResult | null = lookupProduct(parsed)
  res.json({ product })
})

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'prodica' })
})

if (isProd) {
  const distDir = path.join(__dirname, '../dist')
  app.use(express.static(distDir))
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(
    `Prodica listening on http://0.0.0.0:${PORT}${isProd ? ' (API + static)' : ' (API only)'}`,
  )
})
