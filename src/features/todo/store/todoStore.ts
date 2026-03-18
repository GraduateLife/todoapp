import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Todo, Attachment, NoteColor, Priority, Reminder } from '../types'
import { NOTE_COLORS } from '../types'

// Keep original key so existing user data is preserved via migration
const STORAGE_KEY = 'todoai-storage'

interface TodoState {
  todos: Todo[]
  addTodo: (title: string, attachments?: Attachment[]) => void
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
  // Folder
  setFolder: (id: string, folderId: string | null) => void
  // Reminder
  setReminder: (id: string, reminder: Reminder | null) => void
  // Archive
  archiveTodo: (id: string) => void
  unarchiveTodo: (id: string) => void
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

function createTodo(title: string, attachments: Attachment[] = []): Todo {
  return {
    id: crypto.randomUUID(),
    title,
    completed: false,
    createdAt: Date.now(),
    attachments,
    position: randomPosition(),
    zIndex: 10,
    color: randomColor(),
    rotation: randomRotation(),
    priority: 'normal',
    subtasks: [],
    folderId: null,
    reminder: null,
    archived: false,
  }
}

export const useTodoStore = create<TodoState>()(
  persist(
    (set) => ({
      todos: [],

      addTodo: (title, attachments = []) =>
        set((state) => {
          const maxZ = state.todos.reduce((m, t) => Math.max(m, t.zIndex), 10)
          const next = createTodo(title, attachments)
          return { todos: [...state.todos, { ...next, zIndex: maxZ + 1 }] }
        }),

      deleteTodo: (id) =>
        set((state) => ({ todos: state.todos.filter((t) => t.id !== id) })),

      toggleTodo: (id) =>
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === id ? { ...t, completed: !t.completed } : t
          ),
        })),

      updateTitle: (id, title) =>
        set((state) => ({
          todos: state.todos.map((t) => (t.id === id ? { ...t, title } : t)),
        })),

      moveTodo: (id, x, y) =>
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === id ? { ...t, position: { x, y } } : t
          ),
        })),

      bringToFront: (id) =>
        set((state) => {
          const maxZ = state.todos.reduce((m, t) => Math.max(m, t.zIndex), 10)
          return {
            todos: state.todos.map((t) =>
              t.id === id ? { ...t, zIndex: maxZ + 1 } : t
            ),
          }
        }),

      addAttachment: (todoId, attachment) =>
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === todoId
              ? { ...t, attachments: [...t.attachments, attachment] }
              : t
          ),
        })),

      removeAttachment: (todoId, attachmentId) =>
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === todoId
              ? { ...t, attachments: t.attachments.filter((a) => a.id !== attachmentId) }
              : t
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
                  subtasks: [
                    ...t.subtasks,
                    { id: crypto.randomUUID(), title, completed: false },
                  ],
                }
              : t
          ),
        })),

      toggleSubTask: (todoId, subtaskId) =>
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === todoId
              ? {
                  ...t,
                  subtasks: t.subtasks.map((s) =>
                    s.id === subtaskId ? { ...s, completed: !s.completed } : s
                  ),
                }
              : t
          ),
        })),

      deleteSubTask: (todoId, subtaskId) =>
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === todoId
              ? { ...t, subtasks: t.subtasks.filter((s) => s.id !== subtaskId) }
              : t
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
            t.id === id ? { ...t, archived: true, folderId: null } : t
          ),
        })),

      unarchiveTodo: (id) =>
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === id ? { ...t, archived: false } : t
          ),
        })),
    }),
    {
      name: STORAGE_KEY,
      version: 3,
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
              color: t.color ?? NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
              rotation: t.rotation ?? parseFloat(((Math.random() - 0.5) * 10).toFixed(2)),
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
        return state
      },
    }
  )
)
