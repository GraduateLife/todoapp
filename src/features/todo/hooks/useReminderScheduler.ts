import { useEffect, useState, useCallback } from 'react'
import { useTodoStore } from '../store'
import {
  reminderScheduler,
  getNotificationService,
} from '../services/reminderService'

export interface ReminderToast {
  todoId: string
  title: string
}

/**
 * Mount this hook once (in StickyNoteCanvas or the route root).
 * It boots up all persisted reminders on page load and
 * reacts to reminder changes in the store.
 * Returns an in-app toast for when browser notifications aren't available.
 */
export function useReminderScheduler() {
  const todos = useTodoStore((s) => s.todos)
  const setReminder = useTodoStore((s) => s.setReminder)

  const [activeToast, setActiveToast] = useState<ReminderToast | null>(null)
  const clearToast = useCallback(() => setActiveToast(null), [])

  // When a reminder fires, mark firedAt and advance triggers
  useEffect(() => {
    reminderScheduler.setOnFire((todoId) => {
      const todo = useTodoStore.getState().todos.find((t) => t.id === todoId)
      if (!todo?.reminder) return

      // Show in-app toast
      setActiveToast({ todoId, title: todo.title })

      const r = todo.reminder
      const remaining = r.triggers.slice(1) // pop the fired trigger
      const firedAt = Date.now()

      if (remaining.length > 0) {
        // More triggers queued — advance, mark as fired
        setReminder(todoId, { ...r, triggers: remaining, firedAt })
      } else if (r.source === 'recurring' && r.interval) {
        // Recurring with no more triggers — generate next if before deadline
        const next = Date.now() + r.interval
        if (!r.deadline || next <= r.deadline) {
          setReminder(todoId, { ...r, triggers: [next], firedAt })
        } else {
          // Past deadline — keep reminder with firedAt so overdue state persists
          setReminder(todoId, { ...r, triggers: [], firedAt })
        }
      } else {
        // One-shot or AI with no more triggers — keep reminder with firedAt
        setReminder(todoId, { ...r, triggers: [], firedAt })
      }
    })
  }, [setReminder])

  // Sync scheduled timers with todos that have reminders
  useEffect(() => {
    const todosWithReminders = todos.filter(
      (t) => t.reminder && t.reminder.triggers.length > 0 && !t.archived,
    )
    const scheduledIds = new Set(todosWithReminders.map((t) => t.id))

    todosWithReminders.forEach((t) => {
      if (!t.reminder) return
      const nextTrigger = t.reminder.triggers[0]
      // Only reschedule if not already running
      if (!reminderScheduler.isScheduled(t.id)) {
        reminderScheduler.schedule({
          todoId: t.id,
          title: t.title,
          nextTrigger,
        })
      }
    })

    // Cancel timers for todos that no longer have reminders
    todos
      .filter((t) => !t.reminder || t.reminder.triggers.length === 0 || t.archived)
      .forEach((t) => reminderScheduler.cancel(t.id))

    return () => {
      todos
        .filter((t) => !scheduledIds.has(t.id))
        .forEach((t) => reminderScheduler.cancel(t.id))
    }
  }, [todos])

  // Request notification permission on mount
  useEffect(() => {
    getNotificationService().requestPermission()
  }, [])

  return { activeToast, clearToast }
}
