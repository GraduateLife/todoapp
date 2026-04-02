import type { StorageStrategy } from './types'
import type { Todo, Folder } from '../../features/todo/types'
import { IDBDriver } from '../drivers/idb'
import { ApiDriver } from '../drivers/api'

/**
 * Dual-write strategy: IDB is the authority, API receives a fire-and-forget copy.
 * Reads (init) prefer IDB. API failures are logged but never surface to the caller.
 */
export class DualStrategy implements StorageStrategy {
  private idb = new IDBDriver()
  private api = new ApiDriver()

  async init(): Promise<{ todos: Todo[]; folders: Folder[] }> {
    return this.idb.init()
  }

  async saveTodo(todo: Todo): Promise<void> {
    await this.idb.saveTodo(todo)
    this.api.saveTodo(todo).catch((e) => console.warn('[dual] api.saveTodo failed:', e))
  }

  async deleteTodo(id: string): Promise<void> {
    await this.idb.deleteTodo(id)
    this.api.deleteTodo(id).catch((e) => console.warn('[dual] api.deleteTodo failed:', e))
  }

  async saveFolder(folder: Folder): Promise<void> {
    await this.idb.saveFolder(folder)
    this.api.saveFolder(folder).catch((e) => console.warn('[dual] api.saveFolder failed:', e))
  }

  async deleteFolder(id: string): Promise<void> {
    await this.idb.deleteFolder(id)
    this.api.deleteFolder(id).catch((e) => console.warn('[dual] api.deleteFolder failed:', e))
  }
}
