import { useState, useEffect } from 'react'
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

export function ReminderMarkers() {
  const todos = useTodoStore((s) => s.todos)
  const setReminder = useTodoStore((s) => s.setReminder)
  const now = useNow()

  const scheduled = todos.filter((t) => t.reminder && !t.archived)
  if (scheduled.length === 0) return null

  return (
    <div
      className="fixed right-0 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 pointer-events-none"
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

        return (
          <div
            key={todo.id}
            className="pointer-events-auto group flex items-center justify-end"
          >
            {/* Pill */}
            <div
              className="flex items-center gap-1.5 pl-2.5 pr-2 py-1.5 rounded-l-[3px]"
              style={{
                background: bg,
                borderTop: `1px solid ${borderC}`,
                borderBottom: `1px solid ${borderC}`,
                borderLeft: `1px solid ${borderC}`,
                borderRight: 'none',
              }}
            >
              {/* Dot */}
              <span
                className={`w-[6px] h-[6px] rounded-full block flex-shrink-0 ${isOverdue ? 'animate-pulse' : ''}`}
                style={{ background: color, boxShadow: `0 0 5px ${color}` }}
              />

              {/* "title in countdown" */}
              <span
                className="font-mono text-[9px] tracking-[0.08em] whitespace-nowrap"
                style={{ color, opacity: 0.9 }}
              >
                {isOverdue
                  ? truncateTitle(todo.title)
                  : `${truncateTitle(todo.title)} in ${formatCountdown(remaining)}`}
              </span>

              {/* Recurring indicator */}
              {reminder.interval && (
                <span
                  className="font-mono text-[7px] opacity-40"
                  style={{ color }}
                >
                  ↻
                </span>
              )}

              {/* Cancel button — appears on hover */}
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setReminder(todo.id, null)}
                className="font-mono text-[8px] opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
                style={{ color: '#ff3030', cursor: 'pointer', lineHeight: 1 }}
                title="Cancel reminder"
              >
                ✕
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
