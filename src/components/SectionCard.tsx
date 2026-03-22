import type { ReactNode } from 'react'

type Variant = 'default' | 'safety' | 'muted'

const variantClass: Record<Variant, string> = {
  default: 'section-card',
  safety: 'section-card section-card--safety',
  muted: 'section-card section-card--muted',
}

export function SectionCard(props: {
  title: string
  children: ReactNode
  variant?: Variant
  action?: ReactNode
}) {
  const v = props.variant ?? 'default'
  return (
    <section className={variantClass[v]}>
      <header className="section-card__head">
        <h2 className="section-card__title">{props.title}</h2>
        {props.action ? (
          <div className="section-card__action">{props.action}</div>
        ) : null}
      </header>
      <div className="section-card__body">{props.children}</div>
    </section>
  )
}
