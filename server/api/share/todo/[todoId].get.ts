import { defineEventHandler, getRouterParam, setResponseStatus } from 'nitro/h3'
import { getShareProxyConfig } from '../../../utils/shareProxy'

function parseJsonSafely(text: string): unknown {
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

export default defineEventHandler(async (event) => {
  const todoId = getRouterParam(event, 'todoId')
  const { upstreamBaseUrl } = getShareProxyConfig()

  if (!todoId) {
    setResponseStatus(event, 400)
    return {
      code: 'INVALID_TODO_ID',
      message: 'Missing todo id',
    }
  }

  try {
    const res = await fetch(`${upstreamBaseUrl}/share/todo/${todoId}`, {
      method: 'GET',
    })

    const text = await res.text()
    const data = parseJsonSafely(text)

    if (!res.ok) {
      setResponseStatus(event, res.status)
      return data
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
