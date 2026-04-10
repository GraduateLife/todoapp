import type { NoteColor, Priority } from '../types'

/**
 * Priority ↔ color mapping (1:1).
 *
 * The `system` priority / cyan color is reserved for cards created by a future
 * AI assistant agent. Users cannot create system/cyan cards through any input
 * path — it is not present in MARK_TO_PRIORITY and must only be produced by a
 * dedicated service entry point (e.g. `TodoService.createFromSystem`).
 */
export const PRIORITY_TO_COLOR: Record<Priority, NoteColor> = {
  high: 'pink',
  normal: 'amber',
  low: 'green',
  idea: 'purple',
  system: 'cyan',
}

/**
 * User-typeable trailing-mark → priority map.
 *
 * Note: `system` has no mark on purpose. Users must never be able to create a
 * system card via text input.
 */
export const MARK_TO_PRIORITY: Record<string, Priority> = {
  '!': 'high',
  '.': 'normal',
  '?': 'low',
  '~': 'idea',
}

/** Priorities the user is allowed to produce via text / picker. */
export const USER_PRIORITIES: Priority[] = ['high', 'normal', 'low', 'idea']

export function priorityToColor(priority: Priority): NoteColor {
  return PRIORITY_TO_COLOR[priority]
}

/**
 * Parse the trailing mark of a title.
 *
 *   "Buy groceries!"  → { priority: 'high',   stripped: 'Buy groceries' }
 *   "Ship it."        → { priority: 'normal', stripped: 'Ship it' }
 *   "Maybe later?"    → { priority: 'low',    stripped: 'Maybe later' }
 *   "Dark mode~"      → { priority: 'idea',   stripped: 'Dark mode' }
 *   "No mark here"    → { priority: 'normal', stripped: 'No mark here' }
 *
 * No trailing mark implies `normal`. We do *not* auto-insert a `.` — the title
 * stored downstream is exactly what the user typed (minus a recognised mark).
 */
export function parseTrailingMark(text: string): {
  priority: Priority
  stripped: string
} {
  const last = text.slice(-1)
  const priority = MARK_TO_PRIORITY[last]
  if (priority) {
    return { priority, stripped: text.slice(0, -1).trimEnd() }
  }
  return { priority: 'normal', stripped: text }
}
