import type { Transition } from 'framer-motion'

// How recent a todo must be (ms) to play the "throw" entrance
const FRESH_THRESHOLD = 1500

/** Check if a todo was just created (should play throw animation) */
export function isFreshTodo(createdAt: number): boolean {
  return Date.now() - createdAt < FRESH_THRESHOLD
}

// ── "Throw from bottom" entrance ────────────────────────────────────────────

/**
 * Compute the y offset for the throw animation.
 * Returns a positive value (distance from input bar to card's final y).
 */
export function getThrowYOffset(cardY: number): number {
  const inputBarY = typeof window !== 'undefined' ? window.innerHeight - 60 : 700
  return Math.max(inputBarY - cardY, 200)
}

export const NOTE_THROW_TRANSITION: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 22,
  mass: 0.9,
}

// ── Default entrance (page load / existing cards) ───────────────────────────

export const NOTE_DEFAULT_INITIAL = {
  scale: 0.5,
  opacity: 0,
} as const

export const NOTE_DEFAULT_TRANSITION: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 28,
}

// ── Exit ────────────────────────────────────────────────────────────────────

export const NOTE_EXIT = {
  scale: 0.3,
  opacity: 0,
  transition: { duration: 0.15, ease: 'easeIn' } as Transition,
} as const
