import type { IDBPDatabase } from 'idb'
import { openDB } from 'idb'
import type { Store } from '../types'
import type { Todo, Folder } from '../../../../features/todo/types'
import { NOTE_COLORS } from '../../../../features/todo/types'

const DB_NAME = 'todoapp-idb'
const DB_VERSION = 1
const TODO_LS_KEY = 'todoai-storage'
const FOLDER_LS_KEY = 'todoai-folders'

function migrateLSTodos(raw: unknown): Todo[] {
  const parsed = asRecord(raw)
  const version = typeof parsed.version === 'number' ? parsed.version : 0
  const state = asRecord(parsed.state)
  let todos: unknown[] = Array.isArray(state.todos) ? state.todos : []

  if (version < 2) {
    todos = todos.map((t: unknown) => {
      const todo = t as Record<string, unknown>
      return {
        ...todo,
        position: todo.position ?? {
          x: Math.floor(Math.random() * 600 + 80),
          y: Math.floor(Math.random() * 300 + 100),
        },
        zIndex: todo.zIndex ?? 10,
        color: todo.color ?? NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
        rotation: todo.rotation ?? parseFloat(((Math.random() - 0.5) * 10).toFixed(2)),
        attachments: todo.attachments ?? [],
      }
    })
  }
  if (version < 3) {
    todos = todos.map((t: unknown) => {
      const todo = t as Record<string, unknown>
      return {
        ...todo,
        priority: todo.priority ?? 'normal',
        subtasks: todo.subtasks ?? [],
        folderId: todo.folderId ?? null,
        reminder: todo.reminder ?? null,
        archived: todo.archived ?? false,
      }
    })
  }
  if (version < 4) {
    todos = todos.map((t: unknown) => {
      const todo = t as Record<string, unknown>
      return { ...todo, stackedIds: todo.stackedIds ?? [] }
    })
  }
  return todos as Todo[]
}

function migrateLSFolders(raw: unknown): Folder[] {
  const parsed = asRecord(raw)
  const version = typeof parsed.version === 'number' ? parsed.version : 0
  const state = asRecord(parsed.state)
  let folders: unknown[] = Array.isArray(state.folders) ? state.folders : []

  if (version < 2) {
    folders = folders.map((f: unknown) => {
      const folder = f as Record<string, unknown>
      return { ...folder, orderedTodoIds: folder.orderedTodoIds ?? [] }
    })
  }
  folders = folders.map((f: unknown) => ({ ...(f as object), isOpen: false }))
  return folders as Folder[]
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

export class IdbStore implements Store {
  private db: IDBPDatabase | null = null

  private async open(): Promise<IDBPDatabase> {
    if (this.db) return this.db
    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('todos')) {
          db.createObjectStore('todos', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('folders')) {
          db.createObjectStore('folders', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('sync_queue')) {
          db.createObjectStore('sync_queue', { keyPath: 'id' })
        }
      },
    })
    return this.db
  }

  async init(): Promise<{ todos: Todo[]; folders: Folder[] }> {
    const db = await this.open()

    let todos = (await db.getAll('todos')) as Todo[]
    let folders = (await db.getAll('folders')) as Folder[]

    if (todos.length === 0 && folders.length === 0) {
      try {
        const rawTodos = localStorage.getItem(TODO_LS_KEY)
        if (rawTodos) {
          todos = migrateLSTodos(JSON.parse(rawTodos))
          const tx = db.transaction('todos', 'readwrite')
          await Promise.all([...todos.map((t) => tx.store.put(t)), tx.done])
          localStorage.removeItem(TODO_LS_KEY)
        }

        const rawFolders = localStorage.getItem(FOLDER_LS_KEY)
        if (rawFolders) {
          folders = migrateLSFolders(JSON.parse(rawFolders))
          const tx = db.transaction('folders', 'readwrite')
          await Promise.all([...folders.map((f) => tx.store.put(f)), tx.done])
          localStorage.removeItem(FOLDER_LS_KEY)
        }
      } catch (e) {
        console.warn('[idb] localStorage migration failed:', e)
      }
    } else {
      folders = folders.map((f) => ({ ...f, isOpen: false }))
    }

    return { todos, folders }
  }

  async saveTodo(todo: Todo): Promise<void> {
    const db = await this.open()
    await db.put('todos', todo)
  }

  async deleteTodo(id: string): Promise<void> {
    const db = await this.open()
    await db.delete('todos', id)
  }

  async saveFolder(folder: Folder): Promise<void> {
    const db = await this.open()
    await db.put('folders', folder)
  }

  async deleteFolder(id: string): Promise<void> {
    const db = await this.open()
    await db.delete('folders', id)
  }
}
