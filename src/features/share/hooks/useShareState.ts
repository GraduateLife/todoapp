import { useCallback, useState } from 'react'
import { getShareStrategy } from '#/lib/share'
import type { ExportFormat } from '#/features/todo/export/templates'

export type ShareStatus = 'idle' | 'sharing' | 'shared' | 'error'

interface PublishArgs {
  title: string
  format: ExportFormat
  content: string
}

export function useShareState() {
  const [status, setStatus] = useState<ShareStatus>('idle')
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [urlCopied, setUrlCopied] = useState(false)

  const reset = useCallback(() => {
    setStatus('idle')
    setUrl(null)
    setError(null)
    setUrlCopied(false)
  }, [])

  const publish = useCallback(async (args: PublishArgs) => {
    setStatus('sharing')
    setError(null)
    try {
      const result = await getShareStrategy().publish(args)
      setUrl(result.url)
      setStatus('shared')
      try {
        await navigator.clipboard.writeText(result.url)
        setUrlCopied(true)
        setTimeout(() => setUrlCopied(false), 2000)
      } catch {
        // clipboard can fail on some browsers — that's fine
      }
    } catch (err) {
      console.error('[share] failed', err)
      setError(err instanceof Error ? err.message : 'Share failed')
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
    publish,
    copyUrl,
    reset,
  }
}
