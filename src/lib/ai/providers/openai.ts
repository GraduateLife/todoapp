import type { AIProvider, CompletionOptions } from '../types'

export class OpenAIProvider implements AIProvider {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey: string, baseUrl = 'https://api.openai.com/v1') {
    this.apiKey = apiKey
    this.baseUrl = baseUrl
  }

  async transcribe(audio: Blob, language = 'zh'): Promise<string> {
    const form = new FormData()
    form.append('file', audio, 'audio.webm')
    form.append('model', 'whisper-1')
    form.append('language', language)

    const res = await fetch(`${this.baseUrl}/audio/transcriptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}` },
      body: form,
    })
    if (!res.ok) throw new Error(`[openai] transcribe → ${res.status}`)
    const data = await res.json() as { text: string }
    return data.text.trim()
  }

  async complete(prompt: string, options: CompletionOptions = {}): Promise<string> {
    const messages = [
      ...(options.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
      { role: 'user', content: prompt },
    ]
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: options.maxTokens ?? 512,
        temperature: options.temperature ?? 0.7,
      }),
    })
    if (!res.ok) throw new Error(`[openai] complete → ${res.status}`)
    const data = await res.json() as { choices: { message: { content: string } }[] }
    return data.choices[0].message.content.trim()
  }
}
