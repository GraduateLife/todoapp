export interface ShareInput {
  todoId: string
  title: string
  format: 'html' | 'md'
  content: string
  ttlMs?: number
}

export interface ShareResult {
  id: string
  todoId: string
  url: string
  expiresAt: number | null
  createdAt: number
}

export interface ShareStrategy {
  /** Whether sharing is available in the current configuration. */
  isAvailable: () => boolean
  /** Publish a rendered snapshot and get back a shareable URL. */
  publish: (input: ShareInput) => Promise<ShareResult>
  /** Get the active share, if any, for a todo. */
  getByTodoId: (todoId: string) => Promise<ShareResult | null>
  /** Revoke (delete) a previously published share. */
  revoke: (id: string) => Promise<void>
}
