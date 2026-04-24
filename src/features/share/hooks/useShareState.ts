import { useCallback, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  SHARE_PROXY_BASE_URL,
  ShareRequestError,
  getShareStrategy,
  probeShareHealth,
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

interface RecentShareRecord {
  url: string
  title: string
  format: ExportFormat
  sharedAt: number
}

const SHARE_HEALTH_QUERY_KEY = ['share', 'health'] as const
const RECENT_SHARE_QUERY_KEY = ['share', 'recent-success'] as const

export function useShareState() {
  const [urlCopied, setUrlCopied] = useState(false)
  const [lastAttempt, setLastAttempt] = useState<ShareAttempt | null>(null)
  const queryClient = useQueryClient()

  const health = useQuery({
    queryKey: SHARE_HEALTH_QUERY_KEY,
    queryFn: () => probeShareHealth(),
    refetchInterval: 15_000,
    staleTime: 10_000,
  })

  const recentShare = useQuery<RecentShareRecord | null>({
    queryKey: RECENT_SHARE_QUERY_KEY,
    queryFn: () =>
      Promise.resolve(
        queryClient.getQueryData<RecentShareRecord | null>(RECENT_SHARE_QUERY_KEY) ??
          null,
      ),
    staleTime: Number.POSITIVE_INFINITY,
  })

  const publishMutation = useMutation({
    mutationFn: (args: PublishArgs) => getShareStrategy().publish(args),
    onMutate: (args) => {
      const startedAt = Date.now()
      const target = `${SHARE_PROXY_BASE_URL}/share`
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

      return {
        startedAt,
        target,
        format: args.format,
        title: args.title,
      }
    },
    onSuccess: (result, args, context) => {
      const startedAt = context.startedAt
      const finishedAt = Date.now()

      setLastAttempt({
        startedAt,
        finishedAt,
        durationMs: finishedAt - startedAt,
        target: context.target,
        format: context.format,
        outcome: 'success',
        statusCode: 200,
        shareUrl: result.url,
        error: null,
      })

      queryClient.setQueryData<RecentShareRecord>(RECENT_SHARE_QUERY_KEY, {
        url: result.url,
        title: context.title,
        format: context.format,
        sharedAt: finishedAt,
      })

      try {
        void navigator.clipboard.writeText(result.url).then(() => {
          setUrlCopied(true)
          setTimeout(() => setUrlCopied(false), 2000)
        })
      } catch {
        // clipboard can fail on some browsers — that's fine
      }
    },
    onError: (err, args, context) => {
      console.error('[share] failed', err)
      const message = err instanceof Error ? err.message : 'Share failed'
      const startedAt = context.startedAt
      const finishedAt = Date.now()

      setLastAttempt({
        startedAt,
        finishedAt,
        durationMs: finishedAt - startedAt,
        target: context.target,
        format: context.format,
        outcome: 'error',
        statusCode: err instanceof ShareRequestError ? err.status : null,
        shareUrl: null,
        error: message,
      })
    },
  })

  const resetMutationRef = useRef(publishMutation.reset)
  resetMutationRef.current = publishMutation.reset

  const mutateAsyncRef = useRef(publishMutation.mutateAsync)
  mutateAsyncRef.current = publishMutation.mutateAsync

  const reset = useCallback(() => {
    setUrlCopied(false)
    resetMutationRef.current()
  }, [])

  const publish = useCallback(
    async (args: PublishArgs) => {
      await mutateAsyncRef.current(args)
    },
    [],
  )

  const copyUrl = useCallback(async () => {
    const url = publishMutation.data?.url ?? recentShare.data?.url ?? null
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setUrlCopied(true)
      setTimeout(() => setUrlCopied(false), 2000)
    } catch (err) {
      console.error('Copy URL failed', err)
    }
  }, [publishMutation.data?.url, recentShare.data?.url])

  let status: ShareStatus = 'idle'
  if (publishMutation.isPending) status = 'sharing'
  else if (publishMutation.isError) status = 'error'
  else if (publishMutation.isSuccess) status = 'shared'

  const currentShare = publishMutation.data ?? null
  const error = publishMutation.error?.message ?? null

  return {
    status,
    url: currentShare?.url ?? null,
    error,
    urlCopied,
    lastAttempt,
    currentShare,
    recentShare: recentShare.data ?? null,
    health,
    publish,
    copyUrl,
    reset,
  }
}
