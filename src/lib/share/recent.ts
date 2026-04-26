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

// ── Shared-todo IDs (persisted set, drives the dog-ear UI) ───────────────────

const SHARED_IDS_STORAGE_KEY = 'todoapp.share.shared-ids'

export function readSharedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(SHARED_IDS_STORAGE_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as unknown
    return Array.isArray(arr) ? new Set(arr.filter((x): x is string => typeof x === 'string')) : new Set()
  } catch {
    return new Set()
  }
}

function writeSharedIds(ids: Set<string>): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(SHARED_IDS_STORAGE_KEY, JSON.stringify([...ids]))
  } catch {
    // ignore
  }
}

export function addSharedId(todoId: string): void {
  const ids = readSharedIds()
  if (ids.has(todoId)) return
  ids.add(todoId)
  writeSharedIds(ids)
  notifySharedIdsChanged()
}

export function removeSharedId(todoId: string): void {
  const ids = readSharedIds()
  if (!ids.delete(todoId)) return
  writeSharedIds(ids)
  notifySharedIdsChanged()
}

const sharedIdsListeners = new Set<() => void>()
function notifySharedIdsChanged() {
  sharedIdsListeners.forEach((fn) => fn())
}

export function subscribeSharedIds(listener: () => void): () => void {
  sharedIdsListeners.add(listener)
  return () => {
    sharedIdsListeners.delete(listener)
  }
}

// ── Just-shared one-shot trigger (drives the top-origin landing animation) ───

const JUST_SHARED_STORAGE_KEY = 'todoapp.share.just-shared'
const JUST_SHARED_WINDOW_MS = 5 * 60 * 1000

export interface JustSharedRecord {
  todoId: string
  sharedAt: number
}

export function writeJustShared(record: JustSharedRecord): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(JUST_SHARED_STORAGE_KEY, JSON.stringify(record))
  } catch {
    // ignore
  }
}

export function readJustShared(): JustSharedRecord | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(JUST_SHARED_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as JustSharedRecord
    if (Date.now() - parsed.sharedAt > JUST_SHARED_WINDOW_MS) {
      window.sessionStorage.removeItem(JUST_SHARED_STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function consumeJustShared(todoId: string): boolean {
  const rec = readJustShared()
  if (!rec || rec.todoId !== todoId) return false
  try {
    window.sessionStorage.removeItem(JUST_SHARED_STORAGE_KEY)
  } catch {
    // ignore
  }
  return true
}
