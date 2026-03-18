import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Todo, Attachment, NoteColor } from './types'
import { NOTE_COLORS } from './types'

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
  return parseFloat(((Math.random() - 0.5) * 10).toFixed(2)) // -5 to +5 degrees
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
          return {
            todos: [...state.todos, { ...next, zIndex: maxZ + 1 }],
          }
        }),
      deleteTodo: (id) =>
        set((state) => ({
          todos: state.todos.filter((t) => t.id !== id),
        })),
      toggleTodo: (id) =>
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === id ? { ...t, completed: !t.completed } : t
          ),
        })),
      updateTitle: (id, title) =>
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === id ? { ...t, title } : t
          ),
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
              ? {
                  ...t,
                  attachments: t.attachments.filter((a) => a.id !== attachmentId),
                }
              : t
          ),
        })),
    }),
    {
      name: STORAGE_KEY,
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          return {
            todos: (persistedState?.todos ?? []).map((t: any) => ({
              ...t,
              position: t.position ?? { x: Math.floor(Math.random() * 600 + 80), y: Math.floor(Math.random() * 300 + 100) },
              zIndex: t.zIndex ?? 10,
              color: t.color ?? NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
              rotation: t.rotation ?? parseFloat(((Math.random() - 0.5) * 10).toFixed(2)),
              attachments: t.attachments ?? [],
            })),
          }
        }
        return persistedState
      },
      onRehydrateStorage: () => {
        console.log('[store] onRehydrateStorage setup')
        return (state, error) => {
          console.log('[store] rehydrate done, todos:', state?.todos?.length, 'error:', error)
        }
      },
    }
  )
)
