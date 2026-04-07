/**
 * Typed environment variables.
 * All values are read once at startup — no reactivity needed.
 */

export type StorageStrategyName = 'offline' | 'online' | 'dual' | 'auto'

export const STORAGE_STRATEGY: StorageStrategyName =
  (import.meta.env.VITE_STORAGE_STRATEGY as StorageStrategyName) ?? 'offline'

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export type AIProviderName = 'openai' | 'anthropic' | 'ollama'

export const AI_PROVIDER: AIProviderName =
  (import.meta.env.VITE_AI_PROVIDER as AIProviderName) ?? 'ollama'

export const AI_API_KEY: string = import.meta.env.VITE_AI_API_KEY ?? ''

export const AI_BASE_URL: string = import.meta.env.VITE_AI_BASE_URL ?? ''

/** Dev-only: simulate voice input without a real microphone. */
export const VOICE_MOCK: boolean = import.meta.env.VITE_VOICE_MOCK === 'true'
