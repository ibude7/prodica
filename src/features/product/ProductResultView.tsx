import { useCallback, useMemo, useState } from 'react'
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

function CollapsibleSection(props: {
  title: string
  children: React.ReactNode
  variant?: 'default' | 'safety' | 'muted'
  action?: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(props.defaultOpen ?? true)
  return (
    <SectionCard
      title={props.title}
      variant={props.variant}
      action={
        <div className="section-card__actions">
          {props.action}
          <button
            type="button"
            className="btn btn--small btn--ghost"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Collapse' : 'Expand'}
          >
            {open ? '▲' : '▼'}
          </button>
        </div>
      }
    >
      {open ? props.children : null}
    </SectionCard>
  )
}

export function ProductResultView(props: {
  product: ProductResult | null
  steps: PipelineStep[]
  noMatchHint?: string
  imageUrl?: string | null
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

  const [copied, setCopied] = useState(false)

  const copyProductInfo = useCallback(() => {
    if (!props.product) return
    const p = props.product
    const lines: string[] = []
    if (p.name.value) lines.push(`Name: ${p.name.value}`)
    if (p.brand.value) lines.push(`Brand: ${p.brand.value}`)
    if (p.category.value) lines.push(`Category: ${p.category.value}`)
    if (p.origin.value) lines.push(`Origin: ${p.origin.value}`)
    if (p.contents.value) lines.push(`Contents: ${p.contents.value}`)
    if (p.ingredients.value) lines.push(`Ingredients: ${p.ingredients.value}`)
    if (p.warnings.value?.length) lines.push(`Warnings: ${p.warnings.value.join('; ')}`)
    if (p.storage.value) lines.push(`Storage: ${p.storage.value}`)
    lines.push(`Confidence: ${Math.round(p.confidence * 100)}% (${p.source})`)
    void navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [props.product])

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
          <button type="button" className="btn btn--small" onClick={copyProductInfo}>
            {copied ? 'Copied' : 'Copy info'}
          </button>
          <button type="button" className="btn btn--ghost" onClick={props.onRetake}>
            Retake photo
          </button>
        </div>
      </header>

      {props.imageUrl ? (
        <div className="result-image-preview">
          <img src={props.imageUrl} alt="Scanned product" className="result-image-preview__img" />
        </div>
      ) : null}

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

      <CollapsibleSection title="Ingredients & composition">
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
      </CollapsibleSection>

      <CollapsibleSection title="Nutrition">
        {nutrition ?? <p className="muted">No nutrition facts for this entry.</p>}
      </CollapsibleSection>

      <CollapsibleSection title="Warnings & safety" variant="safety">
        {p.warnings.value?.length ? (
          <ListBlock items={p.warnings.value} provenance={p.warnings.provenance} />
        ) : (
          <p className="muted">No warnings listed for this entry.</p>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Storage" defaultOpen={false}>
        <FieldRow
          label="Storage"
          value={p.storage.value ?? null}
          provenance={p.storage.provenance}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Pairings & tips" variant="muted" defaultOpen={false}>
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
      </CollapsibleSection>

      <CollapsibleSection title="Scan trace" variant="muted" defaultOpen={false}>
        {p.scanNotes ? <p className="mono small">{p.scanNotes}</p> : null}
        <ul className="pipeline-list">
          {props.steps.map((s, i) => (
            <li key={`${s.step}-${i}`}>
              <strong>{s.step}</strong>: {s.outcome}
            </li>
          ))}
        </ul>
      </CollapsibleSection>
    </div>
  )
}
