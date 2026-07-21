export function LoadingOverlay(props: { label?: string }) {
  return (
    <div className="loading-overlay fade-in" role="status" aria-live="polite">
      <div className="loading-overlay__card" aria-hidden>
        <div className="skeleton skeleton--hero" />
        <div className="skeleton skeleton--line" />
        <div className="skeleton skeleton--line skeleton--line-short" />
        <div className="loading-overlay__spinner" />
      </div>
      <p className="loading-overlay__text">
        {props.label ?? 'Scanning…'}
      </p>
    </div>
  )
}
