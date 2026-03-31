import { useState, useEffect } from 'react'

type Theme = 'dark' | 'light'

function getTheme(): Theme {
  return document.documentElement.classList.contains('light') ? 'light' : 'dark'
}

/** Reactively returns the current theme ('dark' | 'light'). */
export function useTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(() =>
    typeof document !== 'undefined' ? getTheme() : 'dark',
  )

  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(getTheme()))
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => observer.disconnect()
  }, [])

  return theme
}
