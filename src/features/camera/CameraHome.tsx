import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

type CameraStatus = 'idle' | 'starting' | 'ready' | 'error'

export function CameraHome({ onCapture }: { onCapture: (blob: Blob) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<CameraStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null)

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  useEffect(() => {
    let cancelled = false
    async function start() {
      setStatus('starting')
      setError(null)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        setStatus('ready')
      } catch {
        setStatus('error')
        setError(
          'Camera access was denied or unavailable. You can still upload a photo below.',
        )
      }
    }
    void start()
    return () => {
      cancelled = true
      stopStream()
    }
  }, [stopStream])

  const clearPreview = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setPendingBlob(null)
  }, [preview])

  const capture = useCallback(() => {
    const video = videoRef.current
    if (!video || video.videoWidth === 0) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          setPreview(url)
          setPendingBlob(blob)
        }
      },
      'image/jpeg',
      0.92,
    )
  }, [])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const url = URL.createObjectURL(file)
      setPreview(url)
      setPendingBlob(file)
      e.target.value = ''
    },
    [],
  )

  const confirmScan = useCallback(() => {
    if (pendingBlob) {
      onCapture(pendingBlob)
      setPreview(null)
      setPendingBlob(null)
    }
  }, [pendingBlob, onCapture])

  if (preview) {
    return (
      <div className="camera-screen">
        <div className="camera-frame">
          <img src={preview} alt="Captured product" className="camera-preview-img" />
        </div>
        <div className="camera-actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={confirmScan}
          >
            Scan this photo
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={clearPreview}
          >
            Retake
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="camera-screen">
      <div className="camera-frame">
        <video
          ref={videoRef}
          className="camera-video"
          playsInline
          muted
          autoPlay
        />
        {status === 'ready' ? (
          <div className="camera-overlay camera-overlay--guide" aria-hidden>
            <div className="scan-guide">
              <span className="scan-guide__corner scan-guide__corner--tl" />
              <span className="scan-guide__corner scan-guide__corner--tr" />
              <span className="scan-guide__corner scan-guide__corner--bl" />
              <span className="scan-guide__corner scan-guide__corner--br" />
            </div>
            <p className="scan-guide__label">Align product label here</p>
          </div>
        ) : (
          <div className="camera-overlay camera-overlay--center">
            {status === 'error' ? (
              <p className="camera-msg camera-msg--err">{error}</p>
            ) : (
              <p className="camera-msg">Starting camera…</p>
            )}
          </div>
        )}
      </div>

      <div className="camera-actions">
        <button
          type="button"
          className="btn btn--primary"
          disabled={status !== 'ready'}
          onClick={capture}
        >
          Capture photo
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => fileRef.current?.click()}
        >
          Upload from gallery
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleFileSelect}
        />
        <p className="camera-hint">
          Point at the label or barcode. We try barcode first, then OCR, then
          visual fallback.
        </p>
      </div>
    </div>
  )
}
