import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'

type CameraStatus = 'idle' | 'starting' | 'ready' | 'error'

export function CameraHome({ onCapture }: { onCapture: (blob: Blob) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const trackRef = useRef<MediaStreamTrack | null>(null)
  const [status, setStatus] = useState<CameraStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState(false)
  const [torchOn, setTorchOn] = useState(false)
  const [torchSupported, setTorchSupported] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [zoomRange, setZoomRange] = useState<{ min: number; max: number } | null>(
    null,
  )

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    trackRef.current = null
  }, [])

  useEffect(() => {
    let cancelled = false
    async function start() {
      setStatus('starting')
      setError(null)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1440 },
          },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        const track = stream.getVideoTracks()[0] ?? null
        trackRef.current = track
        if (track) {
          const caps = track.getCapabilities?.() as
            | (MediaTrackCapabilities & {
                torch?: boolean
                zoom?: { min: number; max: number; step?: number }
              })
            | undefined
          setTorchSupported(Boolean(caps?.torch))
          if (caps?.zoom) {
            setZoomRange({ min: caps.zoom.min, max: Math.min(caps.zoom.max, 4) })
            setZoom(caps.zoom.min)
          } else {
            setZoomRange(null)
          }
        }
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

  const applyAdvanced = useCallback(
    async (advanced: Record<string, unknown>) => {
      const track = trackRef.current
      if (!track) return
      try {
        await track.applyConstraints({
          advanced: [advanced],
        } as MediaTrackConstraints)
      } catch {
        // capability not supported — ignore
      }
    },
    [],
  )

  const toggleTorch = useCallback(async () => {
    const next = !torchOn
    await applyAdvanced({ torch: next })
    setTorchOn(next)
  }, [applyAdvanced, torchOn])

  const onZoomChange = useCallback(
    async (value: number) => {
      setZoom(value)
      await applyAdvanced({ zoom: value })
    },
    [applyAdvanced],
  )

  const emitCapture = useCallback(
    (blob: Blob) => {
      setFlash(true)
      window.setTimeout(() => setFlash(false), 180)
      onCapture(blob)
    },
    [onCapture],
  )

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
        if (blob) emitCapture(blob)
      },
      'image/jpeg',
      0.92,
    )
  }, [emitCapture])

  const onFile = useCallback(
    (ev: ChangeEvent<HTMLInputElement>) => {
      const file = ev.target.files?.[0]
      if (!file) return
      emitCapture(file)
      ev.target.value = ''
    },
    [emitCapture],
  )

  return (
    <div className="camera-screen fade-in">
      <div className="camera-frame">
        <video
          ref={videoRef}
          className="camera-video"
          playsInline
          muted
          autoPlay
        />
        {flash ? <div className="camera-flash" aria-hidden /> : null}
        {status !== 'ready' ? (
          <div className="camera-overlay camera-overlay--center">
            {status === 'error' ? (
              <p className="camera-msg camera-msg--err">{error}</p>
            ) : (
              <p className="camera-msg">Starting camera…</p>
            )}
          </div>
        ) : null}
        {status === 'ready' && (torchSupported || zoomRange) ? (
          <div className="camera-controls">
            {torchSupported ? (
              <button
                type="button"
                className={`btn btn--small${torchOn ? ' is-active' : ''}`}
                onClick={() => void toggleTorch()}
                aria-pressed={torchOn}
              >
                {torchOn ? 'Torch on' : 'Torch'}
              </button>
            ) : null}
            {zoomRange ? (
              <label className="camera-zoom">
                <span className="sr-only">Zoom</span>
                <input
                  type="range"
                  min={zoomRange.min}
                  max={zoomRange.max}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => void onZoomChange(Number(e.target.value))}
                />
              </label>
            ) : null}
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
          Identify
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => fileRef.current?.click()}
        >
          Upload photo
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={onFile}
        />
        <p className="camera-hint">
          Point at anything — food, books, pets, cars, art, and more. We try
          barcode and OCR for packaged goods, then vision for everything else.
        </p>
      </div>
    </div>
  )
}
