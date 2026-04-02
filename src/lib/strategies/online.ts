import type { StorageStrategy } from './types'
import type { Todo, Folder } from '../../features/todo/types'
import { ApiDriver } from '../drivers/api'

/** Online strategy: persists exclusively to the remote API. Requires network. */
export class OnlineStrategy implements StorageStrategy {
  private driver = new ApiDriver()

  init() { return this.driver.init() }
  saveTodo(todo: Todo) { return this.driver.saveTodo(todo) }
  deleteTodo(id: string) { return this.driver.deleteTodo(id) }
  saveFolder(folder: Folder) { return this.driver.saveFolder(folder) }
  deleteFolder(id: string) { return this.driver.deleteFolder(id) }
}
