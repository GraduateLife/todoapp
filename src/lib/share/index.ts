import { API_BASE_URL } from '../env'
import type { ShareStrategy } from './types'

export type { ShareStrategy, ShareInput, ShareResult } from './types'

let _share: ShareStrategy | null = null

export function getShareStrategy(): ShareStrategy {
  if (!_share) throw new Error('[share] Not initialized. Call initShareStrategy() first.')
  return _share
}

export async function initShareStrategy(): Promise<void> {
  if (_share) return

  // Share is independent of the storage strategy — it only needs a
  // reachable backend. Probe the API and fall back to noop if unreachable.
  try {
    const res = await fetch(`${API_BASE_URL}/todos`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(2000),
    })
    if (res.ok) {
      const { ApiShareStrategy } = await import('./api')
      _share = new ApiShareStrategy()
      return
    }
  } catch {
    // Backend unreachable — fall through to noop
  }

  const { NoopShareStrategy } = await import('./noop')
  _share = new NoopShareStrategy()
}
