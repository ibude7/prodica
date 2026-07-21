import type { ReactNode } from 'react'
import type { IdentifiedEntity } from '../../domain/types'
import { proxiedImageUrl } from '../../services/mediaEnrichment'

function kindLabel(kind: string): string {
  return kind.replace(/_/g, ' ')
}

export function ResultHero(props: {
  entity: IdentifiedEntity
  onRetake: () => void
  actions?: ReactNode
}) {
  const { entity } = props
  const bestRef = entity.images[0]
  const captured = entity.capturedPhoto
  const confPct = Math.round(entity.confidence * 100)

  return (
    <header className="result-hero">
      <div className="result-hero__media" aria-hidden={!captured && !bestRef}>
        {captured ? (
          <figure className="result-hero__shot">
            <img
              src={captured}
              alt={`Your photo of ${entity.name.value ?? 'the subject'}`}
              width={480}
              height={640}
              className="result-hero__img"
            />
            <figcaption className="result-hero__cap">Your photo</figcaption>
          </figure>
        ) : (
          <div className="result-hero__shot result-hero__shot--empty">
            <span className="muted">No capture</span>
          </div>
        )}
        {bestRef ? (
          <figure className="result-hero__shot">
            <img
              src={proxiedImageUrl(bestRef.thumbUrl || bestRef.url)}
              alt={
                bestRef.caption ||
                `Reference image for ${entity.name.value ?? 'result'}`
              }
              width={480}
              height={640}
              className="result-hero__img"
              loading="eager"
              decoding="async"
            />
            <figcaption className="result-hero__cap">
              {bestRef.source === 'openfoodfacts'
                ? 'Open Food Facts'
                : bestRef.source === 'wikimedia'
                  ? 'Wikipedia'
                  : 'Reference'}
            </figcaption>
          </figure>
        ) : null}
      </div>

      <div className="result-hero__meta">
        <div className="result-hero__row">
          <p className="kind-badge">{kindLabel(entity.kind)}</p>
          <span
            className={`conf-chip conf-chip--${entity.confidenceLevel}`}
            title={`Match confidence ${confPct}%`}
          >
            {confPct}%
          </span>
        </div>
        <h1 className="result-title" tabIndex={-1} id="result-heading">
          {entity.name.value ?? 'Unknown'}
        </h1>
        {entity.subtitle.value ? (
          <p className="result-subtitle">{entity.subtitle.value}</p>
        ) : null}
        <div className="result-hero__actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={props.onRetake}
          >
            Retake
          </button>
          {props.actions}
        </div>
      </div>
    </header>
  )
}
