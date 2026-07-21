import { useEffect, useState } from 'react'
import type { ScanHistoryEntry } from '../../services/scanHistory'
import {
  clearScanHistory,
  listScanHistory,
} from '../../services/scanHistory'

function formatWhen(ts: number): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(ts))
  } catch {
    return new Date(ts).toLocaleString()
  }
}

export function HistoryList(props: {
  onOpen: (entry: ScanHistoryEntry) => void
  onBack: () => void
}) {
  const [entries, setEntries] = useState<ScanHistoryEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void listScanHistory()
      .then((rows) => {
        if (!cancelled) setEntries(rows)
      })
      .catch(() => {
        if (!cancelled) setError('Could not load history.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="history-screen">
      <header className="result-header">
        <div>
          <h1 className="result-title" id="history-heading" tabIndex={-1}>
            History
          </h1>
          <p className="muted small">Saved on this device</p>
        </div>
        <div className="result-header__actions">
          <button type="button" className="btn btn--ghost" onClick={props.onBack}>
            Camera
          </button>
        </div>
      </header>

      {error ? <p className="state-banner state-banner--error">{error}</p> : null}

      {entries === null ? (
        <div className="skeleton-grid" aria-busy="true" aria-label="Loading history">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton skeleton--card" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="muted" role="status">
          No saved scans yet. Identify something, then tap Save.
        </p>
      ) : (
        <>
          <ul className="history-grid" role="list">
            {entries.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  className="history-card"
                  onClick={() => props.onOpen(entry)}
                >
                  <div className="history-card__thumb">
                    {entry.thumbDataUrl || entry.entity.images?.[0]?.url ? (
                      <img
                        src={
                          entry.thumbDataUrl ||
                          entry.entity.images?.[0]?.thumbUrl ||
                          entry.entity.images?.[0]?.url
                        }
                        alt=""
                        width={120}
                        height={120}
                        loading="lazy"
                      />
                    ) : (
                      <span className="history-card__placeholder">
                        {entry.entity.kind.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                  <div className="history-card__meta">
                    <strong>{entry.entity.name.value ?? 'Unknown'}</strong>
                    <span className="muted small">
                      {entry.entity.kind.replace(/_/g, ' ')} ·{' '}
                      {formatWhen(entry.savedAt)}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              void clearScanHistory().then(() => setEntries([]))
            }}
          >
            Clear history
          </button>
        </>
      )}
    </div>
  )
}
