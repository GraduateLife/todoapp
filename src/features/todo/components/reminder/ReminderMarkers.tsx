import { useState, useEffect } from 'react'
import { useTodoStore } from '../../store'

function useNow(intervalMs = 10000) {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'now'
  const totalSec = Math.floor(ms / 1000)
  const d = Math.floor(totalSec / 86400)
  const h = Math.floor((totalSec % 86400) / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function ReminderMarkers() {
  const todos = useTodoStore((s) => s.todos)
  const setReminder = useTodoStore((s) => s.setReminder)
  const now = useNow()

  const scheduled = todos.filter((t) => t.reminder && !t.archived)
  if (scheduled.length === 0) return null

  return (
    <div
      className="fixed right-0 top-1/2 -translate-y-1/2 flex flex-col gap-1 pointer-events-none"
      style={{ zIndex: 200 }}
    >
      {scheduled.map((todo) => {
        const reminder = todo.reminder!
        const remaining = reminder.remindAt - now
        const isOverdue = remaining <= 0

        return (
          <div
            key={todo.id}
            className="pointer-events-auto flex items-center group"
            style={{ cursor: 'default' }}
          >
            {/* Expanded label — visible on hover */}
            <div
              className="overflow-hidden transition-all duration-200 opacity-0 group-hover:opacity-100"
              style={{ maxWidth: 0, transition: 'max-width 200ms ease, opacity 200ms ease' }}
            >
              <div
                className="mr-1 px-2 py-1 rounded-[2px] font-mono text-[9px] tracking-[0.1em] whitespace-nowrap"
                style={{
                  background: '#080c18',
                  border: '1px solid rgba(0,245,255,0.2)',
                  color: 'var(--rf-text)',
                  maxWidth: 200,
                }}
              >
                <span className="opacity-70 truncate block" style={{ maxWidth: 140 }}>{todo.title}</span>
                {reminder.interval && (
                  <span className="opacity-40 text-[8px]"> ↻</span>
                )}
              </div>
            </div>

            {/* Right-edge pill */}
            <div
              className="flex items-center gap-1 px-1.5 py-1 rounded-l-[3px]"
              style={{
                background: isOverdue ? 'rgba(255,48,48,0.15)' : 'rgba(0,245,255,0.06)',
                border: `1px solid ${isOverdue ? 'rgba(255,48,48,0.4)' : 'rgba(0,245,255,0.25)'}`,
                borderRight: 'none',
              }}
            >
              {/* Dot */}
              <span
                className={`w-[5px] h-[5px] rounded-full block flex-shrink-0 ${isOverdue ? 'animate-pulse' : ''}`}
                style={{
                  background: isOverdue ? '#ff3030' : 'var(--rf-cyan)',
                  boxShadow: isOverdue
                    ? '0 0 4px #ff3030'
                    : '0 0 4px rgba(0,245,255,0.6)',
                }}
              />
              {/* Countdown */}
              <span
                className="font-mono text-[8px] tracking-[0.08em]"
                style={{ color: isOverdue ? '#ff6060' : 'var(--rf-cyan)', opacity: 0.85 }}
              >
                {isOverdue ? 'DUE' : formatCountdown(remaining)}
              </span>
              {/* Recurring indicator */}
              {reminder.interval && (
                <span className="font-mono text-[7px] opacity-40" style={{ color: 'var(--rf-cyan)' }}>↻</span>
              )}
              {/* Cancel button */}
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setReminder(todo.id, null)}
                className="font-mono text-[8px] opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity ml-0.5"
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
