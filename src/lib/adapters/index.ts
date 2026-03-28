import { DATA_SOURCE } from '../env'
import type { DataAdapter } from './types'
import type { Todo, Folder } from '../../features/todo/types'

let _adapter: DataAdapter | null = null

export function getAdapter(): DataAdapter {
  if (!_adapter) throw new Error('[adapter] Not initialized. Call initAdapter() first.')
  return _adapter
}

/**
 * Creates the adapter based on DATA_SOURCE, opens the underlying store,
 * and returns the initial { todos, folders } to load into Zustand.
 * Safe to call multiple times — returns cached result after first call.
 */
export async function initAdapter(): Promise<{ todos: Todo[]; folders: Folder[] }> {
  if (!_adapter) {
    if (DATA_SOURCE === 'api') {
      const { ApiAdapter } = await import('./api')
      _adapter = new ApiAdapter()
    } else {
      const { IndexedDBAdapter } = await import('./idb')
      _adapter = new IndexedDBAdapter()
    }
  }
  return _adapter.init()
}
