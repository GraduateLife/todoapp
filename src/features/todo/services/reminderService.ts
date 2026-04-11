/**
 * Reminder Service — abstraction layer for notifications.
 *
 * Current implementation: Browser Notification API.
 * To swap in a third-party service (e.g. push notifications, email),
 * implement INotificationService and call setNotificationService().
 */

export interface INotificationService {
  /** Request permission to send notifications. Returns true if granted. */
  requestPermission(): Promise<boolean>
  /** Fire a notification immediately. */
  notify(title: string, body?: string): void
}

// ─── Browser Notification implementation ─────────────────────────────────────

class BrowserNotificationService implements INotificationService {
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false
    if (Notification.permission === 'granted') return true
    if (Notification.permission === 'denied') return false
    const result = await Notification.requestPermission()
    return result === 'granted'
  }

  notify(title: string, body?: string): void {
    if (!('Notification' in window) || Notification.permission !== 'granted')
      return
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
    })
  }
}

// ─── Singleton + swap mechanism ───────────────────────────────────────────────

let activeService: INotificationService = new BrowserNotificationService()

/** Replace the notification backend (e.g. for testing or third-party integration). */
export function setNotificationService(service: INotificationService): void {
  activeService = service
}

export function getNotificationService(): INotificationService {
  return activeService
}

// ─── Reminder scheduler (trigger-array model) ────────────────────────────────

export interface ScheduledReminder {
  todoId: string
  title: string
  nextTrigger: number // the specific timestamp this timer is set for
}

type ReminderCallback = (todoId: string) => void

class ReminderScheduler {
  private timers = new Map<string, ReturnType<typeof setTimeout>>()
  private onFire: ReminderCallback | null = null

  setOnFire(cb: ReminderCallback) {
    this.onFire = cb
  }

  /** Schedule a timer for a single trigger timestamp. */
  schedule(reminder: ScheduledReminder): void {
    this.cancel(reminder.todoId)
    const delay = Math.max(0, reminder.nextTrigger - Date.now())
    const timer = setTimeout(() => {
      getNotificationService().notify(
        `⏰ ${reminder.title}`,
        'Reminder from your todo list',
      )
      this.timers.delete(reminder.todoId)
      this.onFire?.(reminder.todoId)
    }, delay)
    this.timers.set(reminder.todoId, timer)
  }

  cancel(todoId: string): void {
    const t = this.timers.get(todoId)
    if (t !== undefined) {
      clearTimeout(t)
      this.timers.delete(todoId)
    }
  }

  cancelAll(): void {
    this.timers.forEach((t) => clearTimeout(t))
    this.timers.clear()
  }

  isScheduled(todoId: string): boolean {
    return this.timers.has(todoId)
  }
}

export const reminderScheduler = new ReminderScheduler()
