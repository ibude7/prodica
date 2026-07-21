/** Render hosts the Express API; Vercel hosts the static SPA. */
const DEFAULT_RENDER_API = 'https://prodica.onrender.com'

/**
 * Resolve API origin for fetch calls.
 * - Dev: Vite proxy prefix `/api`
 * - Vercel (or any host with VITE_API_BASE): absolute API URL
 * - Same-origin Render (API + static): empty string → relative paths
 */
export function resolveApiBase(): string {
  const configured = import.meta.env.VITE_API_BASE
  if (typeof configured === 'string' && configured.length > 0) {
    return configured.replace(/\/$/, '')
  }

  if (import.meta.env.DEV) {
    return '/api'
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host.endsWith('vercel.app') || host === 'localhost' || host === '127.0.0.1') {
      return DEFAULT_RENDER_API
    }
  }

  return ''
}

export function apiUrl(path: string): string {
  const base = resolveApiBase()
  const normalized = path.startsWith('/') ? path : `/${path}`
  return base ? `${base}${normalized}` : normalized
}
