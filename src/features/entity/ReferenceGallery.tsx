import { useCallback, useEffect, useId, useState } from 'react'
import type { EntityImage } from '../../domain/types'
import { proxiedImageUrl } from '../../services/mediaEnrichment'

function sourceLabel(source: EntityImage['source']): string {
  switch (source) {
    case 'openfoodfacts':
      return 'Open Food Facts'
    case 'wikimedia':
      return 'Wikipedia'
    case 'grounding':
      return 'Web'
    case 'cse':
      return 'Search'
    case 'captured':
      return 'Your photo'
    default:
      return source
  }
}

export function ReferenceGallery(props: {
  images: EntityImage[]
  subjectName: string
}) {
  const dialogId = useId()
  const [active, setActive] = useState<number | null>(null)
  const images = props.images ?? []

  const close = useCallback(() => setActive(null), [])

  useEffect(() => {
    if (active == null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') {
        setActive((i) =>
          i == null ? i : Math.min(images.length - 1, i + 1),
        )
      }
      if (e.key === 'ArrowLeft') {
        setActive((i) => (i == null ? i : Math.max(0, i - 1)))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, close, images.length])

  if (!images.length) {
    return (
      <p className="gallery-empty muted" role="status">
        No reference images found yet.
      </p>
    )
  }

  return (
    <div className="gallery">
      <ul className="gallery__track" role="list">
        {images.map((img, i) => (
          <li key={`${img.url}-${i}`} className="gallery__item">
            <button
              type="button"
              className="gallery__thumb-btn"
              onClick={() => setActive(i)}
              aria-label={`Open ${img.caption || sourceLabel(img.source)} image`}
            >
              <img
                src={proxiedImageUrl(img.thumbUrl || img.url)}
                alt={
                  img.caption ||
                  `Reference ${i + 1} for ${props.subjectName}`
                }
                width={160}
                height={160}
                loading="lazy"
                decoding="async"
                className="gallery__thumb"
              />
              <span className="gallery__label">{sourceLabel(img.source)}</span>
            </button>
          </li>
        ))}
      </ul>

      {active != null && images[active] ? (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-labelledby={dialogId}
          onClick={close}
        >
          <div
            className="lightbox__panel"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={proxiedImageUrl(images[active].url)}
              alt={
                images[active].caption ||
                `Expanded reference for ${props.subjectName}`
              }
              className="lightbox__img"
              width={800}
              height={800}
            />
            <p id={dialogId} className="lightbox__cap">
              {images[active].caption || sourceLabel(images[active].source)}
              <span className="muted">
                {' · '}
                {sourceLabel(images[active].source)}
              </span>
            </p>
            <div className="lightbox__actions">
              <button
                type="button"
                className="btn btn--ghost btn--small"
                disabled={active <= 0}
                onClick={() => setActive((i) => (i == null ? i : i - 1))}
              >
                Prev
              </button>
              <button
                type="button"
                className="btn btn--primary btn--small"
                onClick={close}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--small"
                disabled={active >= images.length - 1}
                onClick={() => setActive((i) => (i == null ? i : i + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
