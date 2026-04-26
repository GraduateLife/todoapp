import type { ExportFormat } from '#/features/todo/export/templates'

export interface RecentShareRecord {
  todoId: string
  url: string
  title: string
  format: ExportFormat
  sharedAt: number
}

const RECENT_SHARE_STORAGE_KEY = 'todoapp.share.recent'

export function readRecentShare(): RecentShareRecord | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(RECENT_SHARE_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as RecentShareRecord
  } catch {
    return null
  }
}

export function writeRecentShare(record: RecentShareRecord): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(RECENT_SHARE_STORAGE_KEY, JSON.stringify(record))
  } catch {
    // Ignore storage failures in private mode / locked-down browsers.
  }
}
