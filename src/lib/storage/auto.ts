import { API_BASE_URL } from '../env'
import { StorageFacade } from './facade'
import { IdbStore } from './stores/local/idb'
import { ApiStore } from './stores/remote/api'
import { NoneSync } from './sync/none'
import { RelaySync } from './sync/relay'
import type { StorageStrategy } from './types'

const HEARTBEAT_INTERVAL = 15_000
const HEARTBEAT_TIMEOUT = 4_000

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

function createOfflineStorage(): StorageStrategy {
  return new StorageFacade(new IdbStore(), null, new NoneSync())
}

function createRelayStorage(): StorageStrategy {
  return new StorageFacade(new IdbStore(), new ApiStore(), new RelaySync())
}

export class AutoStorageStrategy implements StorageStrategy {
  private active: StorageStrategy = createOfflineStorage()
  private heartbeatId: ReturnType<typeof setInterval> | null = null
  private mode: 'offline' | 'relay' = 'offline'

  private async switch(apiReachable: boolean): Promise<void> {
    const nextMode = apiReachable ? 'relay' : 'offline'
    if (this.mode === nextMode) return
    this.active = nextMode === 'relay' ? createRelayStorage() : createOfflineStorage()
    this.mode = nextMode
    console.info(`[auto] switched to ${nextMode} storage`)
  }

  async init() {
    const reachable = await probeApi()
    await this.switch(reachable)
    const data = await this.active.init()

    this.heartbeatId = setInterval(async () => {
      await this.switch(await probeApi())
    }, HEARTBEAT_INTERVAL)

    return data
  }

  destroy(): void {
    if (this.heartbeatId !== null) clearInterval(this.heartbeatId)
  }

  saveTodo(todo: Parameters<StorageStrategy['saveTodo']>[0]) {
    return this.active.saveTodo(todo)
  }

  deleteTodo(id: string) {
    return this.active.deleteTodo(id)
  }

  saveFolder(folder: Parameters<StorageStrategy['saveFolder']>[0]) {
    return this.active.saveFolder(folder)
  }

  deleteFolder(id: string) {
    return this.active.deleteFolder(id)
  }
}
