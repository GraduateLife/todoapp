import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { Todo, NoteColor } from '../../types'

const COLOR_VAR: Record<NoteColor, string> = {
  cyan: 'var(--rf-cyan)',
  pink: 'var(--rf-pink)',
  amber: 'var(--rf-amber)',
  green: 'var(--rf-green)',
  purple: 'var(--rf-purple)',
}

const COLOR_RGB: Record<NoteColor, string> = {
  cyan: '0,245,255',
  pink: '255,45,120',
  amber: '255,184,0',
  green: '57,255,20',
  purple: '191,95,255',
}

interface FolderTodoCardProps {
  todo: Todo
  onMoveToMain: (todoId: string) => void
  onDelete: (todoId: string) => void
  onToggle: (todoId: string) => void
}

export function FolderTodoCard({ todo, onMoveToMain, onDelete, onToggle }: FolderTodoCardProps) {
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const color = todo.color as NoteColor
  const colorVar = COLOR_VAR[color]
  const rgb = COLOR_RGB[color]

  // Close context menu on outside click
  useEffect(() => {
    if (!menuPos) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuPos(null)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuPos(null)
    }
    document.addEventListener('mousedown', handleClick, true)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick, true)
      document.removeEventListener('keydown', handleKey)
    }
  }, [menuPos])

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Clamp so menu doesn't overflow viewport
    const menuW = 150
    const menuH = 80
    setMenuPos({
      x: Math.min(e.clientX, window.innerWidth - menuW - 8),
      y: Math.min(e.clientY, window.innerHeight - menuH - 8),
    })
  }

  const contextMenu = menuPos &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        ref={menuRef}
        className="rf-context-menu fixed"
        style={{ left: menuPos.x, top: menuPos.y, zIndex: 9800 }}
        role="menu"
      >
        <button
          type="button"
          className="rf-context-item"
          role="menuitem"
          onClick={() => { onMoveToMain(todo.id); setMenuPos(null) }}
        >
          [ move to main ]
        </button>
        <div className="rf-context-separator" />
        <button
          type="button"
          className="rf-context-item rf-context-item--delete"
          role="menuitem"
          onClick={() => { onDelete(todo.id); setMenuPos(null) }}
        >
          [ delete ]
        </button>
      </div>,
      document.body
    )

  return (
    <>
      <div
        className="relative inline-flex"
        onContextMenu={handleContextMenu}
      >
        <div
          className="font-mono cursor-grab active:cursor-grabbing select-none"
          style={{
            background: `rgba(${rgb}, 0.06)`,
            border: `1px solid rgba(${rgb}, 0.28)`,
            borderRadius: 3,
            boxShadow: `0 0 10px rgba(${rgb}, 0.07)`,
            padding: '8px 10px',
            minWidth: 80,
            maxWidth: 192,
          }}
        >
          {/* Completion dot + title */}
          <div className="flex items-start gap-2">
            {/* Dot — click to toggle */}
            <span
              className="flex-shrink-0 mt-[3px] w-[7px] h-[7px] rounded-full cursor-pointer"
              style={{
                background: todo.completed ? colorVar : 'transparent',
                border: `1px solid rgba(${rgb}, 0.55)`,
                boxShadow: todo.completed ? `0 0 5px ${colorVar}` : 'none',
                transition: 'all 120ms ease',
              }}
              onClick={(e) => { e.stopPropagation(); onToggle(todo.id) }}
            />
            {/* Title */}
            <span
              className="text-[0.72rem] leading-snug"
              style={{
                color: todo.completed ? `rgba(${rgb}, 0.35)` : 'var(--rf-text)',
                textDecoration: todo.completed ? 'line-through' : 'none',
                wordBreak: 'break-word',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {todo.title}
            </span>
          </div>

          {/* Priority indicator (bottom accent line) */}
          {todo.priority === 'high' && (
            <div
              className="mt-[6px] h-[1px] w-full"
              style={{ background: colorVar, boxShadow: `0 0 4px ${colorVar}`, opacity: 0.7 }}
            />
          )}
        </div>
      </div>

      {contextMenu}
    </>
  )
}
