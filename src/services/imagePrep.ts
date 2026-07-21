/** Downscale / recompress capture before vision upload (faster network + model). */
export async function prepareImageForVision(
  blob: Blob,
  opts?: { maxEdge?: number; quality?: number },
): Promise<Blob> {
  const maxEdge = opts?.maxEdge ?? 1280
  const quality = opts?.quality ?? 0.82

  // Tiny already — skip
  if (blob.size < 180_000 && blob.type === 'image/jpeg') {
    return blob
  }

  try {
    const bitmap = await createImageBitmap(blob)
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
    if (scale >= 0.98 && blob.type === 'image/jpeg' && blob.size < 700_000) {
      bitmap.close()
      return blob
    }
    const w = Math.max(1, Math.round(bitmap.width * scale))
    const h = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close()
      return blob
    }
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close()

    const out = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', quality),
    )
    return out && out.size < blob.size ? out : blob
  } catch {
    return blob
  }
}
