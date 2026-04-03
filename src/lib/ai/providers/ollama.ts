import type { AIProvider, CompletionOptions } from '../types'

export class OllamaProvider implements AIProvider {
  private baseUrl: string
  private model: string

  constructor(baseUrl = 'http://localhost:11434', model = 'gemma3:4b') {
    this.baseUrl = baseUrl
    this.model = model
  }

  async transcribe(_audio: Blob, _language?: string): Promise<string> {
    // Ollama does not expose a transcription endpoint.
    // Use Web Speech API or a separate Whisper.cpp sidecar for offline transcription.
    throw new Error('[ollama] transcribe: not supported — use webSpeech provider instead')
  }

  async complete(prompt: string, options: CompletionOptions = {}): Promise<string> {
    const fullPrompt = options.systemPrompt
      ? `${options.systemPrompt}\n\n${prompt}`
      : prompt

    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        prompt: fullPrompt,
        stream: false,
        options: {
          temperature: options.temperature ?? 0.7,
          num_predict: options.maxTokens ?? 512,
        },
      }),
    })
    if (!res.ok) throw new Error(`[ollama] complete → ${res.status}`)
    const data = await res.json() as { response: string }
    return data.response.trim()
  }
}
