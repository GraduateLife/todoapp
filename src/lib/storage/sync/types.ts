import type { Todo, Folder } from '../../../features/todo/types'
import type { Store } from '../stores/types'

export type SyncEntityKind = 'todo' | 'folder'
export type SyncEntity = Todo | Folder

export interface SyncEngine {
  onInit: (local: Store, remote: Store) => Promise<void>
  onWrite: (kind: SyncEntityKind, data: SyncEntity, remote: Store) => Promise<void>
  onDelete: (kind: SyncEntityKind, id: string, remote: Store) => Promise<void>
}
