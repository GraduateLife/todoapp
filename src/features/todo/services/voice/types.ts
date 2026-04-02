export interface TranscriptionProvider {
  /** Returns transcribed text from an audio blob. */
  transcribe(audio: Blob): Promise<string>

  /** Whether this provider is available in the current environment. */
  isAvailable(): boolean
}

export type VoiceProviderName = 'webSpeech' | 'ai'
