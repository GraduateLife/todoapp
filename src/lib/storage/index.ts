import { STORAGE_STRATEGY } from '../env'
import { AutoStorageStrategy } from './auto'
import { StorageFacade } from './facade'
import { IdbStore } from './stores/local/idb'
import { ApiStore } from './stores/remote/api'
import { NoneSync } from './sync/none'
import { RelaySync } from './sync/relay'
import type { StorageStrategy } from './types'
import type { Todo, Folder } from '../../features/todo/types'

export type { StorageStrategy }

let strategy: StorageStrategy | null = null

function createStrategy(): StorageStrategy {
  if (STORAGE_STRATEGY === 'online') {
    return new StorageFacade(new IdbStore(), new ApiStore(), new RelaySync())
  }
  if (STORAGE_STRATEGY === 'dual') {
    return new StorageFacade(new IdbStore(), new ApiStore(), new RelaySync())
  }
  if (STORAGE_STRATEGY === 'auto') {
    return new AutoStorageStrategy()
  }
  return new StorageFacade(new IdbStore(), null, new NoneSync())
}

export function getStrategy(): StorageStrategy {
  if (!strategy) throw new Error('[storage] Not initialized. Call initStrategy() first.')
  return strategy
}

export async function initStrategy(): Promise<{ todos: Todo[]; folders: Folder[] }> {
  if (!strategy) {
    strategy = createStrategy()
  }
  return strategy.init()
}
