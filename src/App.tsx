import { useCallback, useEffect, useMemo, useState } from 'react'
import type { IdentifiedEntity, ScanOutcome } from './domain/types'
import { applyUserCorrections } from './domain/mergeEntity'
import { runScanPipeline } from './services/scanPipeline'
import { addScanToHistory } from './services/scanHistory'
import type { ScanHistoryEntry } from './services/scanHistory'
import { withEnrichedImages } from './services/mediaEnrichment'
import { CameraHome } from './features/camera/CameraHome'
import { EntityResultView } from './features/entity/EntityResultView'
import { HistoryList } from './features/history/HistoryList'
import { LoadingOverlay } from './components/LoadingOverlay'
import { StateBanner } from './components/StateBanner'

type Phase = 'camera' | 'loading' | 'result' | 'history'

export default function App() {
  const [phase, setPhase] = useState<Phase>('camera')
  const [outcome, setOutcome] = useState<ScanOutcome | null>(null)
  const [corrections, setCorrections] = useState<{
    name?: string
    subtitle?: string
  }>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [deferredInstall, setDeferredInstall] = useState<{
    prompt: () => Promise<void>
  } | null>(null)

  const displayEntity = useMemo((): IdentifiedEntity | null => {
    if (!outcome || outcome.status !== 'success') return null
    return applyUserCorrections(outcome.result, corrections)
  }, [outcome, corrections])

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      const ev = e as Event & {
        prompt: () => Promise<void>
        userChoice: Promise<{ outcome: string }>
      }
      setDeferredInstall({
        prompt: async () => {
          await ev.prompt()
          await ev.userChoice
          setDeferredInstall(null)
        },
      })
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

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
      // Show result immediately; pull reference images in the background
      setPhase('result')
      if (res.status === 'success') {
        void addScanToHistory(res.result).catch(() => undefined)
        void withEnrichedImages(res.result)
          .then((enriched) => {
            if (enriched.images.length === res.result.images.length) return
            setOutcome((prev) => {
              if (!prev || prev.status !== 'success') return prev
              if (prev.result.id !== res.result.id) return prev
              return {
                ...prev,
                result: {
                  ...prev.result,
                  images: enriched.images,
                  imageQuery: enriched.imageQuery ?? prev.result.imageQuery,
                },
              }
            })
          })
          .catch(() => undefined)
      }
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

  const openHistoryEntry = useCallback((entry: ScanHistoryEntry) => {
    setCorrections({})
    setErrorMessage(null)
    setOutcome({
      status: 'success',
      result: entry.entity,
      steps: [
        {
          step: 'visual',
          outcome: `Restored from history (${new Date(entry.savedAt).toLocaleString()})`,
        },
      ],
    })
    setPhase('result')
  }, [])

  return (
    <div className="app-shell">
      <header className="app-bar">
        <span className="app-bar__mark" aria-hidden />
        <span className="app-bar__title">Prodica</span>
        <nav className="app-bar__nav" aria-label="Primary">
          <button
            type="button"
            className={`app-bar__btn${phase === 'camera' || phase === 'loading' ? ' is-active' : ''}`}
            onClick={handleRetake}
            aria-current={phase === 'camera' ? 'page' : undefined}
          >
            Scan
          </button>
          <button
            type="button"
            className={`app-bar__btn${phase === 'history' ? ' is-active' : ''}`}
            onClick={() => {
              setPhase('history')
              setErrorMessage(null)
            }}
            aria-current={phase === 'history' ? 'page' : undefined}
          >
            History
          </button>
          {deferredInstall ? (
            <button
              type="button"
              className="app-bar__btn"
              onClick={() => void deferredInstall.prompt()}
            >
              Install
            </button>
          ) : null}
        </nav>
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
          <LoadingOverlay label="Identifying…" />
        ) : null}

        {phase === 'history' ? (
          <HistoryList onOpen={openHistoryEntry} onBack={handleRetake} />
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
