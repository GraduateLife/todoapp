import type { ShareStrategy, ShareInput, ShareResult } from './types'

const HEALTH_TIMEOUT_MS = 2500
export const SHARE_PROXY_BASE_URL = '/api'

export class ShareRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly url: string,
    readonly method: 'POST' | 'DELETE',
  ) {
    super(message)
    this.name = 'ShareRequestError'
  }
}

export interface ShareHealthStatus {
  ok: boolean
  status: number | null
  checkedAt: number
  error: string | null
  target: string | null
}

export class ApiShareStrategy implements ShareStrategy {
  constructor(private readonly apiBaseUrl: string = SHARE_PROXY_BASE_URL) {}

  isAvailable(): boolean {
    return true
  }

  async publish(input: ShareInput): Promise<ShareResult> {
    const url = `${this.apiBaseUrl}/share`
    const startedAt = Date.now()
    console.info('[share:publish:start]', {
      target: this.apiBaseUrl,
      format: input.format,
      title: input.title,
      contentLength: input.content.length,
    })

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) {
      const error = new ShareRequestError(
        `[share] POST /share → ${res.status}`,
        res.status,
        url,
        'POST',
      )
      console.error('[share:publish:error]', {
        target: this.apiBaseUrl,
        status: res.status,
        durationMs: Date.now() - startedAt,
      })
      throw error
    }
    const result = (await res.json()) as ShareResult
    console.info('[share:publish:success]', {
      target: this.apiBaseUrl,
      status: res.status,
      durationMs: Date.now() - startedAt,
      shareId: result.id,
      shareUrl: result.url,
    })
    return result
  }

  async revoke(id: string): Promise<void> {
    const url = `${this.apiBaseUrl}/share/${id}`
    const res = await fetch(url, {
      method: 'DELETE',
    })
    if (!res.ok) {
      throw new ShareRequestError(
        `[share] DELETE /share/${id} → ${res.status}`,
        res.status,
        url,
        'DELETE',
      )
    }
  }
}

export async function probeShareHealth(
  apiBaseUrl: string = SHARE_PROXY_BASE_URL,
): Promise<ShareHealthStatus> {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), HEALTH_TIMEOUT_MS)
    const res = await fetch(`${apiBaseUrl}/share/health`, {
      method: 'GET',
      signal: ctrl.signal,
    })
    clearTimeout(timer)
    const data = (await res.json()) as Partial<ShareHealthStatus>
    return {
      ok: data.ok === true,
      status: data.status ?? res.status,
      checkedAt: data.checkedAt ?? Date.now(),
      error: data.error ?? (res.ok ? null : `HTTP ${res.status}`),
      target: data.target ?? null,
    }
  } catch (error) {
    return {
      ok: false,
      status: null,
      checkedAt: Date.now(),
      error: error instanceof Error ? error.message : 'Unknown error',
      target: null,
    }
  }
}
