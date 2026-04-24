import { useCallback, useState } from 'react'
import {
  SHARE_PROXY_BASE_URL,
  ShareRequestError,
  getShareStrategy,
} from '#/lib/share'
import type { ExportFormat } from '#/features/todo/export/templates'

export type ShareStatus = 'idle' | 'sharing' | 'shared' | 'error'

interface PublishArgs {
  title: string
  format: ExportFormat
  content: string
}

export interface ShareAttempt {
  startedAt: number
  finishedAt: number | null
  durationMs: number | null
  target: string
  format: ExportFormat
  outcome: 'in_flight' | 'success' | 'error'
  statusCode: number | null
  shareUrl: string | null
  error: string | null
}

export function useShareState() {
  const [status, setStatus] = useState<ShareStatus>('idle')
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [urlCopied, setUrlCopied] = useState(false)
  const [lastAttempt, setLastAttempt] = useState<ShareAttempt | null>(null)

  const reset = useCallback(() => {
    setStatus('idle')
    setUrl(null)
    setError(null)
    setUrlCopied(false)
  }, [])

  const publish = useCallback(async (args: PublishArgs) => {
    const startedAt = Date.now()
    const target = `${SHARE_PROXY_BASE_URL}/share`
    setStatus('sharing')
    setError(null)
    setLastAttempt({
      startedAt,
      finishedAt: null,
      durationMs: null,
      target,
      format: args.format,
      outcome: 'in_flight',
      statusCode: null,
      shareUrl: null,
      error: null,
    })

    try {
      const result = await getShareStrategy().publish(args)
      setUrl(result.url)
      setStatus('shared')
      setLastAttempt({
        startedAt,
        finishedAt: Date.now(),
        durationMs: Date.now() - startedAt,
        target,
        format: args.format,
        outcome: 'success',
        statusCode: 200,
        shareUrl: result.url,
        error: null,
      })
      try {
        await navigator.clipboard.writeText(result.url)
        setUrlCopied(true)
        setTimeout(() => setUrlCopied(false), 2000)
      } catch {
        // clipboard can fail on some browsers — that's fine
      }
    } catch (err) {
      console.error('[share] failed', err)
      const message = err instanceof Error ? err.message : 'Share failed'
      setError(message)
      setLastAttempt({
        startedAt,
        finishedAt: Date.now(),
        durationMs: Date.now() - startedAt,
        target,
        format: args.format,
        outcome: 'error',
        statusCode: err instanceof ShareRequestError ? err.status : null,
        shareUrl: null,
        error: message,
      })
      setStatus('error')
    }
  }, [])

  const copyUrl = useCallback(async () => {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setUrlCopied(true)
      setTimeout(() => setUrlCopied(false), 2000)
    } catch (err) {
      console.error('Copy URL failed', err)
    }
  }, [url])

  return {
    status,
    url,
    error,
    urlCopied,
    lastAttempt,
    publish,
    copyUrl,
    reset,
  }
}
