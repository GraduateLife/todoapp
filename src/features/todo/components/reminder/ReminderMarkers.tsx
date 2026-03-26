import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTodoStore } from '../../store'

// Update every second so the countdown shows live seconds
function useNow() {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'now'
  const totalSec = Math.ceil(ms / 1000)
  const d = Math.floor(totalSec / 86400)
  const h = Math.floor((totalSec % 86400) / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function truncateTitle(title: string, max = 16): string {
  return title.length > max ? title.slice(0, max).trimEnd() + '…' : title
}

interface ReminderMarkersProps {
  onEditReminder: (todoId: string) => void
}

export function ReminderMarkers({ onEditReminder }: ReminderMarkersProps) {
  const todos = useTodoStore((s) => s.todos)
  const setReminder = useTodoStore((s) => s.setReminder)
  const now = useNow()

  const [menuPos, setMenuPos] = useState<{
    x: number
    y: number
    todoId: string
  } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close context menu on outside click or Escape
  useEffect(() => {
    if (!menuPos) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuPos(null)
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

  const scheduled = todos.filter((t) => t.reminder && !t.archived)
  if (scheduled.length === 0) return null

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
            onEditReminder(menuPos.todoId)
            setMenuPos(null)
          }}
        >
          [ edit reminder ]
        </button>
        <div className="rf-context-separator" />
        <button
          type="button"
          className="rf-context-item rf-context-item--delete"
          role="menuitem"
          onClick={() => {
            setReminder(menuPos.todoId, null)
            setMenuPos(null)
          }}
        >
          [ cancel ]
        </button>
      </div>,
      document.body,
    )

  return (
    <>
      <div
        className="fixed right-0 top-1/3 -translate-y-1/2 flex flex-col gap-1.5 pointer-events-none"
        style={{ zIndex: 200 }}
      >
        {scheduled.map((todo) => {
          const reminder = todo.reminder!
          const remaining = reminder.remindAt - now
          const isOverdue = remaining <= 0
          const color = isOverdue ? '#ff6060' : 'var(--rf-cyan)'
          const borderC = isOverdue
            ? 'rgba(255,48,48,0.4)'
            : 'rgba(0,245,255,0.25)'
          const bg = isOverdue ? 'rgba(255,48,48,0.12)' : 'rgba(0,245,255,0.05)'

          const ringColor = isOverdue ? '#ff6060' : '#00f5ff'

          return (
            <div
              key={todo.id}
              className="pointer-events-auto flex items-center justify-end"
              onContextMenu={(e) => {
                e.preventDefault()
                e.stopPropagation()
                const menuW = 160,
                  menuH = 72
                setMenuPos({
                  x: Math.min(e.clientX, window.innerWidth - menuW - 8),
                  y: Math.min(e.clientY, window.innerHeight - menuH - 8),
                  todoId: todo.id,
                })
              }}
            >
              {/* Flowing ring wrapper */}
              <div style={{ position: 'relative' }}>
                {/* Ring: container clips the spinning gradient */}
                <div
                  style={{
                    position: 'absolute',
                    top: -8,
                    left: -8,
                    right: -8,
                    bottom: -8,
                    borderRadius: 8,
                    overflow: 'hidden',
                    zIndex: 0,
                    pointerEvents: 'none',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      width: '200%',
                      height: '200%',
                      top: '-50%',
                      left: '-50%',
                      background: `conic-gradient(from 0deg, transparent 0%, transparent 55%, ${ringColor}44 65%, ${ringColor}cc 73%, ${ringColor} 78%, ${ringColor}cc 83%, ${ringColor}44 91%, transparent 100%)`,
                      animation: 'rf-reminder-spin 3s linear infinite',
                    }}
                  />
                  {/* Inner mask — punch out pill area, leave 3px ring */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 3,
                      left: 3,
                      right: 3,
                      bottom: 3,
                      borderRadius: 5,
                      background: '#04060c',
                    }}
                  />
                </div>

                {/* Pill */}
                <div
                  className="flex items-center gap-1.5 pl-2.5 pr-2 py-1.5 rounded-l-[3px] cursor-context-menu"
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    background: bg,
                    borderTop: `1px solid ${borderC}`,
                    borderBottom: `1px solid ${borderC}`,
                    borderLeft: `1px solid ${borderC}`,
                    borderRight: 'none',
                  }}
                >
                  {/* Two-line label */}
                  <div
                    className="font-mono tracking-[0.18em] uppercase"
                    style={{
                      color,
                      textShadow: `0 0 10px ${color}`,
                      maxWidth: 140,
                      lineHeight: 1.6,
                    }}
                  >
                    {/* Line 1: title (larger) */}
                    <div
                      className="font-bold whitespace-nowrap overflow-hidden text-ellipsis"
                      style={{ fontSize: 11, fontWeight: 700 }}
                    >
                      {truncateTitle(todo.title, 18)}
                      {reminder.interval && (
                        <span className="opacity-40 ml-1 font-normal">↻</span>
                      )}
                    </div>
                    {/* Line 2: countdown (smaller) */}
                    <div
                      className="text-[8px]"
                      style={{ opacity: isOverdue ? 1 : 0.65 }}
                    >
                      {isOverdue
                        ? 'overdue!'
                        : `in: ${formatCountdown(remaining)}`}
                    </div>
                  </div>

                  {/* Dot — right side */}
                  <span
                    className={`w-[6px] h-[6px] rounded-full block flex-shrink-0 ${isOverdue ? 'animate-pulse' : ''}`}
                    style={{ background: color, boxShadow: `0 0 5px ${color}` }}
                  />
                </div>
              </div>
              {/* end flowing ring wrapper */}
            </div>
          )
        })}
      </div>

      {contextMenu}
    </>
  )
}
