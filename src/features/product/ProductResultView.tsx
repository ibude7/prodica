import { useMemo, useState } from 'react'
import type { DataProvenance, PipelineStep, ProductResult } from '../../domain/types'
import { SectionCard } from '../../components/SectionCard'
import { ProvenanceLabel } from '../../components/ProvenanceLabel'
import { ConfidenceBanner } from '../../components/ConfidenceBanner'
import { StateBanner } from '../../components/StateBanner'

function FieldRow(props: {
  label: string
  value: string | null
  provenance: DataProvenance
}) {
  if (props.value === null || props.value === '') return null
  return (
    <div className="field-row">
      <span className="field-row__label">{props.label}</span>
      <span className="field-row__value">{props.value}</span>
      <ProvenanceLabel provenance={props.provenance} />
    </div>
  )
}

function ListBlock(props: {
  items: string[] | null
  provenance: DataProvenance
}) {
  if (!props.items?.length) return null
  return (
    <ul className="bullet-list">
      {props.items.map((x) => (
        <li key={x}>
          {x} <ProvenanceLabel provenance={props.provenance} />
        </li>
      ))}
    </ul>
  )
}

export function ProductResultView(props: {
  product: ProductResult | null
  steps: PipelineStep[]
  noMatchHint?: string
  onRetake: () => void
  onApplyCorrection: (name: string, brand: string) => void
}) {
  const [nameEdit, setNameEdit] = useState(
    () => props.product?.name.value ?? '',
  )
  const [brandEdit, setBrandEdit] = useState(
    () => props.product?.brand.value ?? '',
  )

  const showLow = props.product?.confidenceLevel === 'low'

  const nutrition = useMemo(() => {
    const n = props.product?.nutritionFacts.value
    if (!n?.length) return null
    return (
      <dl className="nutrition-grid">
        {n.map((row) => (
          <div key={row.label} className="nutrition-row">
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    )
  }, [props.product?.nutritionFacts.value])

  if (props.noMatchHint && !props.product) {
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
        <StateBanner kind="warn" title="No catalog match" detail={props.noMatchHint} />
        <SectionCard title="What you can try">
          <ul className="bullet-list">
            <li>Improve lighting and hold the phone steady.</li>
            <li>Move closer so the barcode or label fills more of the frame.</li>
            <li>Retry — mock results vary with image data to simulate paths.</li>
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

  if (!props.product) {
    return null
  }

  const p = props.product

  return (
    <div className="result-screen">
      <header className="result-header">
        <h1 className="result-title">Product details</h1>
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
          detail="Verify name, ingredients, and warnings on the package before trusting this screen."
        />
      ) : null}

      <ConfidenceBanner
        level={p.confidenceLevel}
        score={p.confidence}
        source={p.source}
      />

      <SectionCard
        title="Identity"
        action={
          <button
            type="button"
            className="btn btn--small"
            onClick={() => props.onApplyCorrection(nameEdit.trim(), brandEdit.trim())}
          >
            Save correction
          </button>
        }
      >
        <div className="stack">
          <label className="field-label" htmlFor="prod-name">
            Name
          </label>
          <input
            id="prod-name"
            className="input"
            value={nameEdit}
            onChange={(e) => setNameEdit(e.target.value)}
            autoComplete="off"
          />
          <label className="field-label" htmlFor="prod-brand">
            Brand
          </label>
          <input
            id="prod-brand"
            className="input"
            value={brandEdit}
            onChange={(e) => setBrandEdit(e.target.value)}
            autoComplete="off"
          />
          <p className="help-text">
            Editing marks name and brand as user-confirmed for this session.
          </p>
        </div>
        <FieldRow
          label="Category"
          value={p.category.value ?? null}
          provenance={p.category.provenance}
        />
        <FieldRow
          label="Origin"
          value={p.origin.value ?? null}
          provenance={p.origin.provenance}
        />
        {p.region ? (
          <FieldRow
            label="Region"
            value={p.region.value ?? null}
            provenance={p.region.provenance}
          />
        ) : null}
        {p.grapeVariety ? (
          <FieldRow
            label="Grape / blend"
            value={p.grapeVariety.value ?? null}
            provenance={p.grapeVariety.provenance}
          />
        ) : null}
        <FieldRow
          label="Contents"
          value={p.contents.value ?? null}
          provenance={p.contents.provenance}
        />
        <FieldRow
          label="Alcohol (ABV)"
          value={
            p.alcoholPercent.value != null ? `${p.alcoholPercent.value}%` : null
          }
          provenance={p.alcoholPercent.provenance}
        />
      </SectionCard>

      <SectionCard title="Ingredients & composition">
        <FieldRow
          label="Ingredients"
          value={p.ingredients.value ?? null}
          provenance={p.ingredients.provenance}
        />
        {p.activeIngredients ? (
          <div className="stack">
            <span className="field-label">Active ingredients</span>
            <ListBlock
              items={p.activeIngredients.value}
              provenance={p.activeIngredients.provenance}
            />
          </div>
        ) : null}
        {p.dosageWarnings ? (
          <FieldRow
            label="Dosage / use"
            value={p.dosageWarnings.value ?? null}
            provenance={p.dosageWarnings.provenance}
          />
        ) : null}
      </SectionCard>

      <SectionCard title="Nutrition">
        {nutrition ?? <p className="muted">No nutrition facts for this entry.</p>}
      </SectionCard>

      <SectionCard title="Warnings & safety" variant="safety">
        {p.warnings.value?.length ? (
          <ListBlock items={p.warnings.value} provenance={p.warnings.provenance} />
        ) : (
          <p className="muted">No warnings listed for this mock entry.</p>
        )}
      </SectionCard>

      <SectionCard title="Storage">
        <FieldRow
          label="Storage"
          value={p.storage.value ?? null}
          provenance={p.storage.provenance}
        />
      </SectionCard>

      <SectionCard title="Pairings & tips" variant="muted">
        {p.pairings.value?.length ? (
          <ListBlock items={p.pairings.value} provenance={p.pairings.provenance} />
        ) : (
          <p className="muted">No pairing suggestions.</p>
        )}
        {p.doNotPair.value?.length ? (
          <div className="stack">
            <span className="field-label">Do not pair / caution</span>
            <ListBlock
              items={p.doNotPair.value}
              provenance={p.doNotPair.provenance}
            />
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title="Scan trace" variant="muted">
        {p.scanNotes ? <p className="mono small">{p.scanNotes}</p> : null}
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
