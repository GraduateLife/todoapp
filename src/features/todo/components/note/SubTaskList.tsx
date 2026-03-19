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
  isAddingExternal?: boolean   // set true from outside (e.g. context menu)
  onAddingClose?: () => void   // called when the input closes
  onToggle: (subtaskId: string) => void
  onDelete: (subtaskId: string) => void
  onAdd: (title: string) => void
  onUpdate: (subtaskId: string, title: string) => void
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
  onUpdate,
}: SubTaskListProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const addInputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  // Sync external trigger
  useEffect(() => {
    if (isAddingExternal) setIsAdding(true)
  }, [isAddingExternal])

  useEffect(() => {
    if (isAdding) addInputRef.current?.focus()
  }, [isAdding])

  useEffect(() => {
    if (editingId) editInputRef.current?.focus()
  }, [editingId])

  const visibleSubtasks = isExpanded ? subtasks : subtasks.slice(0, MAX_VISIBLE)
  const hiddenCount = subtasks.length - MAX_VISIBLE
  const completedCount = subtasks.filter((s) => s.completed).length
  const progressPct = subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0

  const handleAddSubmit = () => {
    const trimmed = newTitle.trim()
    if (trimmed) {
      onAdd(trimmed)
      setNewTitle('')
    }
  }

  const handleAddKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAddSubmit()
    if (e.key === 'Escape') {
      setIsAdding(false)
      setNewTitle('')
      onAddingClose?.()
    }
  }

  const startEditing = (s: SubTask) => {
    setEditingId(s.id)
    setEditingValue(s.title)
  }

  const saveEdit = () => {
    if (!editingId) return
    const trimmed = editingValue.trim()
    if (trimmed) onUpdate(editingId, trimmed)
    setEditingId(null)
    setEditingValue('')
  }

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') saveEdit()
    if (e.key === 'Escape') {
      setEditingId(null)
      setEditingValue('')
    }
  }

  const hasBorder = subtasks.length > 0 || isAdding

  return (
    <div
      style={hasBorder ? { borderTop: `1px solid ${dimColor}` } : undefined}
      className={hasBorder ? 'mt-3 pt-2' : 'mt-2'}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Progress bar */}
      {subtasks.length > 0 && (
        <div className="mb-2">
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ height: 2, backgroundColor: dimColor, opacity: 0.25 }}
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
            <span className="font-mono text-[9px] opacity-50" style={{ color: dimColor }}>
              subtasks
            </span>
            <span className="font-mono text-[9px] opacity-60" style={{ color: dimColor }}>
              {completedCount}/{subtasks.length}
            </span>
          </div>
        </div>
      )}

      {/* Subtask rows */}
      {subtasks.length > 0 && (
        <div className="flex flex-col gap-[3px]">
          {visibleSubtasks.map((s) => (
            <div key={s.id} className="flex items-center gap-2 group">
              {/* Mini checkbox */}
              <button
                type="button"
                onClick={() => onToggle(s.id)}
                style={{
                  width: 12,
                  height: 12,
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
                  <span style={{ color: checkColor, fontSize: 8, lineHeight: 1 }} className="font-mono">
                    ✕
                  </span>
                )}
              </button>

              {/* Subtask title — double-click to edit */}
              {editingId === s.id ? (
                <input
                  ref={editInputRef}
                  type="text"
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  onBlur={saveEdit}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    color: textColor,
                    border: 'none',
                    borderBottom: `1px solid ${borderColor}`,
                    outline: 'none',
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '0.75rem',
                    caretColor: borderColor,
                  }}
                />
              ) : (
                <span
                  onDoubleClick={() => !s.completed && startEditing(s)}
                  className="flex-1 font-mono text-[0.75rem] leading-tight break-words min-w-0"
                  style={{
                    color: textColor,
                    opacity: s.completed ? 0.4 : 0.85,
                    textDecoration: s.completed ? 'line-through' : 'none',
                    cursor: s.completed ? 'default' : 'text',
                  }}
                >
                  {s.title}
                </span>
              )}

              {/* Delete on hover */}
              <button
                type="button"
                onClick={() => onDelete(s.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity font-mono text-[10px]"
                style={{ color: '#ff3030', lineHeight: 1, cursor: 'pointer', flexShrink: 0 }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Expand/collapse toggle */}
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setIsExpanded((v) => !v)}
          className="mt-1 font-mono text-[9px] tracking-[0.1em] opacity-50 hover:opacity-80 transition-opacity"
          style={{ color: dimColor, cursor: 'pointer' }}
        >
          {isExpanded ? '▲ less' : `▼ +${hiddenCount} more`}
        </button>
      )}

      {/* Add subtask inline input */}
      {isAdding ? (
        <div className="flex items-center gap-1.5 mt-1.5">
          <span
            style={{ color: dimColor, fontSize: 9, lineHeight: 1, flexShrink: 0 }}
            className="font-mono opacity-60"
          >
            +
          </span>
          <input
            ref={addInputRef}
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
            placeholder="new subtask..."
            style={{
              background: 'transparent',
              color: textColor,
              border: 'none',
              borderBottom: `1px solid ${borderColor}`,
              outline: 'none',
              width: '100%',
              fontFamily: "'Space Mono', monospace",
              fontSize: '0.75rem',
              caretColor: borderColor,
            }}
          />
        </div>
      ) : (
        /* [+] button always visible at the bottom of the subtask section */
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="mt-1.5 font-mono text-[9px] tracking-[0.12em] opacity-50 hover:opacity-90 transition-opacity flex items-center gap-1"
          style={{ color: borderColor, cursor: 'pointer', lineHeight: 1 }}
        >
          <span>[+]</span>
          <span style={{ color: dimColor }}>subtask</span>
        </button>
      )}
    </div>
  )
}

SubTaskList.displayName = 'SubTaskList'
