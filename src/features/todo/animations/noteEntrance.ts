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
  stiffness: 120,
  damping: 18,
  mass: 0.6,
}

// ── "Return from top" entrance (returning from share page) ──────────────────

/**
 * Compute the y offset for the return-from-top animation.
 * Returns a negative value (distance from top of viewport above the card).
 */
export function getReturnFromTopOffset(cardY: number): number {
  // Push the card off-screen above the viewport, with a margin so it
  // visibly enters from outside the screen.
  return -(cardY + 240)
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
  y: 400,
  opacity: 0,
  transition: { duration: 0.25, ease: 'easeIn' } as Transition,
} as const
