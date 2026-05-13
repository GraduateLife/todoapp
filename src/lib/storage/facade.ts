import type { Folder, Todo } from '../../features/todo/types'
import type { Store } from './stores/types'
import type { SyncEngine } from './sync/types'
import type { StorageStrategy } from './types'

export class StorageFacade implements StorageStrategy {
  constructor(
    private local: Store,
    private remote: Store | null,
    private sync: SyncEngine,
  ) {}

  async init(): Promise<{ todos: Todo[]; folders: Folder[] }> {
    const data = await this.local.init()
    if (this.remote) {
      await this.sync.onInit(this.local, this.remote)
    }
    return data
  }

  async saveTodo(todo: Todo): Promise<void> {
    await this.local.saveTodo(todo)
    if (this.remote) {
      await this.sync.onWrite('todo', todo, this.remote)
    }
  }

  async deleteTodo(id: string): Promise<void> {
    await this.local.deleteTodo(id)
    if (this.remote) {
      await this.sync.onDelete('todo', id, this.remote)
    }
  }

  async saveFolder(folder: Folder): Promise<void> {
    await this.local.saveFolder(folder)
    if (this.remote) {
      await this.sync.onWrite('folder', folder, this.remote)
    }
  }

  async deleteFolder(id: string): Promise<void> {
    await this.local.deleteFolder(id)
    if (this.remote) {
      await this.sync.onDelete('folder', id, this.remote)
    }
  }
}
