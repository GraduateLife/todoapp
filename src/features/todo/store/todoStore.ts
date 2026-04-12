import { create } from 'zustand'
import type { Todo, Attachment, Priority, Reminder } from '../types'
import { priorityToColor } from '../constants/priority'
import { getStrategy as getAdapter } from '../../../lib/strategies'

import { TITLE_MAX_LEN, MAX_STACK_SIZE } from '../../../lib/limits'

// ── Debounce helper for high-frequency saves (drag) ──────────────────────────

const _debounceTimers = new Map<string, ReturnType<typeof setTimeout>>()
function debouncedSave(key: string, fn: () => void, ms = 300) {
  const t = _debounceTimers.get(key)
  if (t) clearTimeout(t)
  _debounceTimers.set(
    key,
    setTimeout(() => {
      _debounceTimers.delete(key)
      fn()
    }, ms),
  )
}

interface TodoState {
  todos: Todo[]
  initialize: (todos: Todo[]) => void
  addTodo: (
    title: string,
    options?: {
      attachments?: Attachment[]
      priority?: Priority
      position?: { x: number; y: number }
    },
  ) => void
  addTodoWithDetails: (
    title: string,
    subtasks: { title: string; completed: boolean }[],
    priority: Priority,
    attachments?: Attachment[],
  ) => void
  deleteTodo: (id: string) => void
  toggleTodo: (id: string) => void
  updateTitle: (id: string, title: string) => void
  updateDescription: (id: string, description: string) => void
  moveTodo: (id: string, x: number, y: number) => void
  bringToFront: (id: string) => void
  addAttachment: (todoId: string, attachment: Attachment) => void
  removeAttachment: (todoId: string, attachmentId: string) => void
  // Priority
  setPriority: (id: string, priority: Priority) => void
  // Sub-tasks
  addSubTask: (todoId: string, title: string) => void
  toggleSubTask: (todoId: string, subtaskId: string) => void
  deleteSubTask: (todoId: string, subtaskId: string) => void
  updateSubTask: (todoId: string, subtaskId: string, title: string) => void
  // Folder
  setFolder: (id: string, folderId: string | null) => void
  // Reminder
  setReminder: (id: string, reminder: Reminder | null) => void
  dismissReminder: (id: string) => void
  // Archive
  archiveTodo: (id: string) => void
  unarchiveTodo: (id: string) => void
  // Stack
  stackOnto: (rootId: string, childId: string) => void
  unstackTodo: (rootId: string, childId: string) => void
  disbandStack: (rootId: string) => void
  reorderStack: (rootId: string, fromIdx: number, toIdx: number) => void
  renameStack: (rootId: string, name: string) => void
}

const CARD_WIDTH = 256
const CARD_HEIGHT = 160

function randomPosition(): { x: number; y: number } {
  if (typeof window === 'undefined') return { x: 10, y: 10 }
  // Place cards near the center of the board with some scatter
  const cx = window.innerWidth / 2 - CARD_WIDTH / 2 // center minus half card width
  const cy = window.innerHeight / 2 - CARD_HEIGHT / 2 // center minus half card height
  const spread = 25 // scatter radius
  return {
    x: Math.floor(cx + (Math.random() - 0.5) * spread * 2),
    y: Math.floor(cy + (Math.random() - 0.5) * spread * 2),
  }
}

const STACK_PREFIXES = [
  'alpha',
  'beta',
  'delta',
  'echo',
  'nova',
  'omega',
  'sigma',
  'theta',
  'zeta',
  'proto',
  'meta',
  'hyper',
]
const STACK_SUFFIXES = [
  'arc',
  'bit',
  'core',
  'flux',
  'grid',
  'hex',
  'kit',
  'link',
  'net',
  'pod',
  'set',
  'tag',
]
function randomStackName(): string {
  const p = STACK_PREFIXES[Math.floor(Math.random() * STACK_PREFIXES.length)]
  const s = STACK_SUFFIXES[Math.floor(Math.random() * STACK_SUFFIXES.length)]
  return `${p}-${s}`
}

function randomRotation(): number {
  return parseFloat(((Math.random() - 0.5) * 10).toFixed(2))
}

/**
 * Internal factory: create a new Todo.
 *
 * Priority is the single source of truth for color. Callers do NOT pass color —
 * it is derived from priority via `priorityToColor`. This guarantees card color
 * and priority can never drift out of sync, and keeps cyan (the system-reserved
 * color) unreachable from any user-facing creation path unless the caller
 * explicitly passes `priority: 'system'`.
 */
function createTodo(
  title: string,
  attachments: Attachment[] = [],
  priority: Priority = 'normal',
): Todo {
  return {
    id: crypto.randomUUID(),
    title: title.slice(0, TITLE_MAX_LEN),
    completed: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    attachments,
    position: randomPosition(),
    zIndex: 10,
    color: priorityToColor(priority),
    rotation: randomRotation(),
    priority,
    subtasks: [],
    folderId: null,
    reminder: null,
    archived: false,
    stackedIds: [],
  }
}

export const useTodoStore = create<TodoState>()((set, get) => ({
  todos: [],

  initialize: (todos) => {
    // Migrate: add updatedAt if missing, and convert legacy reminder format
    const migrated = todos.map((t) => {
      // Ensure updatedAt exists (backfill from createdAt)
      const withUpdatedAt = t.updatedAt ? t : { ...t, updatedAt: t.createdAt }
      if (!withUpdatedAt.reminder) return withUpdatedAt
      const r = withUpdatedAt.reminder as unknown as Record<string, unknown>
      // Already new format — has `triggers` array
      if (Array.isArray(r.triggers)) return withUpdatedAt
      // Legacy format: { remindAt: number, interval?: number }
      if (typeof r.remindAt === 'number') {
        const remindAt = r.remindAt
        const interval = typeof r.interval === 'number' ? r.interval : undefined
        return {
          ...withUpdatedAt,
          reminder: {
            source: interval ? 'recurring' as const : 'manual' as const,
            triggers: [remindAt],
            ...(interval ? { interval } : {}),
          },
        }
      }
      return withUpdatedAt
    })
    set({ todos: migrated })
  },

  addTodo: (title, options = {}) => {
    const { attachments = [], priority = 'normal', position } = options
    const maxZ = get().todos.reduce((m, t) => Math.max(m, t.zIndex), 10)
    const todo = {
      ...createTodo(title, attachments, priority),
      zIndex: maxZ + 1,
      ...(position ? { position } : {}),
    }
    set((state) => ({ todos: [...state.todos, todo] }))
    getAdapter().saveTodo(todo).catch(console.error)
  },

  addTodoWithDetails: (title, subtasks, priority, attachments = []) => {
    const maxZ = get().todos.reduce((m, t) => Math.max(m, t.zIndex), 10)
    const todo = {
      ...createTodo(title, attachments, priority),
      zIndex: maxZ + 1,
      subtasks: subtasks.map((s) => ({
        id: crypto.randomUUID(),
        title: s.title,
        completed: s.completed,
      })),
    }
    set((state) => ({ todos: [...state.todos, todo] }))
    getAdapter().saveTodo(todo).catch(console.error)
  },

  deleteTodo: (id) => {
    set((state) => ({ todos: state.todos.filter((t) => t.id !== id) }))
    getAdapter().deleteTodo(id).catch(console.error)
  },

  toggleTodo: (id) => {
    set((state) => ({
      todos: state.todos.map((t) => {
        if (t.id !== id) return t
        const completing = !t.completed
        return {
          ...t,
          completed: completing,
          updatedAt: Date.now(),
          subtasks: completing
            ? t.subtasks
            : t.subtasks.map((s) => ({ ...s, completed: false })),
        }
      }),
    }))
    const updated = get().todos.find((t) => t.id === id)
    if (updated) getAdapter().saveTodo(updated).catch(console.error)
  },

  updateTitle: (id, title) => {
    set((state) => ({
      todos: state.todos.map((t) => (t.id === id ? { ...t, title, updatedAt: Date.now() } : t)),
    }))
    const updated = get().todos.find((t) => t.id === id)
    if (updated) getAdapter().saveTodo(updated).catch(console.error)
  },

  updateDescription: (id, description) => {
    set((state) => ({
      todos: state.todos.map((t) => (t.id === id ? { ...t, description, updatedAt: Date.now() } : t)),
    }))
    const updated = get().todos.find((t) => t.id === id)
    if (updated) getAdapter().saveTodo(updated).catch(console.error)
  },

  moveTodo: (id, x, y) => {
    set((state) => ({
      todos: state.todos.map((t) =>
        t.id === id ? { ...t, position: { x, y } } : t,
      ),
    }))
    const updated = get().todos.find((t) => t.id === id)
    if (updated)
      debouncedSave(`move-${id}`, () =>
        getAdapter().saveTodo(updated).catch(console.error),
      )
  },

  bringToFront: (id) => {
    set((state) => {
      const maxZ = state.todos.reduce((m, t) => Math.max(m, t.zIndex), 10)
      return {
        todos: state.todos.map((t) =>
          t.id === id ? { ...t, zIndex: maxZ + 1 } : t,
        ),
      }
    })
    const updated = get().todos.find((t) => t.id === id)
    if (updated) getAdapter().saveTodo(updated).catch(console.error)
  },

  addAttachment: (todoId, attachment) => {
    set((state) => ({
      todos: state.todos.map((t) =>
        t.id === todoId
          ? { ...t, attachments: [...t.attachments, attachment] }
          : t,
      ),
    }))
    const updated = get().todos.find((t) => t.id === todoId)
    if (updated) getAdapter().saveTodo(updated).catch(console.error)
  },

  removeAttachment: (todoId, attachmentId) => {
    set((state) => ({
      todos: state.todos.map((t) =>
        t.id === todoId
          ? {
              ...t,
              attachments: t.attachments.filter((a) => a.id !== attachmentId),
            }
          : t,
      ),
    }))
    const updated = get().todos.find((t) => t.id === todoId)
    if (updated) getAdapter().saveTodo(updated).catch(console.error)
  },

  setPriority: (id, priority) => {
    // Priority is the single source of truth for color: any priority change
    // must re-derive the color so cards cannot drift out of sync.
    const color = priorityToColor(priority)
    set((state) => ({
      todos: state.todos.map((t) =>
        t.id === id ? { ...t, priority, color, updatedAt: Date.now() } : t,
      ),
    }))
    const updated = get().todos.find((t) => t.id === id)
    if (updated) getAdapter().saveTodo(updated).catch(console.error)
  },

  addSubTask: (todoId, title) => {
    set((state) => ({
      todos: state.todos.map((t) =>
        t.id === todoId
          ? {
              ...t,
              completed: false,
              updatedAt: Date.now(),
              subtasks: [
                ...t.subtasks,
                { id: crypto.randomUUID(), title, completed: false },
              ],
            }
          : t,
      ),
    }))
    const updated = get().todos.find((t) => t.id === todoId)
    if (updated) getAdapter().saveTodo(updated).catch(console.error)
  },

  toggleSubTask: (todoId, subtaskId) => {
    set((state) => ({
      todos: state.todos.map((t) => {
        if (t.id !== todoId) return t
        const updatedSubtasks = t.subtasks.map((s) =>
          s.id === subtaskId ? { ...s, completed: !s.completed } : s,
        )
        const allDone =
          updatedSubtasks.length > 0 &&
          updatedSubtasks.every((s) => s.completed)
        return { ...t, subtasks: updatedSubtasks, completed: allDone, updatedAt: Date.now() }
      }),
    }))
    const updated = get().todos.find((t) => t.id === todoId)
    if (updated) getAdapter().saveTodo(updated).catch(console.error)
  },

  deleteSubTask: (todoId, subtaskId) => {
    set((state) => ({
      todos: state.todos.map((t) => {
        if (t.id !== todoId) return t
        const updatedSubtasks = t.subtasks.filter((s) => s.id !== subtaskId)
        const allDone =
          updatedSubtasks.length > 0 &&
          updatedSubtasks.every((s) => s.completed)
        return { ...t, subtasks: updatedSubtasks, completed: allDone, updatedAt: Date.now() }
      }),
    }))
    const updated = get().todos.find((t) => t.id === todoId)
    if (updated) getAdapter().saveTodo(updated).catch(console.error)
  },

  updateSubTask: (todoId, subtaskId, title) => {
    set((state) => ({
      todos: state.todos.map((t) =>
        t.id === todoId
          ? {
              ...t,
              subtasks: t.subtasks.map((s) =>
                s.id === subtaskId ? { ...s, title } : s,
              ),
            }
          : t,
      ),
    }))
    const updated = get().todos.find((t) => t.id === todoId)
    if (updated) getAdapter().saveTodo(updated).catch(console.error)
  },

  setFolder: (id, folderId) => {
    set((state) => ({
      todos: state.todos.map((t) => (t.id === id ? { ...t, folderId } : t)),
    }))
    const updated = get().todos.find((t) => t.id === id)
    if (updated) getAdapter().saveTodo(updated).catch(console.error)
  },

  setReminder: (id, reminder) => {
    set((state) => ({
      todos: state.todos.map((t) => (t.id === id ? { ...t, reminder, updatedAt: Date.now() } : t)),
    }))
    const updated = get().todos.find((t) => t.id === id)
    if (updated) getAdapter().saveTodo(updated).catch(console.error)
  },

  dismissReminder: (id) => {
    const todo = get().todos.find((t) => t.id === id)
    if (!todo?.reminder) return
    const r = todo.reminder
    if (r.triggers.length > 0) {
      // Still has future triggers — just clear firedAt
      set((state) => ({
        todos: state.todos.map((t) =>
          t.id === id ? { ...t, reminder: { ...r, firedAt: undefined }, updatedAt: Date.now() } : t,
        ),
      }))
    } else {
      // No more triggers — fully clear the reminder
      set((state) => ({
        todos: state.todos.map((t) =>
          t.id === id ? { ...t, reminder: null, updatedAt: Date.now() } : t,
        ),
      }))
    }
    const updated = get().todos.find((t) => t.id === id)
    if (updated) getAdapter().saveTodo(updated).catch(console.error)
  },

  archiveTodo: (id) => {
    set((state) => ({
      todos: state.todos.map((t) =>
        t.id === id ? { ...t, archived: true, folderId: null, updatedAt: Date.now() } : t,
      ),
    }))
    const updated = get().todos.find((t) => t.id === id)
    if (updated) getAdapter().saveTodo(updated).catch(console.error)
  },

  unarchiveTodo: (id) => {
    set((state) => ({
      todos: state.todos.map((t) =>
        t.id === id ? { ...t, archived: false, updatedAt: Date.now() } : t,
      ),
    }))
    const updated = get().todos.find((t) => t.id === id)
    if (updated) getAdapter().saveTodo(updated).catch(console.error)
  },

  // ── Stack actions ────────────────────────────────────────────────────
  stackOnto: (rootId, childId) => {
    const { todos } = get()
    const root = todos.find((t) => t.id === rootId)
    const child = todos.find((t) => t.id === childId)
    if (!root || !child) return
    const childOwnStack = child.stackedIds
    const allChildIds = [childId, ...childOwnStack]
    const currentCount = root.stackedIds.length
    if (currentCount + allChildIds.length > MAX_STACK_SIZE) return

    set((state) => ({
      todos: state.todos.map((t) => {
        if (t.id === rootId)
          return {
            ...t,
            stackedIds: [...t.stackedIds, ...allChildIds],
            stackName: t.stackName ?? randomStackName(),
          }
        if (t.id === childId) return { ...t, stackedIds: [] }
        return t
      }),
    }))
    ;[rootId, childId].forEach((id) => {
      const updated = get().todos.find((t) => t.id === id)
      if (updated) getAdapter().saveTodo(updated).catch(console.error)
    })
  },

  unstackTodo: (rootId, childId) => {
    const root = get().todos.find((t) => t.id === rootId)
    if (!root) return
    const newPos = { x: root.position.x + 50, y: root.position.y - 20 }

    set((state) => ({
      todos: state.todos.map((t) => {
        if (t.id === rootId)
          return {
            ...t,
            stackedIds: t.stackedIds.filter((id) => id !== childId),
          }
        if (t.id === childId) return { ...t, position: newPos }
        return t
      }),
    }))
    ;[rootId, childId].forEach((id) => {
      const updated = get().todos.find((t) => t.id === id)
      if (updated) getAdapter().saveTodo(updated).catch(console.error)
    })
  },

  reorderStack: (rootId, fromIdx, toIdx) => {
    const root = get().todos.find((t) => t.id === rootId)
    if (!root) return
    const ids = [...root.stackedIds]
    if (
      fromIdx < 0 ||
      fromIdx >= ids.length ||
      toIdx < 0 ||
      toIdx >= ids.length
    )
      return
    const [moved] = ids.splice(fromIdx, 1)
    ids.splice(toIdx, 0, moved)

    set((state) => ({
      todos: state.todos.map((t) =>
        t.id === rootId ? { ...t, stackedIds: ids } : t,
      ),
    }))
    const updated = get().todos.find((t) => t.id === rootId)
    if (updated) getAdapter().saveTodo(updated).catch(console.error)
  },

  renameStack: (rootId, name) => {
    set((state) => ({
      todos: state.todos.map((t) =>
        t.id === rootId ? { ...t, stackName: name.trim() || t.stackName } : t,
      ),
    }))
    const updated = get().todos.find((t) => t.id === rootId)
    if (updated) getAdapter().saveTodo(updated).catch(console.error)
  },

  disbandStack: (rootId) => {
    const root = get().todos.find((t) => t.id === rootId)
    if (!root) return
    const stackedIds = root.stackedIds
    const affectedIds = [rootId, ...stackedIds]

    set((state) => ({
      todos: state.todos.map((t) => {
        if (t.id === rootId) return { ...t, stackedIds: [] }
        const idx = stackedIds.indexOf(t.id)
        if (idx !== -1) {
          return {
            ...t,
            position: {
              x: root.position.x + (idx + 1) * 30,
              y: root.position.y + (idx + 1) * 30,
            },
          }
        }
        return t
      }),
    }))
    get()
      .todos.filter((t) => affectedIds.includes(t.id))
      .forEach((t) => getAdapter().saveTodo(t).catch(console.error))
  },
}))
