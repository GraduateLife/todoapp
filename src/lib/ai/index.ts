import { AI_PROVIDER, AI_MODEL, AI_API_KEY, AI_BASE_URL } from '../env'
import type { AIProvider } from './types'

export type { AIProvider }
export type { CompletionOptions, AIProviderName } from './types'

let _provider: AIProvider | null = null

export function getAIProvider(): AIProvider {
  if (!_provider) throw new Error('[ai] Not initialized. Call initAIProvider() first.')
  return _provider
}

export function isAIAvailable(): boolean {
  return _provider !== null
}

export async function initAIProvider(): Promise<void> {
  if (_provider) return

  if (AI_PROVIDER === 'anthropic') {
    const { AnthropicProvider } = await import('./providers/anthropic')
    _provider = new AnthropicProvider(AI_API_KEY, AI_MODEL || undefined)
  } else if (AI_PROVIDER === 'ollama') {
    const { OllamaProvider } = await import('./providers/ollama')
    _provider = new OllamaProvider(AI_BASE_URL || undefined, AI_MODEL || undefined)
  } else {
    const { OpenAIProvider } = await import('./providers/openai')
    _provider = new OpenAIProvider(AI_API_KEY, AI_BASE_URL || undefined, AI_MODEL || undefined)
  }
}
