import { useState } from 'react'
import type { IdentifiedEntity, PipelineStep } from '../../domain/types'
import { SectionCard } from '../../components/SectionCard'
import { ConfidenceBanner } from '../../components/ConfidenceBanner'
import { StateBanner } from '../../components/StateBanner'
import { ListBlock } from './fieldUi'
import { FacetSections } from './FacetSections'

function kindLabel(kind: string): string {
  return kind.replace(/_/g, ' ')
}

export function EntityResultView(props: {
  entity: IdentifiedEntity | null
  steps: PipelineStep[]
  noMatchHint?: string
  onRetake: () => void
  onApplyCorrection: (name: string, subtitle: string) => void
}) {
  const [nameEdit, setNameEdit] = useState(
    () => props.entity?.name.value ?? '',
  )
  const [subtitleEdit, setSubtitleEdit] = useState(
    () => props.entity?.subtitle.value ?? '',
  )

  if (props.noMatchHint && !props.entity) {
    return (
      <div className="result-screen">
        <header className="result-header">
          <h1 className="result-title">No match</h1>
          <div className="result-header__actions">
            <button type="button" className="btn btn--ghost" onClick={props.onRetake}>
              Retake photo
            </button>
          </div>
        </header>
        <StateBanner kind="warn" title="Could not identify" detail={props.noMatchHint} />
        <SectionCard title="What you can try">
          <ul className="bullet-list">
            <li>Center the subject and improve lighting.</li>
            <li>For packaged goods, include the barcode or clear product name.</li>
            <li>Ensure the API is running with GEMINI_API_KEY or AI_GATEWAY_API_KEY for visual ID.</li>
          </ul>
          <button type="button" className="btn btn--primary" onClick={props.onRetake}>
            Back to camera
          </button>
        </SectionCard>
        <SectionCard title="Scan trace" variant="muted">
          <ul className="pipeline-list">
            {props.steps.map((s, i) => (
              <li key={`${s.step}-${i}`}>
                <strong>{s.step}</strong>: {s.outcome}
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    )
  }

  if (!props.entity) return null

  const e = props.entity
  const showLow = e.confidenceLevel === 'low'

  return (
    <div className="result-screen">
      <header className="result-header">
        <div>
          <p className="kind-badge">{kindLabel(e.kind)}</p>
          <h1 className="result-title">{e.name.value ?? 'Unknown'}</h1>
          {e.subtitle.value ? (
            <p className="result-subtitle">{e.subtitle.value}</p>
          ) : null}
        </div>
        <div className="result-header__actions">
          <button type="button" className="btn btn--ghost" onClick={props.onRetake}>
            Retake photo
          </button>
        </div>
      </header>

      {showLow ? (
        <StateBanner
          kind="warn"
          title="Low confidence match"
          detail="Treat details as a best guess until you confirm them."
        />
      ) : null}

      {e.kind === 'medicine' || e.kind === 'supplement' ? (
        <StateBanner
          kind="warn"
          title="Not medical advice"
          detail="Informational only. Follow the package insert and consult a clinician for health decisions."
        />
      ) : null}

      {e.kind === 'pet' || e.kind === 'animal' ? (
        <StateBanner
          kind="warn"
          title="Not veterinary advice"
          detail="Species and breed estimates can be wrong. Seek a vet for health concerns."
        />
      ) : null}

      {e.kind === 'sex_position' ? (
        <StateBanner
          kind="warn"
          title="Adult informational content"
          detail="For consenting adults. Prioritize comfort, communication, and safety."
        />
      ) : null}

      <ConfidenceBanner
        level={e.confidenceLevel}
        score={e.confidence}
        source={e.source}
      />

      <SectionCard title="Summary">
        <p className="entity-summary">{e.summary}</p>
        {e.tags.length ? (
          <p className="help-text">{e.tags.join(' · ')}</p>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Identity"
        action={
          <button
            type="button"
            className="btn btn--small"
            onClick={() =>
              props.onApplyCorrection(nameEdit.trim(), subtitleEdit.trim())
            }
          >
            Save correction
          </button>
        }
      >
        <div className="stack">
          <label className="field-label" htmlFor="entity-name">
            Name
          </label>
          <input
            id="entity-name"
            className="input"
            value={nameEdit}
            onChange={(ev) => setNameEdit(ev.target.value)}
            autoComplete="off"
          />
          <label className="field-label" htmlFor="entity-subtitle">
            Subtitle (brand / artist / make)
          </label>
          <input
            id="entity-subtitle"
            className="input"
            value={subtitleEdit}
            onChange={(ev) => setSubtitleEdit(ev.target.value)}
            autoComplete="off"
          />
          <p className="help-text">
            Editing marks name and subtitle as user-confirmed for this session.
          </p>
        </div>
      </SectionCard>

      <FacetSections entity={e} />

      <SectionCard title="Warnings & safety" variant="safety">
        {e.warnings.length ? (
          <ListBlock items={e.warnings} />
        ) : (
          <p className="muted">No warnings listed.</p>
        )}
      </SectionCard>

      <SectionCard title="Scan trace" variant="muted">
        {e.scanNotes ? <p className="mono small">{e.scanNotes}</p> : null}
        <ul className="pipeline-list">
          {props.steps.map((s, i) => (
            <li key={`${s.step}-${i}`}>
              <strong>{s.step}</strong>: {s.outcome}
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  )
}
