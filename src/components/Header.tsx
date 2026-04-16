import { Link } from '@tanstack/react-router'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  return (
    // pointer-events surgery: the <header> + <nav> would otherwise intercept
    // pointer events across the entire top strip of the viewport (they sit in
    // a stacking context above the sticky-note canvas). Make the empty area
    // transparent to events, and re-enable events only on the actual
    // interactive islands (the link group and the theme toggle).
    <header className="relative" style={{ zIndex: 50, pointerEvents: 'none' }}>
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
