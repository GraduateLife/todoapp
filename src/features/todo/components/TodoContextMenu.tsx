import { createPortal } from 'react-dom'
import { useEffect, useRef } from 'react'
import type { Priority } from '../types'

const PRIORITY_LABELS: Record<Priority, string> = {
  low: '[ low ]',
  normal: '[ normal ]',
  high: '[ high ]',
}

interface TodoContextMenuProps {
  open: boolean
  position: { x: number; y: number }
  onClose: () => void
  onDelete: () => void
  onArchive: () => void
  onSetPriority: (priority: Priority) => void
  onAddSubTask: () => void
  onSetReminder: () => void
  onMoveToFolder: () => void
  currentPriority: Priority
  noteColor: string
}

export function TodoContextMenu({
  open,
  position,
  onClose,
  onDelete,
  onArchive,
  onSetPriority,
  onAddSubTask,
  onSetReminder,
  onMoveToFolder,
  currentPriority,
  noteColor,
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

  const handleAction = (fn: () => void) => {
    fn()
    onClose()
  }

  if (!open || typeof document === 'undefined') return null

  // Clamp menu position so it doesn't overflow viewport
  const menuWidth = 160
  const menuHeight = 200
  const left = Math.min(position.x, window.innerWidth - menuWidth - 8)
  const top = Math.min(position.y, window.innerHeight - menuHeight - 8)

  const menu = (
    <div
      ref={menuRef}
      className="rf-context-menu fixed"
      style={{ left, top }}
      role="menu"
      aria-label="Note actions"
    >
      {/* Header */}
      <div className="rf-context-section">actions</div>

      {/* ── Priority ── */}
      <div className="rf-context-separator" />
      <div className="rf-context-section">priority</div>

      {(['low', 'normal', 'high'] as Priority[]).map((p) => (
        <button
          key={p}
          type="button"
          className={`rf-context-item ${currentPriority === p ? 'rf-context-item--active' : ''}`}
          style={
            currentPriority === p
              ? { color: noteColor, textShadow: `0 0 6px ${noteColor}` }
              : undefined
          }
          role="menuitem"
          onClick={() => handleAction(() => onSetPriority(p))}
        >
          {currentPriority === p ? '▸ ' : '  '}
          {PRIORITY_LABELS[p]}
        </button>
      ))}

      {/* ── Actions ── */}
      <div className="rf-context-separator" />

      <button
        type="button"
        className="rf-context-item"
        role="menuitem"
        onClick={() => handleAction(onAddSubTask)}
      >
        [ add subtask ]
      </button>

      <button
        type="button"
        className="rf-context-item"
        role="menuitem"
        onClick={() => handleAction(onSetReminder)}
      >
        [ set reminder ]
      </button>

      <button
        type="button"
        className="rf-context-item"
        role="menuitem"
        onClick={() => handleAction(onMoveToFolder)}
      >
        [ move to folder ]
      </button>

      <button
        type="button"
        className="rf-context-item"
        role="menuitem"
        onClick={() => handleAction(onArchive)}
      >
        [ archive ]
      </button>

      <div className="rf-context-separator" />

      <button
        type="button"
        className="rf-context-item rf-context-item--delete"
        role="menuitem"
        onClick={() => handleAction(onDelete)}
      >
        [ delete ]
      </button>
    </div>
  )

  return createPortal(menu, document.body)
}
