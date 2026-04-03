import { useRef, useCallback, useState } from 'react'
import { VOICE_MOCK } from '../../../../lib/env'

export interface AudioAnalyserHandle {
  analyser: AnalyserNode | null
}

/**
 * Opens the microphone, sets up a Web Audio AnalyserNode for waveform data,
 * and runs a MediaRecorder in parallel to capture the audio for replay.
 * In mock mode, returns null analyser and no audio URL.
 */
export function useAudioAnalyser() {
  const handleRef = useRef<AudioAnalyserHandle>({ analyser: null })
  const streamRef = useRef<MediaStream | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioUrlRef = useRef<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  const start = useCallback(async () => {
    if (VOICE_MOCK) return

    // Revoke any previous recording
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current)
      audioUrlRef.current = null
    }
    setAudioUrl(null)
    chunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const ctx = new AudioContext()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.82
      source.connect(analyser)

      streamRef.current = stream
      ctxRef.current = ctx
      handleRef.current = { analyser }

      // Parallel recording for replay
      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        })
        const url = URL.createObjectURL(blob)
        audioUrlRef.current = url
        setAudioUrl(url)
      }
      recorder.start()
      recorderRef.current = recorder
    } catch (e) {
      console.warn('[audioAnalyser] mic unavailable:', e)
    }
  }, [])

  const stop = useCallback(() => {
    recorderRef.current?.stop()
    recorderRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    ctxRef.current?.close()
    streamRef.current = null
    ctxRef.current = null
    handleRef.current = { analyser: null }
  }, [])

  /** Call when overlay unmounts to free the object URL */
  const revokeAudio = useCallback(() => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current)
      audioUrlRef.current = null
    }
    setAudioUrl(null)
  }, [])

  return { handleRef, start, stop, audioUrl, revokeAudio }
}
