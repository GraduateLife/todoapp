import { Link } from '@tanstack/react-router'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  return (
    <header className="relative" style={{ zIndex: 50 }}>
      <nav
        className="w-[95%] mx-auto flex items-stretch gap-6 py-3 bg-transparent"
        style={{ minHeight: 52 }}
      >
        {/* Logo */}

        {/* Nav links */}
        <div className="flex items-center gap-5">
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
        <div className="ml-auto flex items-center">
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
