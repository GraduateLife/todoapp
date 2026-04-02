import type { StorageStrategy } from './types'
import type { Todo, Folder } from '../../features/todo/types'
import { IDBDriver } from '../drivers/idb'

/** Offline strategy: persists exclusively to IndexedDB. No network required. */
export class OfflineStrategy implements StorageStrategy {
  private driver = new IDBDriver()

  init() { return this.driver.init() }
  saveTodo(todo: Todo) { return this.driver.saveTodo(todo) }
  deleteTodo(id: string) { return this.driver.deleteTodo(id) }
  saveFolder(folder: Folder) { return this.driver.saveFolder(folder) }
  deleteFolder(id: string) { return this.driver.deleteFolder(id) }
}
