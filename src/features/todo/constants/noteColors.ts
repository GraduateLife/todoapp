import type { NoteColor } from '../types'

export type NoteStyleEntry = {
  bg: string       // semi-transparent, used for the card background
  bgOpaque: string // fully opaque version, used for masking (e.g. reminder ring)
  border: string
  glow: string
  text: string
  dim: string
  check: string
}

// ─── Dark theme palette ───────────────────────────────────────────────────────
export const NOTE_STYLES: Record<NoteColor, NoteStyleEntry> = {
  cyan: {
    bg: 'rgba(4,22,27,0.80)',
    bgOpaque: 'rgb(4,22,27)',
    border: '#00f5ff',
    glow: 'rgba(0,245,255,0.35)',
    text: '#9ae8f0',
    dim: 'rgba(0,245,255,0.45)',
    check: '#00f5ff',
  },
  pink: {
    bg: 'rgba(28,4,15,0.80)',
    bgOpaque: 'rgb(28,4,15)',
    border: '#ff2d78',
    glow: 'rgba(255,45,120,0.35)',
    text: '#f0a0be',
    dim: 'rgba(255,45,120,0.45)',
    check: '#ff2d78',
  },
  amber: {
    bg: 'rgba(24,16,0,0.80)',
    bgOpaque: 'rgb(24,16,0)',
    border: '#ffb800',
    glow: 'rgba(255,184,0,0.35)',
    text: '#f0d890',
    dim: 'rgba(255,184,0,0.45)',
    check: '#ffb800',
  },
  green: {
    bg: 'rgba(4,22,4,0.80)',
    bgOpaque: 'rgb(4,22,4)',
    border: '#39ff14',
    glow: 'rgba(57,255,20,0.35)',
    text: '#9cf09a',
    dim: 'rgba(57,255,20,0.45)',
    check: '#39ff14',
  },
  purple: {
    bg: 'rgba(14,4,24,0.80)',
    bgOpaque: 'rgb(14,4,24)',
    border: '#bf5fff',
    glow: 'rgba(191,95,255,0.35)',
    text: '#d4a8f4',
    dim: 'rgba(191,95,255,0.45)',
    check: '#bf5fff',
  },
}

// ─── Light theme palette ──────────────────────────────────────────────────────
export const LIGHT_NOTE_STYLES: Record<NoteColor, NoteStyleEntry> = {
  cyan: {
    bg: 'rgba(220,248,252,0.78)',
    bgOpaque: 'rgb(220,248,252)',
    border: '#007a88',
    glow: 'rgba(0,122,136,0.25)',
    text: '#004d58',
    dim: 'rgba(0,122,136,0.5)',
    check: '#007a88',
  },
  pink: {
    bg: 'rgba(255,225,237,0.78)',
    bgOpaque: 'rgb(255,225,237)',
    border: '#b8004e',
    glow: 'rgba(184,0,78,0.25)',
    text: '#7a002e',
    dim: 'rgba(184,0,78,0.5)',
    check: '#b8004e',
  },
  amber: {
    bg: 'rgba(255,248,210,0.78)',
    bgOpaque: 'rgb(255,248,210)',
    border: '#9a6800',
    glow: 'rgba(154,104,0,0.25)',
    text: '#634200',
    dim: 'rgba(154,104,0,0.5)',
    check: '#9a6800',
  },
  green: {
    bg: 'rgba(215,250,215,0.78)',
    bgOpaque: 'rgb(215,250,215)',
    border: '#1a7a00',
    glow: 'rgba(26,122,0,0.25)',
    text: '#0e4f00',
    dim: 'rgba(26,122,0,0.5)',
    check: '#1a7a00',
  },
  purple: {
    bg: 'rgba(240,225,255,0.78)',
    bgOpaque: 'rgb(240,225,255)',
    border: '#7020b8',
    glow: 'rgba(112,32,184,0.25)',
    text: '#480080',
    dim: 'rgba(112,32,184,0.5)',
    check: '#7020b8',
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
