import type { TranscriptionProvider } from './types'
import { getAIProvider } from '../../../../lib/ai'

/**
 * AI-backed transcription provider.
 * Records audio as a blob, then sends it to the configured AI provider (e.g. Whisper).
 * Suitable for higher accuracy or when Web Speech is unavailable.
 */
export class AITranscriptionProvider implements TranscriptionProvider {
  isAvailable(): boolean {
    return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
  }

  async transcribe(audio: Blob): Promise<string> {
    return getAIProvider().transcribe(audio)
  }
}
