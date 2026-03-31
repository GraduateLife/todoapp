import type { Transition } from 'framer-motion'

/** Entry → Buffer: spring with slight overshoot */
export const EXPAND_TRANSITION: Transition = {
  type: 'spring',
  stiffness: 340,
  damping: 24,
  mass: 0.8,
}

/** Buffer → Entry: smooth ease-out collapse */
export const COLLAPSE_TRANSITION: Transition = {
  duration: 0.22,
  ease: [0.4, 0, 0.2, 1],
}

/** Content crossfade (opacity) */
export const FADE_TRANSITION: Transition = {
  duration: 0.12,
  ease: 'easeOut',
}

// Content area heights (excluding the 20px drag handle)
export const ENTRY_HEIGHT = 36
export const BUFFER_HEIGHT = 252
