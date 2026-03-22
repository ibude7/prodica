export function LoadingOverlay(props: { label?: string }) {
  return (
    <div className="loading-overlay" role="status" aria-live="polite">
      <div className="loading-overlay__spinner" aria-hidden />
      <p className="loading-overlay__text">{props.label ?? 'Scanning…'}</p>
    </div>
  )
}
