import { useState, useRef, useCallback, useEffect } from 'react'
import { WebSpeechProvider } from './webSpeech'
import type { VoiceProviderName } from './types'

export type { VoiceProviderName }

export type VoiceRecorderState = 'idle' | 'listening' | 'error'

export interface UseVoiceRecorderOptions {
  provider?: VoiceProviderName
  lang?: string
  onTranscript: (text: string, isFinal: boolean) => void
  onError?: (error: string) => void
}

export interface UseVoiceRecorderReturn {
  state: VoiceRecorderState
  start: () => void
  stop: () => void
  isAvailable: boolean
}

/**
 * Unified voice recorder hook.
 * Currently supports 'webSpeech' provider with live streaming.
 * Switch to 'ai' provider for blob-based transcription (higher accuracy).
 */
export function useVoiceRecorder({
  provider = 'webSpeech',
  lang = 'zh-CN',
  onTranscript,
  onError,
}: UseVoiceRecorderOptions): UseVoiceRecorderReturn {
  const [state, setState] = useState<VoiceRecorderState>('idle')
  const stopRef = useRef<(() => void) | null>(null)

  const webSpeech = useRef(new WebSpeechProvider(lang))
  const isAvailable = provider === 'webSpeech' ? webSpeech.current.isAvailable() : true

  const start = useCallback(() => {
    if (state === 'listening') return

    if (provider === 'webSpeech') {
      setState('listening')
      stopRef.current = webSpeech.current.startLiveRecognition({
        onResult: (text, isFinal) => onTranscript(text, isFinal),
        onEnd: () => setState('idle'),
        onError: (err) => {
          setState('error')
          onError?.(err)
        },
      })
    } else {
      // AI provider: blob-based — MediaRecorder + upload on stop
      // Placeholder: wire up when AITranscriptionProvider is needed
      onError?.('[voice] AI provider not yet wired to useVoiceRecorder')
    }
  }, [state, provider, onTranscript, onError])

  const stop = useCallback(() => {
    stopRef.current?.()
    stopRef.current = null
    setState('idle')
  }, [])

  // Clean up on unmount
  useEffect(() => () => { stopRef.current?.() }, [])

  return { state, start, stop, isAvailable }
}
