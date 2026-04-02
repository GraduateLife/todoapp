export interface AIProvider {
  /** Transcribe an audio blob to text. */
  transcribe(audio: Blob, language?: string): Promise<string>

  /** Single-turn text completion. */
  complete(prompt: string, options?: CompletionOptions): Promise<string>
}

export interface CompletionOptions {
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
}

export type AIProviderName = 'openai' | 'anthropic' | 'ollama'
