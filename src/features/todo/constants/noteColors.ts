import type { NoteColor } from '../types'

// ─── Per-color visual palette ────────────────────────────────────────────────
export const NOTE_STYLES: Record<
  NoteColor,
  {
    bg: string
    border: string
    glow: string
    text: string
    dim: string
    check: string
  }
> = {
  cyan: {
    bg: '#04161b',
    border: '#00f5ff',
    glow: 'rgba(0,245,255,0.35)',
    text: '#9ae8f0',
    dim: 'rgba(0,245,255,0.45)',
    check: '#00f5ff',
  },
  pink: {
    bg: '#1c040f',
    border: '#ff2d78',
    glow: 'rgba(255,45,120,0.35)',
    text: '#f0a0be',
    dim: 'rgba(255,45,120,0.45)',
    check: '#ff2d78',
  },
  amber: {
    bg: '#181000',
    border: '#ffb800',
    glow: 'rgba(255,184,0,0.35)',
    text: '#f0d890',
    dim: 'rgba(255,184,0,0.45)',
    check: '#ffb800',
  },
  green: {
    bg: '#041604',
    border: '#39ff14',
    glow: 'rgba(57,255,20,0.35)',
    text: '#9cf09a',
    dim: 'rgba(57,255,20,0.45)',
    check: '#39ff14',
  },
  purple: {
    bg: '#0e0418',
    border: '#bf5fff',
    glow: 'rgba(191,95,255,0.35)',
    text: '#d4a8f4',
    dim: 'rgba(191,95,255,0.45)',
    check: '#bf5fff',
  },
}

// ─── Color picker options (including random) ─────────────────────────────────
export const COLOR_OPTIONS: {
  key: NoteColor | 'random'
  label: string
  hex: string
}[] = [
  { key: 'random', label: 'RND', hex: '#99aabb' },
  { key: 'cyan', label: 'CYN', hex: '#00f5ff' },
  { key: 'pink', label: 'PNK', hex: '#ff2d78' },
  { key: 'amber', label: 'AMB', hex: '#ffb800' },
  { key: 'green', label: 'GRN', hex: '#39ff14' },
  { key: 'purple', label: 'PRP', hex: '#bf5fff' },
]
