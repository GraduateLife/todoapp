import type { ShareStrategy, ShareInput, ShareResult } from './types'

const HEALTH_TIMEOUT_MS = 2500
export const SHARE_PROXY_BASE_URL = '/api'

export class ShareRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly url: string,
    readonly method: 'GET' | 'POST' | 'DELETE',
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

    const data = (await readJsonSafely(res)) as SharePublishResponse | null

    if (res.status === 409 && data?.code === 'SHARE_ALREADY_EXISTS' && data.share) {
      console.info('[share:publish:existing]', {
        target: this.apiBaseUrl,
        status: res.status,
        durationMs: Date.now() - startedAt,
        shareId: data.share.id,
        shareUrl: data.share.url,
      })
      return data.share
    }

    if (!res.ok) {
      const error = new ShareRequestError(
        data?.message
          ? `[share] POST /share → ${res.status} (${data.message})`
          : `[share] POST /share → ${res.status}`,
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
    const result = data as ShareResult
    console.info('[share:publish:success]', {
      target: this.apiBaseUrl,
      status: res.status,
      durationMs: Date.now() - startedAt,
      shareId: result.id,
      shareUrl: result.url,
    })
    return result
  }

  async getByTodoId(todoId: string): Promise<ShareResult | null> {
    const url = `${this.apiBaseUrl}/share/todo/${todoId}`
    const res = await fetch(url, {
      method: 'GET',
    })

    if (res.status === 404) {
      return null
    }

    if (!res.ok) {
      throw new ShareRequestError(
        `[share] GET /share/todo/${todoId} → ${res.status}`,
        res.status,
        url,
        'GET',
      )
    }

    return (await res.json()) as ShareResult
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

interface ShareConflictPayload {
  code?: string
  message?: string
  share?: ShareResult
}

type SharePublishResponse = ShareResult | ShareConflictPayload

async function readJsonSafely(res: Response): Promise<unknown> {
  const text = await res.text()
  if (!text) return null

  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

export interface ShareStatusProbe {
  id: string
  status: number | null
  checkedAt: number
  error: string | null
}

export async function fetchShareStatus(
  id: string,
  apiBaseUrl: string = SHARE_PROXY_BASE_URL,
): Promise<ShareStatusProbe> {
  try {
    const res = await fetch(`${apiBaseUrl}/share/status/${id}`, {
      method: 'GET',
    })
    const data = (await res.json()) as Partial<ShareStatusProbe>
    return {
      id,
      status: data.status ?? null,
      checkedAt: data.checkedAt ?? Date.now(),
      error: data.error ?? null,
    }
  } catch (error) {
    return {
      id,
      status: null,
      checkedAt: Date.now(),
      error: error instanceof Error ? error.message : 'Unknown error',
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
