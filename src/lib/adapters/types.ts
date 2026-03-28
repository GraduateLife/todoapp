import type { Todo, Folder } from '../../features/todo/types'

export interface SyncQueueEntry {
  id: string
  op: 'create' | 'update' | 'delete'
  entity: 'todo' | 'folder'
  payload: unknown
  createdAt: number
  synced: boolean
}

export interface DataAdapter {
  /** Load all persisted data. Called once at app startup. */
  init(): Promise<{ todos: Todo[]; folders: Folder[] }>

  saveTodo(todo: Todo): Promise<void>
  deleteTodo(id: string): Promise<void>

  saveFolder(folder: Folder): Promise<void>
  deleteFolder(id: string): Promise<void>
}
