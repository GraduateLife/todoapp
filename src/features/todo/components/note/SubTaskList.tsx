import { useState, useRef, useEffect } from 'react'
import type { SubTask } from '../../types'

const MAX_VISIBLE = 6

interface SubTaskListProps {
  subtasks: SubTask[]
  borderColor: string
  textColor: string
  dimColor: string
  checkColor: string
  glowColor: string
  isAddingExternal?: boolean   // set true from outside (e.g. [+] button or context menu)
  onAddingClose?: () => void   // called when the input closes
  onToggle: (subtaskId: string) => void
  onDelete: (subtaskId: string) => void
  onAdd: (title: string) => void
}

export function SubTaskList({
  subtasks,
  borderColor,
  textColor,
  dimColor,
  checkColor,
  glowColor,
  isAddingExternal,
  onAddingClose,
  onToggle,
  onDelete,
  onAdd,
}: SubTaskListProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync external trigger
  useEffect(() => {
    if (isAddingExternal) setIsAdding(true)
  }, [isAddingExternal])

  useEffect(() => {
    if (isAdding) inputRef.current?.focus()
  }, [isAdding])

  const visibleSubtasks = isExpanded ? subtasks : subtasks.slice(0, MAX_VISIBLE)
  const hiddenCount = subtasks.length - MAX_VISIBLE
  const completedCount = subtasks.filter((s) => s.completed).length
  const progressPct = subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0

  const handleAddSubmit = () => {
    const trimmed = newTitle.trim()
    if (trimmed) {
      onAdd(trimmed)
      setNewTitle('')
      // Keep adding mode open for quick sequential entry
    }
  }

  const handleAddKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAddSubmit()
    if (e.key === 'Escape') {
      setIsAdding(false)
      setNewTitle('')
    }
  }

  if (subtasks.length === 0 && !isAdding) return null

  return (
    <div
      style={{ borderTop: `1px solid ${dimColor}` }}
      className="mt-3 pt-2"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Progress bar */}
      {subtasks.length > 0 && (
        <div className="mb-2">
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ height: 2, background: `rgba(${dimColor},0.2)`, backgroundColor: dimColor, opacity: 0.25 }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: '100%',
                background: borderColor,
                boxShadow: `0 0 4px ${glowColor}`,
                transition: 'width 300ms ease',
              }}
            />
          </div>
          <div className="flex justify-between mt-0.5">
            <span className="font-mono text-[7px] opacity-50" style={{ color: dimColor }}>
              subtasks
            </span>
            <span className="font-mono text-[7px] opacity-60" style={{ color: dimColor }}>
              {completedCount}/{subtasks.length}
            </span>
          </div>
        </div>
      )}

      {/* Subtask rows */}
      <div className="flex flex-col gap-[3px]">
        {visibleSubtasks.map((s) => (
          <div key={s.id} className="flex items-center gap-1.5 group">
            {/* Mini checkbox */}
            <button
              type="button"
              onClick={() => onToggle(s.id)}
              style={{
                width: 10,
                height: 10,
                flexShrink: 0,
                border: `1px solid ${borderColor}`,
                background: s.completed ? `${borderColor}30` : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                borderRadius: 1,
              }}
            >
              {s.completed && (
                <span style={{ color: checkColor, fontSize: 7, lineHeight: 1 }} className="font-mono">
                  ✕
                </span>
              )}
            </button>

            {/* Subtask title */}
            <span
              className="flex-1 font-mono text-[0.7rem] leading-tight truncate"
              style={{
                color: textColor,
                opacity: s.completed ? 0.4 : 0.85,
                textDecoration: s.completed ? 'line-through' : 'none',
              }}
            >
              {s.title}
            </span>

            {/* Delete on hover */}
            <button
              type="button"
              onClick={() => onDelete(s.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity font-mono text-[8px]"
              style={{ color: '#ff3030', lineHeight: 1, cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Expand/collapse toggle */}
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setIsExpanded((v) => !v)}
          className="mt-1 font-mono text-[8px] tracking-[0.1em] opacity-50 hover:opacity-80 transition-opacity"
          style={{ color: dimColor, cursor: 'pointer' }}
        >
          {isExpanded ? '▲ less' : `▼ +${hiddenCount} more`}
        </button>
      )}

      {/* Add subtask inline input */}
      {isAdding && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <span
            style={{ color: dimColor, fontSize: 9, lineHeight: 1, flexShrink: 0 }}
            className="font-mono opacity-60"
          >
            +
          </span>
          <input
            ref={inputRef}
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={handleAddKeyDown}
            onBlur={() => {
              handleAddSubmit()
              setIsAdding(false)
              setNewTitle('')
              onAddingClose?.()
            }}
            placeholder="subtask..."
            style={{
              background: 'transparent',
              color: textColor,
              border: 'none',
              borderBottom: `1px solid ${borderColor}`,
              outline: 'none',
              width: '100%',
              fontFamily: "'Space Mono', monospace",
              fontSize: '0.7rem',
              caretColor: borderColor,
            }}
          />
        </div>
      )}
    </div>
  )
}

// Exported helper to trigger adding from outside (e.g. context menu)
SubTaskList.displayName = 'SubTaskList'
