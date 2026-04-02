import type { TranscriptionProvider } from './types'

/**
 * Web Speech API transcription provider.
 * Streams recognition results in real-time — no audio blob upload needed.
 * The `transcribe(blob)` signature is kept for interface compatibility,
 * but the recommended usage is via `useWebSpeechRecorder` for live streaming.
 */
export class WebSpeechProvider implements TranscriptionProvider {
  private lang: string

  constructor(lang = 'zh-CN') {
    this.lang = lang
  }

  isAvailable(): boolean {
    return typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  }

  /**
   * Blob-based transcription via Web Speech is not straightforward
   * (the API works on live mic input, not pre-recorded blobs).
   * Use `startLiveRecognition` for real-time streaming instead.
   */
  transcribe(_audio: Blob): Promise<string> {
    return Promise.reject(
      new Error('[webSpeech] Use startLiveRecognition() for real-time transcription.')
    )
  }

  /**
   * Starts live speech recognition. Calls onResult with interim/final text,
   * calls onEnd when recognition stops.
   * Returns a stop function to cancel recognition early.
   */
  startLiveRecognition({
    onResult,
    onEnd,
    onError,
  }: {
    onResult: (text: string, isFinal: boolean) => void
    onEnd: () => void
    onError: (error: string) => void
  }): () => void {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: typeof window.SpeechRecognition }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition

    if (!SpeechRecognition) {
      onError('Web Speech API not supported in this browser.')
      onEnd()
      return () => {}
    }

    const recognition = new SpeechRecognition()
    recognition.lang = this.lang
    recognition.continuous = true
    recognition.interimResults = true

    let gotResult = false
    let errored = false

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      gotResult = true
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          final += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }
      if (final) onResult(final, true)
      else if (interim) onResult(interim, false)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      errored = true
      const msg: Record<string, string> = {
        'not-allowed': 'Microphone permission denied. Please allow access in browser settings.',
        'no-speech': 'No speech detected. Please try again.',
        'network': 'Network error. Web Speech API requires internet in some browsers.',
        'audio-capture': 'No microphone found.',
      }
      onError(msg[event.error] ?? `Speech error: ${event.error}`)
    }

    recognition.onend = () => {
      if (!errored && !gotResult) {
        // Ended with no results and no explicit error — likely permission denied silently
        onError('Could not start microphone. Check browser permissions.')
      }
      onEnd()
    }

    recognition.start()
    return () => recognition.stop()
  }
}
