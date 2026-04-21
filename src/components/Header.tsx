import { Link } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import ThemeToggle from './ThemeToggle'
import { useUiStore } from '../features/todo/store/uiStore'

export default function Header() {
  // Publish the header's live height to the UI store so drag-zone math and
  // top-edge UI hints can position themselves against the *real* header
  // height instead of a hardcoded constant. ResizeObserver fires whenever
  // the header's box changes (font load, viewport resize, content reflow).
  const headerRef = useRef<HTMLElement | null>(null)
  const setHeaderHeight = useUiStore((s) => s.setHeaderHeight)

  useEffect(() => {
    const el = headerRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    // Seed once so initial reads aren't stuck on the store default.
    setHeaderHeight(el.getBoundingClientRect().height)
    const ro = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect.height ?? el.getBoundingClientRect().height
      setHeaderHeight(h)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [setHeaderHeight])

  return (
    // pointer-events surgery: the <header> + <nav> would otherwise intercept
    // pointer events across the entire top strip of the viewport (they sit in
    // a stacking context above the sticky-note canvas). Make the empty area
    // transparent to events, and re-enable events only on the actual
    // interactive islands (the link group and the theme toggle).
    <header
      ref={headerRef}
      className="relative"
      style={{ zIndex: 50, pointerEvents: 'none' }}
    >
      <nav
        className="w-[95%] mx-auto flex items-stretch gap-6 py-3 bg-transparent"
        style={{ minHeight: 52, pointerEvents: 'none' }}
      >
        {/* Logo */}

        {/* Nav links */}
        <div className="flex items-center gap-5" style={{ pointerEvents: 'auto' }}>
          <Link
            to="/"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            deck
          </Link>
          <Link
            to="/about"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            about
          </Link>
          <Link
            to="/archive"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            archive
          </Link>
          <Link
            to="/share"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            share
          </Link>
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center" style={{ pointerEvents: 'auto' }}>
          <ThemeToggle />
        </div>
      </nav>

      {/* Bottom gradient line */}
      {/* <div
        className="absolute bottom-0 left-0 right-0 h-[1px] pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(0,245,255,0.45) 30%, rgba(191,95,255,0.3) 70%, transparent)',
        }}
      /> */}
    </header>
  )
}
