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
  const [status, setStatus] = useState<CameraStatus>('idle')
  const [error, setError] = useState<string | null>(null)

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
          'Camera access was denied or unavailable. Allow camera permission and reload.',
        )
      }
    }
    void start()
    return () => {
      cancelled = true
      stopStream()
    }
  }, [stopStream])

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
        if (blob) onCapture(blob)
      },
      'image/jpeg',
      0.92,
    )
  }, [onCapture])

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
        {status !== 'ready' ? (
          <div className="camera-overlay camera-overlay--center">
            {status === 'error' ? (
              <p className="camera-msg camera-msg--err">{error}</p>
            ) : (
              <p className="camera-msg">Starting camera…</p>
            )}
          </div>
        ) : null}
      </div>

      <div className="camera-actions">
        <button
          type="button"
          className="btn btn--primary"
          disabled={status !== 'ready'}
          onClick={capture}
        >
          Scan product
        </button>
        <p className="camera-hint">
          Point at the label. We try barcode first, then OCR, then visual
          fallback.
        </p>
      </div>
    </div>
  )
}
