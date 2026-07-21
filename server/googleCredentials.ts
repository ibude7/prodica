import { mkdirSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

/**
 * Render/Vercel can't use `gcloud` CLI. Support embedding ADC / SA JSON in env:
 *   GOOGLE_APPLICATION_CREDENTIALS_JSON='{"type":"authorized_user",...}'
 * or GOOGLE_SERVICE_ACCOUNT_JSON=...
 * Writes to a temp file and sets GOOGLE_APPLICATION_CREDENTIALS.
 */
export function ensureGoogleApplicationCredentials(): void {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()) return

  const raw =
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim() ||
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim()
  if (!raw) return

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error(
      'GOOGLE_APPLICATION_CREDENTIALS_JSON / GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON',
    )
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Google credentials JSON must be an object')
  }

  const dir = path.join(os.tmpdir(), 'prodica-gcp')
  mkdirSync(dir, { recursive: true })
  const file = path.join(dir, 'credentials.json')
  writeFileSync(file, JSON.stringify(parsed), { mode: 0o600 })
  process.env.GOOGLE_APPLICATION_CREDENTIALS = file
}
