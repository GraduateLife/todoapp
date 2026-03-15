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
      className="fixed z-50 min-w-[120px] rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] py-1 shadow-lg"
      style={{ left: position.x, top: position.y }}
      role="menu"
      aria-label="Todo actions"
    >
      <button
        type="button"
        className="w-full px-3 py-2 text-left text-sm text-danger hover:bg-[var(--line)]"
        role="menuitem"
        onClick={handleDelete}
      >
        Delete
      </button>
    </div>
  )

  return createPortal(menu, document.body)
}
