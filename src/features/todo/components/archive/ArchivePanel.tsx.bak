import { createPortal } from 'react-dom'
import { useEffect, useRef } from 'react'
import { useTodoStore } from '../../store'

interface ArchivePanelProps {
  open: boolean
  onClose: () => void
}

export function ArchivePanel({ open, onClose }: ArchivePanelProps) {
  const todos = useTodoStore((s) => s.todos)
  const unarchiveTodo = useTodoStore((s) => s.unarchiveTodo)
  const deleteTodo = useTodoStore((s) => s.deleteTodo)
  const panelRef = useRef<HTMLDivElement>(null)

  const archived = todos.filter((t) => t.archived)

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  const panel = (
    <div
      className="fixed inset-0 flex items-start justify-center pt-20"
      style={{ zIndex: 9400, background: 'rgba(4,6,12,0.8)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={panelRef}
        className="relative rounded-[3px] w-full max-w-lg mx-4"
        style={{
          background: '#080c18',
          border: '1px solid rgba(0,245,255,0.2)',
          boxShadow: '0 0 40px rgba(0,245,255,0.08), 0 16px 48px rgba(0,0,0,0.7)',
          maxHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: '1px solid rgba(0,245,255,0.12)' }}
        >
          <div>
            <p className="font-mono text-[9px] tracking-[0.22em] uppercase opacity-50 mb-0.5"
              style={{ color: 'var(--rf-cyan)' }}>
              archive
            </p>
            <p className="font-mono text-[0.75rem]" style={{ color: 'var(--rf-text-dim)' }}>
              {archived.length} item{archived.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            type="button"
            className="rf-btn"
            onClick={onClose}
          >
            [ close ]
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 px-3 py-2">
          {archived.length === 0 ? (
            <p className="font-mono text-[0.75rem] text-center py-8 opacity-30"
              style={{ color: 'var(--rf-text-dim)' }}>
              no archived items
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {archived.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-[2px] group"
                  style={{ border: '1px solid rgba(0,245,255,0.06)', background: 'rgba(0,245,255,0.02)' }}
                >
                  {/* Color dot */}
                  <span
                    className="w-[6px] h-[6px] rounded-full flex-shrink-0"
                    style={{ background: `var(--rf-${todo.color === 'cyan' ? 'cyan' : todo.color === 'pink' ? 'pink' : todo.color === 'amber' ? 'amber' : todo.color === 'green' ? 'green' : 'purple'})`, opacity: 0.6 }}
                  />

                  {/* Title */}
                  <span className="flex-1 font-mono text-[0.75rem] truncate opacity-60"
                    style={{ color: 'var(--rf-text)', textDecoration: 'line-through' }}>
                    {todo.title}
                  </span>

                  {/* Date */}
                  <span className="font-mono text-[8px] opacity-30 flex-shrink-0"
                    style={{ color: 'var(--rf-text-dim)' }}>
                    {new Date(todo.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => unarchiveTodo(todo.id)}
                      className="rf-btn"
                      style={{ padding: '2px 6px', fontSize: '0.65rem' }}
                      title="Restore to canvas"
                    >
                      restore
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteTodo(todo.id)}
                      className="font-mono text-[10px]"
                      style={{ color: '#ff3030', cursor: 'pointer', opacity: 0.7 }}
                      title="Delete permanently"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(panel, document.body)
}
