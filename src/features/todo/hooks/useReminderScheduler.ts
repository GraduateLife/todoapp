import { useEffect, useState, useCallback } from 'react'
import { useTodoStore } from '../store'
import { reminderScheduler, getNotificationService } from '../services/reminderService'

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

  // When a reminder fires, clear it from the store if it was one-shot
  useEffect(() => {
    reminderScheduler.setOnFire((todoId) => {
      const todo = useTodoStore.getState().todos.find((t) => t.id === todoId)
      if (!todo?.reminder) return

      // Always show in-app toast as fallback (visible even if browser notifications denied)
      setActiveToast({ todoId, title: todo.title })

      if (!todo.reminder.interval) {
        // one-shot — clear the reminder
        setReminder(todoId, null)
      } else {
        // recurring — update next remindAt in store
        setReminder(todoId, {
          ...todo.reminder,
          remindAt: Date.now() + todo.reminder.interval,
        })
      }
    })
  }, [setReminder])

  // Sync scheduled timers with todos that have reminders
  useEffect(() => {
    const todosWithReminders = todos.filter((t) => t.reminder && !t.archived)
    const scheduledIds = new Set(todosWithReminders.map((t) => t.id))

    todosWithReminders.forEach((t) => {
      if (!t.reminder) return
      // Only reschedule if not already running (avoid resetting timer on unrelated store updates)
      if (!reminderScheduler.isScheduled(t.id)) {
        reminderScheduler.schedule({
          todoId: t.id,
          title: t.title,
          remindAt: t.reminder.remindAt,
          interval: t.reminder.interval,
        })
      }
    })

    // Cancel timers for todos that no longer have reminders
    todos
      .filter((t) => !t.reminder || t.archived)
      .forEach((t) => reminderScheduler.cancel(t.id))

    return () => {
      // On unmount, cancel reminders not in current set
      todos
        .filter((t) => !scheduledIds.has(t.id))
        .forEach((t) => reminderScheduler.cancel(t.id))
    }
  }, [todos])

  // Request notification permission on mount (silently — no prompt spam)
  useEffect(() => {
    getNotificationService().requestPermission()
  }, [])

  return { activeToast, clearToast }
}
