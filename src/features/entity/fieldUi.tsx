import type { DataProvenance } from '../../domain/types'
import { ProvenanceLabel } from '../../components/ProvenanceLabel'

export function FieldRow(props: {
  label: string
  value: string | null | undefined
}) {
  if (props.value == null || props.value === '') return null
  return (
    <div className="field-row">
      <span className="field-row__label">{props.label}</span>
      <span className="field-row__value">{props.value}</span>
    </div>
  )
}

export function ListBlock(props: {
  items: string[] | null | undefined
  provenance?: DataProvenance
}) {
  if (!props.items?.length) return null
  return (
    <ul className="bullet-list">
      {props.items.map((x) => (
        <li key={x}>
          {x}{' '}
          {props.provenance ? (
            <ProvenanceLabel provenance={props.provenance} />
          ) : null}
        </li>
      ))}
    </ul>
  )
}

export function LabelValueGrid(props: {
  rows: { label: string; value: string }[] | null | undefined
}) {
  if (!props.rows?.length) return null
  return (
    <dl className="nutrition-grid">
      {props.rows.map((row) => (
        <div key={`${row.label}:${row.value}`} className="nutrition-row">
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}
