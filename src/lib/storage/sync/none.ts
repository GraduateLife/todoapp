import type { Store } from '../stores/types'
import type { SyncEngine, SyncEntity, SyncEntityKind } from './types'

export class NoneSync implements SyncEngine {
  async onInit(_local: Store, _remote: Store): Promise<void> {}

  async onWrite(_kind: SyncEntityKind, _data: SyncEntity, _remote: Store): Promise<void> {}

  async onDelete(_kind: SyncEntityKind, _id: string, _remote: Store): Promise<void> {}
}
