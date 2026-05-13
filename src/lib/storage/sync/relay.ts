import type { Folder, Todo } from '../../../features/todo/types'
import type { Store } from '../stores/types'
import type { SyncEngine, SyncEntity, SyncEntityKind } from './types'

export class RelaySync implements SyncEngine {
  async onInit(_local: Store, _remote: Store): Promise<void> {}

  async onWrite(kind: SyncEntityKind, data: SyncEntity, remote: Store): Promise<void> {
    if (kind === 'todo') {
      void remote.saveTodo(data as Todo).catch((e) => {
        console.warn('[relay] remote.saveTodo failed:', e)
      })
      return
    }

    void remote.saveFolder(data as Folder).catch((e) => {
      console.warn('[relay] remote.saveFolder failed:', e)
    })
  }

  async onDelete(kind: SyncEntityKind, id: string, remote: Store): Promise<void> {
    if (kind === 'todo') {
      void remote.deleteTodo(id).catch((e) => {
        console.warn('[relay] remote.deleteTodo failed:', e)
      })
      return
    }

    void remote.deleteFolder(id).catch((e) => {
      console.warn('[relay] remote.deleteFolder failed:', e)
    })
  }
}
