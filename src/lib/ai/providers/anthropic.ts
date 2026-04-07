import type { AIProvider, CompletionOptions } from '../types'

export class AnthropicProvider implements AIProvider {
  private apiKey: string
  private model: string

  constructor(apiKey: string, model = 'claude-haiku-4-5-20251001') {
    this.apiKey = apiKey
    this.model = model
  }

  async transcribe(_audio: Blob, _language?: string): Promise<string> {
    // Anthropic does not currently offer a transcription API.
    // Route transcription through a different provider or use Web Speech.
    throw new Error('[anthropic] transcribe: not supported')
  }

  async complete(prompt: string, options: CompletionOptions = {}): Promise<string> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: options.maxTokens ?? 512,
        system: options.systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!res.ok) throw new Error(`[anthropic] complete → ${res.status}`)
    const data = await res.json() as { content: { text: string }[] }
    return data.content[0].text.trim()
  }
}
