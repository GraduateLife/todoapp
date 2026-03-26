import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { Todo, NoteColor } from '../../types'
import { NOTE_STYLES } from '../../constants/noteColors'

interface FolderTodoCardProps {
  todo: Todo
  onMoveToMain: (todoId: string) => void
  onDelete: (todoId: string) => void
  onToggle: (todoId: string) => void
}

export function FolderTodoCard({
  todo,
  onMoveToMain,
  onDelete,
  onToggle,
}: FolderTodoCardProps) {
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const sNs = NOTE_STYLES[todo.color as NoteColor] ?? NOTE_STYLES.cyan

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
    const menuW = 150,
      menuH = 80
    setMenuPos({
      x: Math.min(e.clientX, window.innerWidth - menuW - 8),
      y: Math.min(e.clientY, window.innerHeight - menuH - 8),
    })
  }

  const contextMenu =
    menuPos &&
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
          onClick={() => {
            onMoveToMain(todo.id)
            setMenuPos(null)
          }}
        >
          [ move to main ]
        </button>
        <div className="rf-context-separator" />
        <button
          type="button"
          className="rf-context-item rf-context-item--delete"
          role="menuitem"
          onClick={() => {
            onDelete(todo.id)
            setMenuPos(null)
          }}
        >
          [ delete ]
        </button>
      </div>,
      document.body,
    )

  const totalSubs = todo.subtasks?.length ?? 0
  const doneSubs = todo.subtasks?.filter((s) => s.completed).length ?? 0

  return (
    <>
      <div
        className="relative select-none"
        onContextMenu={handleContextMenu}
        style={{
          background: sNs.bg,
          border: `1px solid ${sNs.border}99`,
          boxShadow: `0 0 8px ${sNs.glow}, 0 3px 12px rgba(0,0,0,0.45)`,
          borderRadius: 3,
          padding: '8px 11px',
          width: 170,
          minHeight: 124,
          overflow: 'hidden',
          position: 'relative',
          fontFamily: "'Space Mono', monospace",
          userSelect: 'none',
        }}
      >
        {/* Square checkbox — absolute top-left */}
        <button
          onClick={() => onToggle(todo.id)}
          title={todo.completed ? 'Mark incomplete' : 'Mark complete'}
          style={{
            position: 'absolute',
            top: 8,
            left: 11,
            zIndex: 1,
            width: 13,
            height: 13,
            border: `1px solid ${sNs.border}`,
            background: todo.completed ? `${sNs.border}30` : 'transparent',
            boxShadow: todo.completed ? `0 0 5px ${sNs.glow}` : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            borderRadius: 1,
            padding: 0,
          }}
        >
          {todo.completed && (
            <span
              style={{
                color: sNs.text,
                fontSize: 8,
                lineHeight: 1,
                fontFamily: 'monospace',
              }}
            >
              ✕
            </span>
          )}
        </button>

        {/* Eject button — absolute top-right */}
        <button
          onClick={() => onMoveToMain(todo.id)}
          title="move to main"
          style={{
            position: 'absolute',
            top: 5,
            right: 9,
            zIndex: 1,
            color: sNs.border,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            fontFamily: "'Space Mono', monospace",
            fontSize: 13,
            fontWeight: 700,
            lineHeight: 1,
            opacity: 0.75,
          }}
        >
          ↗
        </button>

        {/* Title */}
        <p
          style={
            {
              color: todo.completed ? sNs.dim : sNs.text,
              fontFamily: "'Space Mono', monospace",
              fontSize: '0.72rem',
              lineHeight: 1.4,
              margin: 0,
              paddingTop: 22,
              opacity: todo.completed ? 0.5 : 1,
              textDecoration: todo.completed ? 'line-through' : 'none',
              wordBreak: 'break-word',
              display: '-webkit-box',
              WebkitLineClamp: totalSubs > 0 ? 4 : 5,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            } as React.CSSProperties
          }
        >
          {todo.title || 'Untitled'}
        </p>

        {/* Subtask progress */}
        {totalSubs > 0 && (
          <p
            style={{
              color: sNs.dim,
              fontFamily: "'Space Mono', monospace",
              fontSize: '0.62rem',
              marginTop: 4,
              opacity: 0.65,
            }}
          >
            {doneSubs}/{totalSubs} done
          </p>
        )}

        {/* High-priority bottom accent */}
        {todo.priority === 'high' && (
          <div
            style={{
              marginTop: 6,
              height: 1,
              width: '100%',
              background: sNs.border,
              boxShadow: `0 0 4px ${sNs.border}`,
              opacity: 0.7,
            }}
          />
        )}
      </div>

      {contextMenu}
    </>
  )
}
