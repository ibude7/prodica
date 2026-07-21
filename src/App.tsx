import { useCallback, useMemo, useState } from 'react'
import type { IdentifiedEntity, ScanOutcome } from './domain/types'
import { applyUserCorrections } from './domain/mergeEntity'
import { runScanPipeline } from './services/scanPipeline'
import { CameraHome } from './features/camera/CameraHome'
import { EntityResultView } from './features/entity/EntityResultView'
import { LoadingOverlay } from './components/LoadingOverlay'
import { StateBanner } from './components/StateBanner'

type Phase = 'camera' | 'loading' | 'result'

export default function App() {
  const [phase, setPhase] = useState<Phase>('camera')
  const [outcome, setOutcome] = useState<ScanOutcome | null>(null)
  const [corrections, setCorrections] = useState<{
    name?: string
    subtitle?: string
  }>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const displayEntity = useMemo((): IdentifiedEntity | null => {
    if (!outcome || outcome.status !== 'success') return null
    return applyUserCorrections(outcome.result, corrections)
  }, [outcome, corrections])

  const handleCapture = useCallback(async (blob: Blob) => {
    setPhase('loading')
    setErrorMessage(null)
    setCorrections({})
    try {
      const res = await runScanPipeline(blob)
      setOutcome(res)
      if (res.status === 'error') {
        setErrorMessage(res.message)
        setPhase('camera')
        return
      }
      setPhase('result')
    } catch (e) {
      setErrorMessage(
        e instanceof Error ? e.message : 'Something went wrong while scanning.',
      )
      setPhase('camera')
    }
  }, [])

  const handleRetake = useCallback(() => {
    setPhase('camera')
    setOutcome(null)
    setCorrections({})
    setErrorMessage(null)
  }, [])

  const handleApplyCorrection = useCallback((name: string, subtitle: string) => {
    setCorrections({ name, subtitle })
  }, [])

  return (
    <div className="app-shell">
      <header className="app-bar">
        <span className="app-bar__mark" aria-hidden />
        <span className="app-bar__title">Prodica</span>
      </header>

      <main className="app-main">
        {errorMessage ? (
          <StateBanner
            kind="error"
            title="Scan failed"
            detail={errorMessage}
          />
        ) : null}

        {phase === 'camera' ? (
          <CameraHome onCapture={handleCapture} />
        ) : null}

        {phase === 'loading' ? (
          <LoadingOverlay label="Identifying — barcode, OCR, then vision…" />
        ) : null}

        {phase === 'result' && outcome ? (
          <EntityResultView
            key={
              displayEntity
                ? `${displayEntity.id}:${displayEntity.name.value ?? ''}:${displayEntity.subtitle.value ?? ''}`
                : outcome.status === 'no_match'
                  ? 'no-match'
                  : 'result'
            }
            entity={displayEntity}
            steps={outcome.status !== 'error' ? outcome.steps : []}
            noMatchHint={outcome.status === 'no_match' ? outcome.hint : undefined}
            onRetake={handleRetake}
            onApplyCorrection={handleApplyCorrection}
          />
        ) : null}
      </main>
    </div>
  )
}
