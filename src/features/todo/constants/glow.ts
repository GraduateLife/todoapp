/**
 * Centralised card-glow / brightness constants.
 *
 * The visual intensity of a card is now decoupled from priority (which is
 * encoded by *colour*). Instead, intensity conveys **reminder state**:
 *
 *   ┌─────────────┬──────────┬───────────┬─────────────────────────┐
 *   │ State       │ Glow α   │ Opacity   │ Animation               │
 *   ├─────────────┼──────────┼───────────┼─────────────────────────┤
 *   │ none        │ 0.35     │ 1.0       │ —                       │
 *   │ active      │ 0.55     │ 1.0       │ pulsing ring (1.8s)     │
 *   │ overdue     │ 0.18     │ 0.8       │ —                       │
 *   └─────────────┴──────────┴───────────┴─────────────────────────┘
 *
 * Zone-drag interactions overlay their own glow/colour (see ZONE_VISUALS)
 * and bypass these reminder-driven values.
 *
 * See also:
 *   - constants/priority.ts   — priority ↔ colour mapping
 *   - constants/noteColors.ts — palette definitions (ns.glow, ns.border…)
 *   - MEMORY: priority_color_system.md
 */

import type { ReminderVisualState } from '../components/StickyNote'

// ─── Reminder-driven intensity ──────────────────────────────────────────────

export const GLOW = {
  /** No reminder set — the default "comfortable" brightness. */
  none: {
    size: 18,
    alpha: 0.35,
    opacity: 1.0,
  },
  /** Reminder is armed but hasn't fired yet — brighter + pulsing ring. */
  active: {
    size: 24,
    alpha: 0.55,
    opacity: 1.0,
  },
  /** Reminder has fired, user hasn't dismissed — dim flicker. */
  stale: {
    size: 6,
    alpha: 0.10,
    opacity: 1.0,
  },
} as const satisfies Record<ReminderVisualState, { size: number; alpha: number; opacity: number }>

/** Stack-target gets a stronger glow than baseline to highlight the drop zone. */
export const STACK_TARGET_ALPHA = 0.65

// ─── Edge zone drag overrides ───────────────────────────────────────────────

export const EDGE_ZONE_GLOW_SIZE = 20

export const ZONE_VISUALS = {
  delete:   { color: '#ff3030', glow: 'rgba(255,48,48,0.5)',    label: '[ delete ]' },
  archive:  { color: '#ff3030', glow: 'rgba(255,48,48,0.5)',    label: '[ archive ]' },
  stack:    { color: '#00f5ff', glow: 'rgba(0,245,255,0.5)',    label: '[ stack ]' },
  export:   { color: '#ffb800', glow: 'rgba(255,184,0,0.5)',    label: '[ export ]' },
} as const

// ─── Box-shadow builder ─────────────────────────────────────────────────────

/**
 * Build the three-layer box-shadow string used by every StickyNote card.
 *
 *   1. Coloured glow   — `0 0 <size>px <glowColor>`
 *   2. Inset highlight  — `inset 0 1px 0 rgba(255,255,255,0.04)`
 */
export function buildBoxShadow(glowColor: string, glowSize: number): string {
  return `0 0 ${glowSize}px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.04)`
}

/**
 * Extract RGB components from an `rgba(r,g,b,a)` or `rgb(r,g,b)` string.
 * Falls back to cyan [0, 245, 255] if parsing fails.
 */
export function extractRGB(rgba: string): [string, string, string] {
  const m = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  return m ? [m[1], m[2], m[3]] : ['0', '245', '255']
}

/**
 * Build an rgba string from RGB components + alpha.
 */
export function rgbaString(r: string, g: string, b: string, alpha: number): string {
  return `rgba(${r},${g},${b},${alpha})`
}

/**
 * Compute all glow values for a card given its reminder state and palette glow.
 *
 * Returns `{ glowColor, glowSize, cardOpacity }` — the caller can override
 * these when the card is in a drag-zone or is a stack target.
 */
export function computeCardGlow(
  reminderState: ReminderVisualState,
  paletteGlow: string,
): {
  glowColor: string
  glowSize: number
  cardOpacity: number
} {
  const [r, g, b] = extractRGB(paletteGlow)
  const level = GLOW[reminderState]
  return {
    glowColor: rgbaString(r, g, b, level.alpha),
    glowSize: level.size,
    cardOpacity: level.opacity,
  }
}
