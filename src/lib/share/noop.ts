import type { ShareStrategy } from './types'

/** Offline fallback — sharing is not available without a backend. */
export class NoopShareStrategy implements ShareStrategy {
  isAvailable(): boolean {
    return false
  }

  async publish(): Promise<never> {
    throw new Error('[share] Not available in offline mode')
  }

  async revoke(): Promise<void> {
    // Nothing to do
  }
}
