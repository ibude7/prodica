import type { DataProvenance } from '../domain/types'

export function ProvenanceLabel(props: { provenance: DataProvenance }) {
  const label = props.provenance === 'confirmed' ? 'Confirmed' : 'Inferred'
  const cls =
    props.provenance === 'confirmed' ? 'prov prov--ok' : 'prov prov--soft'
  return (
    <span className={cls} title="How Prodica obtained this field">
      {label}
    </span>
  )
}
