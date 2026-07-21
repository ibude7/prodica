import type { Request, Response } from 'express'

const MAX_BYTES = 4 * 1024 * 1024
const FETCH_MS = 8_000

const ALLOWED_HOST_SUFFIXES = [
  'openfoodfacts.org',
  'openfoodfacts.net',
  'wikimedia.org',
  'wikipedia.org',
  'upload.wikimedia.org',
  'googleusercontent.com',
  'gstatic.com',
  'ggpht.com',
  'ytimg.com',
  'amazonaws.com',
  'cloudfront.net',
  'openlibrary.org',
  'covers.openlibrary.org',
]

function isAllowedHost(hostname: string): boolean {
  const host = hostname.toLowerCase()
  if (host === 'localhost' || host === '127.0.0.1') return false
  return ALLOWED_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`),
  )
}

/**
 * Stream a remote image through the API to avoid CORS / hotlink issues.
 * GET /v1/image?url=<encoded>
 */
export async function handleImageProxy(
  req: Request,
  res: Response,
): Promise<void> {
  const raw = typeof req.query.url === 'string' ? req.query.url : ''
  if (!raw) {
    res.status(400).json({ error: 'Missing url query param' })
    return
  }

  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    res.status(400).json({ error: 'Invalid url' })
    return
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    res.status(400).json({ error: 'Unsupported protocol' })
    return
  }
  if (!isAllowedHost(parsed.hostname)) {
    res.status(403).json({ error: 'Host not allowed' })
    return
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      signal: AbortSignal.timeout(FETCH_MS),
      headers: {
        Accept: 'image/*,*/*',
        'User-Agent': 'Prodica/1.0 (https://github.com/ibude7/prodica)',
      },
      redirect: 'follow',
    })
    if (!upstream.ok) {
      res.status(upstream.status === 404 ? 404 : 502).json({
        error: `Upstream ${upstream.status}`,
      })
      return
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg'
    if (!contentType.startsWith('image/')) {
      res.status(415).json({ error: 'Not an image' })
      return
    }

    const buf = Buffer.from(await upstream.arrayBuffer())
    if (buf.byteLength > MAX_BYTES) {
      res.status(413).json({ error: 'Image too large' })
      return
    }

    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable')
    res.setHeader('Content-Length', String(buf.byteLength))
    res.send(buf)
  } catch (e) {
    console.error('image proxy failed', e)
    res.status(502).json({ error: 'Failed to fetch image' })
  }
}
