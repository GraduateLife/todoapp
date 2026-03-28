/**
 * Typed environment variables.
 * All values are read once at startup — no reactivity needed.
 */

export type DataSource = 'local' | 'api' | 'mock'

export const DATA_SOURCE: DataSource =
  (import.meta.env.VITE_DATA_SOURCE as DataSource) ?? 'local'

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
