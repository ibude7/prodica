import { useEffect, useState } from 'react'

const STEPS = [
  { key: 'barcode', label: 'Reading barcode…' },
  { key: 'ocr', label: 'Running OCR text extraction…' },
  { key: 'visual', label: 'Visual classification…' },
  { key: 'lookup', label: 'Looking up product…' },
] as const

export function LoadingOverlay(props: { label?: string }) {
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const timers = STEPS.map((_, i) =>
      setTimeout(() => setActiveStep(i), i * 1800),
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="loading-overlay" role="status" aria-live="polite">
      <div className="loading-overlay__spinner" aria-hidden />
      <p className="loading-overlay__text">{props.label ?? 'Scanning…'}</p>
      <ul className="loading-steps">
        {STEPS.map((s, i) => {
          const cls =
            i < activeStep
              ? 'loading-step loading-step--done'
              : i === activeStep
                ? 'loading-step loading-step--active'
                : 'loading-step'
          return (
            <li key={s.key} className={cls}>
              <span className="loading-step__icon">
                {i < activeStep ? '✓' : ''}
              </span>
              {s.label}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
