import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Todo, Attachment } from './types'

const STORAGE_KEY = 'todoai-storage'

interface TodoState {
  todos: Todo[]
  addTodo: (title: string, attachments?: Attachment[]) => void
  deleteTodo: (id: string) => void
  toggleTodo: (id: string) => void
  updateTitle: (id: string, title: string) => void
  reorderTodos: (fromIndex: number, toIndex: number) => void
  addAttachment: (todoId: string, attachment: Attachment) => void
  removeAttachment: (todoId: string, attachmentId: string) => void
}

function createTodo(title: string, attachments: Attachment[] = []): Todo {
  return {
    id: crypto.randomUUID(),
    title,
    completed: false,
    createdAt: Date.now(),
    attachments,
  }
}

export const useTodoStore = create<TodoState>()(
  persist(
    (set) => ({
      todos: [],
      addTodo: (title, attachments = []) =>
        set((state) => ({
          todos: [...state.todos, createTodo(title, attachments)].sort(
            (a, b) => b.createdAt - a.createdAt
          ),
        })),
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
      reorderTodos: (fromIndex, toIndex) =>
        set((state) => {
          if (fromIndex === toIndex) return state
          const next = [...state.todos]
          const [removed] = next.splice(fromIndex, 1)
          next.splice(toIndex, 0, removed)
          return { todos: next }
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
    { name: STORAGE_KEY }
  )
)
