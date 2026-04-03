import type { LineToken } from '../../utils/parseMarkdownInput'

// ── Token styles ──────────────────────────────────────────────────────────────
export const TOKEN_STYLE: Record<
  LineToken['kind'],
  { color: string; label: string; bg?: string; wavy?: string }
> = {
  title: { color: 'var(--rf-text)', label: 'TITLE' },
  subtask: { color: 'var(--rf-cyan)', label: 'SUB' },
  color: { color: 'var(--rf-amber, #ffb800)', label: 'CLR' },
  warn: {
    color: 'var(--rf-amber, #ffb800)',
    label: 'SUB?',
    bg: 'rgba(255,184,0,0.05)',
    wavy: 'rf-row-wavy-warn',
  },
  extra: {
    color: 'var(--rf-text)',
    label: 'SUB',
    bg: 'rgba(0,245,255,0.02)',
  },
  empty: { color: 'transparent', label: '' },
}

// These constants must stay in sync between textarea and overlay
export const TA_LINE_H = 1.7 // matches lineHeight on textarea
export const TA_PAD_TOP = '0.35rem' // matches paddingTop on textarea
export const LABEL_W = '4rem' // right gutter width for labels
export const MAX_HEIGHT = 220 // ~10 lines before scrollbar appears

// Title character limit: ~25 chars/line on main card × 4 lines  (fan card clamps to 3 lines visually)
export const TITLE_MAX_LEN = 100
