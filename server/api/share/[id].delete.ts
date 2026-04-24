import {
  defineEventHandler,
  getRouterParam,
  setResponseStatus,
} from 'nitro/h3'
import { getShareProxyConfig } from '../../utils/shareProxy'

function parseJsonSafely(text: string): unknown {
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const { upstreamBaseUrl } = getShareProxyConfig()

  if (!id) {
    setResponseStatus(event, 400)
    return {
      code: 'INVALID_SHARE_ID',
      message: 'Missing share id',
    }
  }

  try {
    const res = await fetch(`${upstreamBaseUrl}/share/${id}`, {
      method: 'DELETE',
    })

    const text = await res.text()
    const data = parseJsonSafely(text) ?? { ok: res.ok }

    if (!res.ok) {
      setResponseStatus(event, res.status)
      return {
        code: 'UPSTREAM_ERROR',
        message: `Share revoke failed with ${res.status}`,
        upstreamStatus: res.status,
        upstreamTarget: upstreamBaseUrl,
        details: data,
      }
    }

    return data
  } catch (error) {
    setResponseStatus(event, 502)
    return {
      code: 'UPSTREAM_UNREACHABLE',
      message: error instanceof Error ? error.message : 'Unknown upstream error',
      upstreamTarget: upstreamBaseUrl,
    }
  }
})
