import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  onReset?: () => void
}

type State = {
  error: Error | null
}

/** Catch render crashes so identify never leaves a blank root. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[Prodica] UI crash', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="result-screen fade-in" style={{ padding: '1rem' }}>
        <h1 className="result-title">Something went wrong</h1>
        <p className="muted">
          The result screen hit an error. Your scan may still have worked —
          try again or reload to pick up the latest app version.
        </p>
        <p className="mono small">{this.state.error.message}</p>
        <div className="result-hero__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              this.setState({ error: null })
              this.props.onReset?.()
            }}
          >
            Back to camera
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              void (async () => {
                try {
                  if ('caches' in window) {
                    const keys = await caches.keys()
                    await Promise.all(keys.map((k) => caches.delete(k)))
                  }
                  const regs = await navigator.serviceWorker?.getRegistrations()
                  await Promise.all(regs?.map((r) => r.unregister()) ?? [])
                } catch {
                  // ignore
                }
                window.location.reload()
              })()
            }}
          >
            Reload app
          </button>
        </div>
      </div>
    )
  }
}
