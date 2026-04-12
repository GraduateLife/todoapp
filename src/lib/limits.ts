/**
 * Centralized business-rule limits.
 * All validation thresholds and constraints live here.
 */

// ── Text ────────────────────────────────────────────────────────────────────
/** Max characters for a todo title (also used as condense/voice char limit) */
export const TITLE_MAX_LEN = 100

// ── Subtasks ────────────────────────────────────────────────────────────────
/** Max number of subtasks per todo */
export const MAX_SUBTASKS = 6

// ── Attachments ─────────────────────────────────────────────────────────────
/** Max file size in bytes (2 MB) */
export const MAX_FILE_SIZE = 2 * 1024 * 1024

/** Max number of files per todo */
export const MAX_FILES_PER_TODO = 5

/** Allowed MIME type prefixes for file uploads */
export const ALLOWED_FILE_TYPES: readonly string[] = ['image/', 'audio/']

// ── Structure ───────────────────────────────────────────────────────────────
/** Max todos in a stack */
export const MAX_STACK_SIZE = 5

// ── Reminders ──────────────────────────────────────────────────────────────
/** How long after firing the reminder stays in "overdue" (urgent flicker) before
 *  transitioning to "stale" (dim flicker). Also used as auto-dismiss for toast. */

const hourAsMs = 60 * 60 * 1000
const minuteAsMs = 60 * 1000
export const REMINDER_OVERDUE_MS = minuteAsMs
