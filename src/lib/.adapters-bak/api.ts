import type { DataAdapter } from './types'
import type { Todo, Folder } from '../../features/todo/types'
import { API_BASE_URL } from '../env'

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`[api] ${method} ${path} → ${res.status}`)
  return res.json() as Promise<T>
}

export class ApiAdapter implements DataAdapter {
  async init(): Promise<{ todos: Todo[]; folders: Folder[] }> {
    const [todos, folders] = await Promise.all([
      req<Todo[]>('GET', '/todos'),
      req<Folder[]>('GET', '/folders'),
    ])
    return { todos, folders }
  }

  async saveTodo(todo: Todo): Promise<void> {
    await req('PUT', `/todos/${todo.id}`, todo)
  }

  async deleteTodo(id: string): Promise<void> {
    await req('DELETE', `/todos/${id}`)
  }

  async saveFolder(folder: Folder): Promise<void> {
    await req('PUT', `/folders/${folder.id}`, folder)
  }

  async deleteFolder(id: string): Promise<void> {
    await req('DELETE', `/folders/${id}`)
  }
}
