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
/** Max drag distance (px) to count as a "shake" that dismisses a stale reminder.
 *  Drag further than this → normal move; drag less → shake dismiss. */
export const REMINDER_SHAKE_DISTANCE = 60

// ── Delete zone ────────────────────────────────────────────────────────────
/** Time (ms) in bottom zone before glitch/delete phase begins */
export const DELETE_GLITCH_DELAY = 1000
/** Duration (ms) of glitch phase before auto-delete fires */
export const DELETE_GLITCH_DURATION = 3000
