import { useEffect, useState } from 'react'

type ThemeMode = 'light' | 'dark' | 'auto'

function getInitialMode(): ThemeMode {
  if (typeof window === 'undefined') return 'auto'
  const stored = window.localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark' || stored === 'auto') return stored
  return 'auto'
}

function applyThemeMode(mode: ThemeMode) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const resolved = mode === 'auto' ? (prefersDark ? 'dark' : 'light') : mode
  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add(resolved)
  if (mode === 'auto') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', mode)
  }
  document.documentElement.style.colorScheme = resolved
}

const SYMBOLS: Record<ThemeMode, string> = {
  auto:  '◐',
  dark:  '●',
  light: '○',
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>('auto')
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const m = getInitialMode()
    setMode(m)
    applyThemeMode(m)
  }, [])

  useEffect(() => {
    if (mode !== 'auto') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyThemeMode('auto')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [mode])

  function toggleMode() {
    const next: ThemeMode = mode === 'light' ? 'dark' : mode === 'dark' ? 'auto' : 'light'
    setMode(next)
    applyThemeMode(next)
    window.localStorage.setItem('theme', next)
  }

  return (
    <button
      type="button"
      onClick={toggleMode}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={`Theme: ${mode}`}
      title={`Theme: ${mode}. Click to cycle.`}
      style={{
        position:    'fixed',
        top:         14,
        right:       18,
        zIndex:      200,
        background:  'none',
        border:      'none',
        cursor:      'pointer',
        padding:     '4px 6px',
        fontFamily:  "'Space Mono', ui-monospace, monospace",
        fontSize:    9,
        letterSpacing: '0.2em',
        color:       'var(--rf-text-dim)',
        opacity:     hovered ? 0.85 : 0.32,
        transition:  'opacity 180ms',
        userSelect:  'none',
        lineHeight:  1,
      }}
    >
      {SYMBOLS[mode]} {mode.toUpperCase()}
    </button>
  )
}
