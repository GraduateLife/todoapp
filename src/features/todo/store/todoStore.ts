import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Todo, Attachment, NoteColor, Priority, Reminder } from '../types'
import { NOTE_COLORS } from '../types'

const TITLE_MAX_LEN = 100 // sync with TodoInput.TITLE_MAX_LEN

// Keep original key so existing user data is preserved via migration
const STORAGE_KEY = 'todoai-storage'

interface TodoState {
  todos: Todo[]
  addTodo: (
    title: string,
    attachments?: Attachment[],
    color?: NoteColor,
  ) => void
  addTodoWithDetails: (
    title: string,
    subtasks: { title: string; completed: boolean }[],
    priority: Priority,
    attachments?: Attachment[],
    color?: NoteColor,
  ) => void
  deleteTodo: (id: string) => void
  toggleTodo: (id: string) => void
  updateTitle: (id: string, title: string) => void
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
  // Archive
  archiveTodo: (id: string) => void
  unarchiveTodo: (id: string) => void
  // Stack
  stackOnto: (rootId: string, childId: string) => void
  unstackTodo: (rootId: string, childId: string) => void
  disbandStack: (rootId: string) => void
  reorderStack: (rootId: string, fromIdx: number, toIdx: number) => void
}

function randomPosition(): { x: number; y: number } {
  if (typeof window === 'undefined') return { x: 120, y: 120 }
  const maxX = Math.max(window.innerWidth - 320, 200)
  const maxY = Math.max(window.innerHeight - 340, 200)
  return {
    x: Math.floor(Math.random() * maxX + 40),
    y: Math.floor(Math.random() * maxY + 80),
  }
}

function randomColor(): NoteColor {
  return NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)]
}

function randomRotation(): number {
  return parseFloat(((Math.random() - 0.5) * 10).toFixed(2))
}

function createTodo(
  title: string,
  attachments: Attachment[] = [],
  color?: NoteColor,
): Todo {
  return {
    id: crypto.randomUUID(),
    title: title.slice(0, TITLE_MAX_LEN),
    completed: false,
    createdAt: Date.now(),
    attachments,
    position: randomPosition(),
    zIndex: 10,
    color: color ?? randomColor(),
    rotation: randomRotation(),
    priority: 'normal',
    subtasks: [],
    folderId: null,
    reminder: null,
    archived: false,
    stackedIds: [],
  }
}

export const useTodoStore = create<TodoState>()(
  persist(
    (set) => ({
      todos: [],

      addTodo: (title, attachments = [], color) =>
        set((state) => {
          const maxZ = state.todos.reduce((m, t) => Math.max(m, t.zIndex), 10)
          const next = createTodo(title, attachments, color)
          return { todos: [...state.todos, { ...next, zIndex: maxZ + 1 }] }
        }),

      addTodoWithDetails: (
        title,
        subtasks,
        priority,
        attachments = [],
        color,
      ) =>
        set((state) => {
          const maxZ = state.todos.reduce((m, t) => Math.max(m, t.zIndex), 10)
          const next = createTodo(title, attachments, color)
          return {
            todos: [
              ...state.todos,
              {
                ...next,
                zIndex: maxZ + 1,
                priority,
                subtasks: subtasks.map((s) => ({
                  id: crypto.randomUUID(),
                  title: s.title,
                  completed: s.completed,
                })),
              },
            ],
          }
        }),

      deleteTodo: (id) =>
        set((state) => ({ todos: state.todos.filter((t) => t.id !== id) })),

      toggleTodo: (id) =>
        set((state) => ({
          todos: state.todos.map((t) => {
            if (t.id !== id) return t
            const completing = !t.completed
            return {
              ...t,
              completed: completing,
              // Unchecking a todo resets all subtasks to incomplete
              subtasks: completing
                ? t.subtasks
                : t.subtasks.map((s) => ({ ...s, completed: false })),
            }
          }),
        })),

      updateTitle: (id, title) =>
        set((state) => ({
          todos: state.todos.map((t) => (t.id === id ? { ...t, title } : t)),
        })),

      moveTodo: (id, x, y) =>
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === id ? { ...t, position: { x, y } } : t,
          ),
        })),

      bringToFront: (id) =>
        set((state) => {
          const maxZ = state.todos.reduce((m, t) => Math.max(m, t.zIndex), 10)
          return {
            todos: state.todos.map((t) =>
              t.id === id ? { ...t, zIndex: maxZ + 1 } : t,
            ),
          }
        }),

      addAttachment: (todoId, attachment) =>
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === todoId
              ? { ...t, attachments: [...t.attachments, attachment] }
              : t,
          ),
        })),

      removeAttachment: (todoId, attachmentId) =>
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === todoId
              ? {
                  ...t,
                  attachments: t.attachments.filter(
                    (a) => a.id !== attachmentId,
                  ),
                }
              : t,
          ),
        })),

      setPriority: (id, priority) =>
        set((state) => ({
          todos: state.todos.map((t) => (t.id === id ? { ...t, priority } : t)),
        })),

      addSubTask: (todoId, title) =>
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === todoId
              ? {
                  ...t,
                  // Adding a subtask always reverts the todo to incomplete
                  completed: false,
                  subtasks: [
                    ...t.subtasks,
                    { id: crypto.randomUUID(), title, completed: false },
                  ],
                }
              : t,
          ),
        })),

      toggleSubTask: (todoId, subtaskId) =>
        set((state) => ({
          todos: state.todos.map((t) => {
            if (t.id !== todoId) return t
            const updatedSubtasks = t.subtasks.map((s) =>
              s.id === subtaskId ? { ...s, completed: !s.completed } : s,
            )
            const allDone =
              updatedSubtasks.length > 0 &&
              updatedSubtasks.every((s) => s.completed)
            return { ...t, subtasks: updatedSubtasks, completed: allDone }
          }),
        })),

      deleteSubTask: (todoId, subtaskId) =>
        set((state) => ({
          todos: state.todos.map((t) => {
            if (t.id !== todoId) return t
            const updatedSubtasks = t.subtasks.filter((s) => s.id !== subtaskId)
            const allDone =
              updatedSubtasks.length > 0 &&
              updatedSubtasks.every((s) => s.completed)
            return { ...t, subtasks: updatedSubtasks, completed: allDone }
          }),
        })),

      updateSubTask: (todoId, subtaskId, title) =>
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
        })),

      setFolder: (id, folderId) =>
        set((state) => ({
          todos: state.todos.map((t) => (t.id === id ? { ...t, folderId } : t)),
        })),

      setReminder: (id, reminder) =>
        set((state) => ({
          todos: state.todos.map((t) => (t.id === id ? { ...t, reminder } : t)),
        })),

      archiveTodo: (id) =>
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === id ? { ...t, archived: true, folderId: null } : t,
          ),
        })),

      unarchiveTodo: (id) =>
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === id ? { ...t, archived: false } : t,
          ),
        })),

      // ── Stack actions ────────────────────────────────────────────────────
      stackOnto: (rootId, childId) =>
        set((state) => {
          const root = state.todos.find((t) => t.id === rootId)
          const child = state.todos.find((t) => t.id === childId)
          if (!root || !child) return state
          // Absorb child's own stacked notes into root's stack
          const childOwnStack = child.stackedIds ?? []
          const allChildIds = [childId, ...childOwnStack]
          // Enforce max 5 stacked (6 total including root)
          const currentCount = root.stackedIds?.length ?? 0
          if (currentCount + allChildIds.length > 5) return state
          return {
            todos: state.todos.map((t) => {
              if (t.id === rootId)
                return {
                  ...t,
                  stackedIds: [...(t.stackedIds ?? []), ...allChildIds],
                }
              if (t.id === childId) return { ...t, stackedIds: [] } // no longer a root
              return t
            }),
          }
        }),

      unstackTodo: (rootId, childId) =>
        set((state) => {
          const root = state.todos.find((t) => t.id === rootId)
          if (!root) return state
          // Scatter child near root position
          const newPos = { x: root.position.x + 50, y: root.position.y - 20 }
          return {
            todos: state.todos.map((t) => {
              if (t.id === rootId)
                return {
                  ...t,
                  stackedIds: (t.stackedIds ?? []).filter(
                    (id) => id !== childId,
                  ),
                }
              if (t.id === childId) return { ...t, position: newPos }
              return t
            }),
          }
        }),

      reorderStack: (rootId, fromIdx, toIdx) =>
        set((state) => {
          const root = state.todos.find((t) => t.id === rootId)
          if (!root) return state
          const ids = [...(root.stackedIds ?? [])]
          if (
            fromIdx < 0 ||
            fromIdx >= ids.length ||
            toIdx < 0 ||
            toIdx >= ids.length
          )
            return state
          const [moved] = ids.splice(fromIdx, 1)
          ids.splice(toIdx, 0, moved)
          return {
            todos: state.todos.map((t) =>
              t.id === rootId ? { ...t, stackedIds: ids } : t,
            ),
          }
        }),

      disbandStack: (rootId) =>
        set((state) => {
          const root = state.todos.find((t) => t.id === rootId)
          if (!root) return state
          const stackedIds = root.stackedIds ?? []
          return {
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
          }
        }),
    }),
    {
      name: STORAGE_KEY,
      version: 4,
      migrate: (persistedState: any, version: number) => {
        let state = persistedState
        if (version < 2) {
          state = {
            todos: (state?.todos ?? []).map((t: any) => ({
              ...t,
              position: t.position ?? {
                x: Math.floor(Math.random() * 600 + 80),
                y: Math.floor(Math.random() * 300 + 100),
              },
              zIndex: t.zIndex ?? 10,
              color:
                t.color ??
                NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
              rotation:
                t.rotation ??
                parseFloat(((Math.random() - 0.5) * 10).toFixed(2)),
              attachments: t.attachments ?? [],
            })),
          }
        }
        if (version < 3) {
          state = {
            todos: (state?.todos ?? []).map((t: any) => ({
              ...t,
              priority: t.priority ?? 'normal',
              subtasks: t.subtasks ?? [],
              folderId: t.folderId ?? null,
              reminder: t.reminder ?? null,
              archived: t.archived ?? false,
            })),
          }
        }
        if (version < 4) {
          state = {
            todos: (state?.todos ?? []).map((t: any) => ({
              ...t,
              stackedIds: t.stackedIds ?? [],
            })),
          }
        }
        return state
      },
    },
  ),
)
