import { createPortal } from 'react-dom'
import { useEffect, useRef } from 'react'

interface TodoContextMenuProps {
  open: boolean
  position: { x: number; y: number }
  onClose: () => void
  onDelete: () => void
}

export function TodoContextMenu({
  open,
  position,
  onClose,
  onDelete,
}: TodoContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('click', handleClick, true)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('click', handleClick, true)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  const handleDelete = () => {
    onDelete()
    onClose()
  }

  if (!open || typeof document === 'undefined') return null

  const menu = (
    <div
      ref={menuRef}
      className="rf-context-menu fixed"
      style={{ left: position.x, top: position.y }}
      role="menu"
      aria-label="Note actions"
    >
      {/* Menu header */}
      <div
        className="px-3 py-1.5 font-mono text-[8px] tracking-[0.2em] uppercase opacity-40 border-b border-[var(--rf-border)]"
        style={{ color: 'var(--rf-cyan)' }}
      >
        actions
      </div>
      <button
        type="button"
        className="rf-context-item rf-context-item--delete"
        role="menuitem"
        onClick={handleDelete}
      >
        [ delete ]
      </button>
    </div>
  )

  return createPortal(menu, document.body)
}
