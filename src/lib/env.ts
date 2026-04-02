/**
 * Typed environment variables.
 * All values are read once at startup — no reactivity needed.
 */

export type StorageStrategyName = 'offline' | 'online' | 'dual' | 'auto'

export const STORAGE_STRATEGY: StorageStrategyName =
  (import.meta.env.VITE_STORAGE_STRATEGY as StorageStrategyName) ?? 'offline'

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
