type Kind = 'info' | 'warn' | 'error'

const kindClass: Record<Kind, string> = {
  info: 'state-banner state-banner--info',
  warn: 'state-banner state-banner--warn',
  error: 'state-banner state-banner--err',
}

export function StateBanner(props: {
  kind: Kind
  title: string
  detail?: string
}) {
  return (
    <div className={kindClass[props.kind]} role="alert">
      <p className="state-banner__title">{props.title}</p>
      {props.detail ? (
        <p className="state-banner__detail">{props.detail}</p>
      ) : null}
    </div>
  )
}
