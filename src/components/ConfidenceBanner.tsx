import type { ConfidenceLevel, ScanSource } from '../domain/types'

function sourceLabel(s: ScanSource): string {
  switch (s) {
    case 'barcode':
      return 'Barcode'
    case 'ocr':
      return 'OCR text'
    case 'visual':
      return 'Visual model'
    case 'combined':
      return 'Combined signals'
  }
}

export function ConfidenceBanner(props: {
  level: ConfidenceLevel
  score: number
  source: ScanSource
}) {
  const pct = Math.round(props.score * 100)
  const tone =
    props.level === 'high'
      ? 'banner banner--ok'
      : props.level === 'medium'
        ? 'banner banner--mid'
        : 'banner banner--low'

  return (
    <div className={tone} role="status">
      <div className="banner__row">
        <span className="banner__label">Match confidence</span>
        <strong className="banner__value">{pct}%</strong>
      </div>
      <p className="banner__meta">
        Primary source: <strong>{sourceLabel(props.source)}</strong> ·{' '}
        {props.level === 'low'
          ? 'Treat details as unverified until you confirm them.'
          : props.level === 'medium'
            ? 'Some fields may still need confirmation.'
            : 'Strong match against mock catalog data.'}
      </p>
    </div>
  )
}
