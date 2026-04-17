export interface ShareInput {
  title: string
  format: 'html' | 'md'
  content: string
  ttlMs?: number
}

export interface ShareResult {
  id: string
  url: string
  expiresAt: number | null
}

export interface ShareStrategy {
  /** Whether sharing is available in the current configuration. */
  isAvailable(): boolean
  /** Publish a rendered snapshot and get back a shareable URL. */
  publish(input: ShareInput): Promise<ShareResult>
  /** Revoke (delete) a previously published share. */
  revoke(id: string): Promise<void>
}
