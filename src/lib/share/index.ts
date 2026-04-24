import type { ShareStrategy } from './types'

export type { ShareStrategy, ShareInput, ShareResult } from './types'
export type { ShareHealthStatus } from './api'
export {
  SHARE_PROXY_BASE_URL,
  ShareRequestError,
  probeShareHealth,
} from './api'

let _share: ShareStrategy | null = null

export function getShareStrategy(): ShareStrategy {
  if (!_share) {
    throw new Error('[share] Not initialized. Call initShareStrategy() first.')
  }
  return _share
}

export async function initShareStrategy(): Promise<void> {
  if (_share) return

  // Do not gate the share UI on a startup probe. The publish request itself
  // is the source of truth, which avoids permanently disabling share after a
  // transient Worker/CORS/cold-start failure.
  const { ApiShareStrategy } = await import('./api')
  _share = new ApiShareStrategy()
}
