import { useCallback, useMemo, useState } from 'react'
import type { ProductResult, ScanOutcome } from './domain/types'
import { applyUserCorrections } from './domain/mergeProduct'
import { runScanPipeline } from './services/scanPipeline'
import { CameraHome } from './features/camera/CameraHome'
import { ProductResultView } from './features/product/ProductResultView'
import { LoadingOverlay } from './components/LoadingOverlay'
import { StateBanner } from './components/StateBanner'

type Phase = 'camera' | 'loading' | 'result'

export default function App() {
  const [phase, setPhase] = useState<Phase>('camera')
  const [outcome, setOutcome] = useState<ScanOutcome | null>(null)
  const [corrections, setCorrections] = useState<{ name?: string; brand?: string }>(
    {},
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null)

  const displayProduct = useMemo((): ProductResult | null => {
    if (!outcome || outcome.status !== 'success') return null
    return applyUserCorrections(outcome.result, corrections)
  }, [outcome, corrections])

  const handleCapture = useCallback(async (blob: Blob) => {
    setPhase('loading')
    setErrorMessage(null)
    setCorrections({})
    const imgUrl = URL.createObjectURL(blob)
    setCapturedImageUrl(imgUrl)
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
    if (capturedImageUrl) URL.revokeObjectURL(capturedImageUrl)
    setCapturedImageUrl(null)
  }, [capturedImageUrl])

  const handleApplyCorrection = useCallback((name: string, brand: string) => {
    setCorrections({ name, brand })
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
          <LoadingOverlay label="Reading barcode, OCR, and visual signals…" />
        ) : null}

        {phase === 'result' && outcome ? (
          <ProductResultView
            key={
              displayProduct
                ? `${displayProduct.id}:${displayProduct.name.value ?? ''}:${displayProduct.brand.value ?? ''}`
                : outcome.status === 'no_match'
                  ? 'no-match'
                  : 'result'
            }
            product={displayProduct}
            steps={outcome.status !== 'error' ? outcome.steps : []}
            noMatchHint={outcome.status === 'no_match' ? outcome.hint : undefined}
            imageUrl={capturedImageUrl}
            onRetake={handleRetake}
            onApplyCorrection={handleApplyCorrection}
          />
        ) : null}
      </main>
    </div>
  )
}
