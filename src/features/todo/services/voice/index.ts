import { useState, useRef, useCallback, useEffect } from 'react'
import { WebSpeechProvider } from './webSpeech'
import { MockSpeechProvider } from './mock'
import { VOICE_MOCK } from '../../../../lib/env'
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
  isMock: boolean
  start: () => void
  stop: () => void
  isAvailable: boolean
}

export function useVoiceRecorder({
  provider = 'webSpeech',
  lang = 'zh-CN',
  onTranscript,
  onError,
}: UseVoiceRecorderOptions): UseVoiceRecorderReturn {
  const [state, setState] = useState<VoiceRecorderState>('idle')
  const stopRef = useRef<(() => void) | null>(null)

  const mock = useRef(new MockSpeechProvider())
  const webSpeech = useRef(new WebSpeechProvider(lang))

  const isMock = VOICE_MOCK
  const isAvailable = isMock || (provider === 'webSpeech' ? webSpeech.current.isAvailable() : true)

  const start = useCallback(() => {
    if (state === 'listening') return
    setState('listening')

    const activeProvider = isMock ? mock.current : webSpeech.current

    stopRef.current = activeProvider.startLiveRecognition({
      onResult: (text, isFinal) => onTranscript(text, isFinal),
      onEnd: () => setState('idle'),
      onError: (err) => {
        setState('error')
        onError?.(err)
      },
    })
  }, [state, isMock, onTranscript, onError])

  const stop = useCallback(() => {
    stopRef.current?.()
    stopRef.current = null
    setState('idle')
  }, [])

  useEffect(() => () => { stopRef.current?.() }, [])

  return { state, isMock, start, stop, isAvailable }
}
