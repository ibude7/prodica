import { useCallback, useState } from 'react'
import type { IdentifiedEntity } from '../../domain/types'
import { addScanToHistory } from '../../services/scanHistory'

async function blobFromUrl(url: string): Promise<Blob | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return await res.blob()
  } catch {
    return null
  }
}

function shareText(entity: IdentifiedEntity): string {
  const name = entity.name.value ?? 'Unknown'
  const sub = entity.subtitle.value ? ` (${entity.subtitle.value})` : ''
  return `Prodica identified: ${name}${sub}\n${entity.summary}`
}

export function ShareButton(props: {
  entity: IdentifiedEntity
  onSaved?: () => void
}) {
  const [status, setStatus] = useState<string | null>(null)

  const share = useCallback(async () => {
    const text = shareText(props.entity)
    const title = props.entity.name.value ?? 'Prodica result'
    try {
      const files: File[] = []
      if (props.entity.capturedPhoto) {
        const blob = await blobFromUrl(props.entity.capturedPhoto)
        if (blob) {
          files.push(
            new File([blob], 'prodica-capture.jpg', {
              type: blob.type || 'image/jpeg',
            }),
          )
        }
      }

      if (navigator.share) {
        const data: ShareData = { title, text }
        if (files.length && navigator.canShare?.({ files })) {
          data.files = files
        }
        await navigator.share(data)
        setStatus('Shared')
        return
      }

      await navigator.clipboard.writeText(text)
      setStatus('Copied summary')
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return
      try {
        await navigator.clipboard.writeText(text)
        setStatus('Copied summary')
      } catch {
        setStatus('Share unavailable')
      }
    }
  }, [props.entity])

  const saveHistory = useCallback(async () => {
    try {
      await addScanToHistory(props.entity)
      setStatus('Saved to history')
      props.onSaved?.()
    } catch {
      setStatus('Could not save')
    }
  }, [props])

  const downloadCard = useCallback(async () => {
    const url = props.entity.capturedPhoto || props.entity.images?.[0]?.url
    if (!url) {
      setStatus('No image to download')
      return
    }
    try {
      const blob = await blobFromUrl(url)
      if (!blob) {
        setStatus('Download failed')
        return
      }
      const a = document.createElement('a')
      const objectUrl = URL.createObjectURL(blob)
      a.href = objectUrl
      a.download = `prodica-${props.entity.kind}.jpg`
      a.click()
      URL.revokeObjectURL(objectUrl)
      setStatus('Downloaded')
    } catch {
      setStatus('Download failed')
    }
  }, [props.entity])

  return (
    <div className="share-actions">
      <button type="button" className="btn btn--small" onClick={() => void share()}>
        Share
      </button>
      <button
        type="button"
        className="btn btn--small btn--ghost"
        onClick={() => void saveHistory()}
      >
        Save
      </button>
      <button
        type="button"
        className="btn btn--small btn--ghost"
        onClick={() => void downloadCard()}
      >
        Download
      </button>
      {status ? (
        <span className="share-status" role="status" aria-live="polite">
          {status}
        </span>
      ) : null}
    </div>
  )
}
