import { useRef, useEffect } from 'react'
import { VOICE_MOCK } from '../../../../lib/env'
import type { AudioAnalyserHandle } from '../../services/voice/useAudioAnalyser'

interface WaveformCanvasProps {
  handleRef: React.RefObject<AudioAnalyserHandle>
  isActive: boolean
  /** CSS color string — line stroke + glow */
  color: string
}

/** Generate a synthetic speech-like waveform for mock mode */
function mockWaveform(buf: Uint8Array, isActive: boolean) {
  const t = Date.now() / 1000
  for (let i = 0; i < buf.length; i++) {
    if (!isActive) {
      buf[i] = 128
      continue
    }
    const x = (i / buf.length) * Math.PI * 16 + t * 5
    const wave =
      Math.sin(x) * 0.45 +
      Math.sin(x * 2.3 + 0.9) * 0.22 +
      Math.sin(x * 5.7 + 2.1) * 0.12 +
      Math.sin(x * 11.3 + 0.4) * 0.06 +
      (Math.random() - 0.5) * 0.06
    buf[i] = Math.round(128 + wave * 85)
  }
}

export function WaveformCanvas({
  handleRef,
  isActive,
  color,
}: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx2d = canvas.getContext('2d')!

    // Keep canvas pixel size in sync with its CSS size
    const ro = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth * devicePixelRatio
      canvas.height = canvas.offsetHeight * devicePixelRatio
    })
    ro.observe(canvas)
    canvas.width = canvas.offsetWidth * devicePixelRatio
    canvas.height = canvas.offsetHeight * devicePixelRatio

    const BUF = 2048
    const data = new Uint8Array(BUF)

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw)

      const W = canvas.width
      const H = canvas.height
      ctx2d.clearRect(0, 0, W, H)

      // Fill waveform buffer
      if (VOICE_MOCK || !handleRef.current?.analyser) {
        mockWaveform(data, isActive)
      } else {
        handleRef.current.analyser.getByteTimeDomainData(data)
      }

      // Draw smooth waveform line
      ctx2d.save()
      ctx2d.lineWidth = 1.5 * devicePixelRatio
      ctx2d.strokeStyle = color
      ctx2d.shadowColor = color
      ctx2d.shadowBlur = 10 * devicePixelRatio
      ctx2d.lineJoin = 'round'
      ctx2d.lineCap = 'round'

      ctx2d.beginPath()
      const step = W / (BUF - 1)
      for (let i = 0; i < BUF; i++) {
        const v = data[i] / 128.0
        const y = (v * H) / 2
        i === 0 ? ctx2d.moveTo(0, y) : ctx2d.lineTo(i * step, y)
      }
      ctx2d.stroke()

      // Second, dimmer pass for depth
      ctx2d.globalAlpha = 0.18
      ctx2d.lineWidth = 3 * devicePixelRatio
      ctx2d.shadowBlur = 22 * devicePixelRatio
      ctx2d.beginPath()
      for (let i = 0; i < BUF; i++) {
        const v = data[i] / 128.0
        const y = (v * H) / 2
        i === 0 ? ctx2d.moveTo(0, y) : ctx2d.lineTo(i * step, y)
      }
      ctx2d.stroke()

      ctx2d.restore()
    }

    draw()

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [handleRef, isActive, color])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  )
}
