import { defineEventHandler, readBody, setResponseStatus } from 'nitro/h3'
import { getShareProxyConfig } from '../utils/shareProxy'

function parseJsonSafely(text: string): unknown {
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

export default defineEventHandler(async (event) => {
  const { upstreamBaseUrl } = getShareProxyConfig()
  const startedAt = Date.now()

  try {
    const body = await readBody(event)

    console.info('[share:bff:publish:start]', {
      upstreamTarget: upstreamBaseUrl,
    })

    const res = await fetch(`${upstreamBaseUrl}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const text = await res.text()
    const data = parseJsonSafely(text)

    if (!res.ok) {
      console.error('[share:bff:publish:error]', {
        upstreamTarget: upstreamBaseUrl,
        status: res.status,
        durationMs: Date.now() - startedAt,
      })
      setResponseStatus(event, res.status)
      return {
        code: 'UPSTREAM_ERROR',
        message: `Share upstream failed with ${res.status}`,
        upstreamStatus: res.status,
        upstreamTarget: upstreamBaseUrl,
        details: data,
      }
    }

    console.info('[share:bff:publish:success]', {
      upstreamTarget: upstreamBaseUrl,
      status: res.status,
      durationMs: Date.now() - startedAt,
    })

    return data
  } catch (error) {
    console.error('[share:bff:publish:network-error]', {
      upstreamTarget: upstreamBaseUrl,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    })
    setResponseStatus(event, 502)
    return {
      code: 'UPSTREAM_UNREACHABLE',
      message: error instanceof Error ? error.message : 'Unknown upstream error',
      upstreamTarget: upstreamBaseUrl,
    }
  }
})
