import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import ThemeToggle from './ThemeToggle'
import { ArchivePanel } from '#/features/todo/components/archive/ArchivePanel'

export default function Header() {
  const [archiveOpen, setArchiveOpen] = useState(false)

  return (
    <header className="rf-header relative" style={{ zIndex: 50 }}>
      <nav
        className="page-wrap flex items-center gap-6 py-3"
        style={{ minHeight: 52 }}
      >
        {/* Logo */}
        <Link
          to="/"
          style={{ textDecoration: 'none' }}
          className="rf-logo flex items-center"
        >
          <span className="rf-logo-dot" />
          NEURAL-TODO
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-5">
          <Link
            to="/"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            board
          </Link>
          <Link
            to="/about"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            about
          </Link>
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-4">
          <button
            type="button"
            className="rf-btn"
            onClick={() => setArchiveOpen(true)}
          >
            archive
          </button>
        </div>
      </nav>

      {/* Bottom gradient line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[1px] pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(0,245,255,0.45) 30%, rgba(191,95,255,0.3) 70%, transparent)',
        }}
      />

      <ArchivePanel open={archiveOpen} onClose={() => setArchiveOpen(false)} />
      <ThemeToggle />
    </header>
  )
}
