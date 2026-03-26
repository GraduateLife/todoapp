import { useEffect, useState } from 'react'

type ThemeMode = 'light' | 'dark' | 'auto'

function getInitialMode(): ThemeMode {
  if (typeof window === 'undefined') return 'auto'
  const stored = window.localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark' || stored === 'auto')
    return stored
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

const ITEMS: { mode: ThemeMode; label: string }[] = [
  { mode: 'light', label: 'LIT' },
  { mode: 'dark', label: 'DRK' },
  { mode: 'auto', label: 'AUT' },
]

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>('auto')

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

  function selectMode(m: ThemeMode) {
    setMode(m)
    applyThemeMode(m)
    window.localStorage.setItem('theme', m)
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        padding: '0 4px',
        userSelect: 'none',
      }}
    >
      {ITEMS.map(({ mode: m, label }) => {
        const active = mode === m
        return (
          <button
            key={m}
            type="button"
            onClick={() => selectMode(m)}
            title={m.charAt(0).toUpperCase() + m.slice(1)}
            aria-label={`Theme: ${m}`}
            aria-pressed={active}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px 5px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
            }}
          >
            {/* LED light */}
            <span
              style={{
                display: 'block',
                width: 6,
                height: 6,
                borderRadius: 1,
                backgroundColor: active
                  ? '#f5d000'
                  : 'var(--rf-text-dim, #8899aa)',
                opacity: active ? 1 : 0.2,
                boxShadow: active ? '0 0 3px 1px #f5d000' : 'none',
                transition:
                  'box-shadow 200ms, opacity 200ms, background-color 200ms',
              }}
            />
            {/* Label */}
            <span
              style={{
                fontFamily: "'Space Mono', ui-monospace, monospace",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: active ? '#f5d000' : 'var(--rf-text-dim, #8899aa)',
                opacity: active ? 1 : 0.3,
                transition: 'opacity 200ms, color 200ms',
                lineHeight: 1,
              }}
            >
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
