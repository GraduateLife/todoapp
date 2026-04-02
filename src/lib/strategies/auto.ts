import type { StorageStrategy } from './types'
import type { Todo, Folder } from '../../features/todo/types'
import { OfflineStrategy } from './offline'
import { DualStrategy } from './dual'
import { API_BASE_URL } from '../env'

const HEARTBEAT_INTERVAL = 15_000 // ms
const HEARTBEAT_TIMEOUT = 4_000   // ms

async function probeApi(): Promise<boolean> {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), HEARTBEAT_TIMEOUT)
    const res = await fetch(`${API_BASE_URL}/todos`, { method: 'GET', signal: ctrl.signal })
    clearTimeout(timer)
    return res.ok
  } catch {
    return false
  }
}

/**
 * Auto strategy: probes the API on startup and every HEARTBEAT_INTERVAL ms.
 * - API reachable  → delegates to DualStrategy (IDB + API)
 * - API unreachable → delegates to OfflineStrategy (IDB only)
 * Switching between states is seamless; IDB is always written first.
 */
export class AutoStrategy implements StorageStrategy {
  private active: StorageStrategy = new OfflineStrategy()
  private heartbeatId: ReturnType<typeof setInterval> | null = null

  private async switch(apiReachable: boolean) {
    const next = apiReachable ? new DualStrategy() : new OfflineStrategy()
    if (this.active.constructor === next.constructor) return
    this.active = next
    console.info(`[auto] switched to ${apiReachable ? 'dual' : 'offline'} strategy`)
  }

  async init(): Promise<{ todos: Todo[]; folders: Folder[] }> {
    const reachable = await probeApi()
    await this.switch(reachable)
    const data = await this.active.init()

    this.heartbeatId = setInterval(async () => {
      await this.switch(await probeApi())
    }, HEARTBEAT_INTERVAL)

    return data
  }

  destroy() {
    if (this.heartbeatId !== null) clearInterval(this.heartbeatId)
  }

  saveTodo(todo: Todo) { return this.active.saveTodo(todo) }
  deleteTodo(id: string) { return this.active.deleteTodo(id) }
  saveFolder(folder: Folder) { return this.active.saveFolder(folder) }
  deleteFolder(id: string) { return this.active.deleteFolder(id) }
}
