import { API_BASE_URL } from '../env'
import type { ShareStrategy, ShareInput, ShareResult } from './types'

export class ApiShareStrategy implements ShareStrategy {
  isAvailable(): boolean {
    return true
  }

  async publish(input: ShareInput): Promise<ShareResult> {
    const res = await fetch(`${API_BASE_URL}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) {
      throw new Error(`[share] POST /share → ${res.status}`)
    }
    return res.json() as Promise<ShareResult>
  }

  async revoke(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/share/${id}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      throw new Error(`[share] DELETE /share/${id} → ${res.status}`)
    }
  }
}
