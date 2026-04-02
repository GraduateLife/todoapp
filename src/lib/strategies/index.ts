import { STORAGE_STRATEGY } from '../env'
import type { StorageStrategy } from './types'
import type { Todo, Folder } from '../../features/todo/types'

export type { StorageStrategy }

let _strategy: StorageStrategy | null = null

export function getStrategy(): StorageStrategy {
  if (!_strategy) throw new Error('[strategy] Not initialized. Call initStrategy() first.')
  return _strategy
}

export async function initStrategy(): Promise<{ todos: Todo[]; folders: Folder[] }> {
  if (!_strategy) {
    if (STORAGE_STRATEGY === 'online') {
      const { OnlineStrategy } = await import('./online')
      _strategy = new OnlineStrategy()
    } else if (STORAGE_STRATEGY === 'dual') {
      const { DualStrategy } = await import('./dual')
      _strategy = new DualStrategy()
    } else if (STORAGE_STRATEGY === 'auto') {
      const { AutoStrategy } = await import('./auto')
      _strategy = new AutoStrategy()
    } else {
      const { OfflineStrategy } = await import('./offline')
      _strategy = new OfflineStrategy()
    }
  }
  return _strategy.init()
}
