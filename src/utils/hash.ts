/**
 * Deterministic fingerprint for an image blob — drives mock barcode/OCR/vision paths.
 */
export async function fingerprintBlob(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer()
  const bytes = new Uint8Array(buf)
  let h = 2166136261
  const len = Math.min(bytes.length, 8000)
  for (let i = 0; i < len; i++) {
    h ^= bytes[i]!
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

export function scenarioFromFingerprint(fp: string): number {
  return Number.parseInt(fp.slice(0, 8), 16) % 7
}
