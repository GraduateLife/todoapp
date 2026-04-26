import { useCallback, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  SHARE_PROXY_BASE_URL,
  ShareRequestError,
  getShareStrategy,
  probeShareHealth,
} from '#/lib/share'
import {
  addSharedId,
  readRecentShare,
  removeSharedId,
  writeJustShared,
  writeRecentShare,
} from '#/lib/share/recent'
import type { RecentShareRecord } from '#/lib/share/recent'
import type { ExportFormat } from '#/features/todo/export/templates'
import { useTodoStore } from '#/features/todo/store/todoStore'

const CARD_WIDTH = 256
const CARD_HEIGHT = 160
const SHARE_LANDING_SPREAD = 80

function shareLandingPosition(): { x: number; y: number } {
  if (typeof window === 'undefined') return { x: 10, y: 10 }
  const cx = window.innerWidth / 2 - CARD_WIDTH / 2
  const cy = window.innerHeight / 2 - CARD_HEIGHT / 2
  return {
    x: Math.floor(cx + (Math.random() - 0.5) * SHARE_LANDING_SPREAD * 2),
    y: Math.floor(cy + (Math.random() - 0.5) * SHARE_LANDING_SPREAD * 2),
  }
}

export type ShareStatus = 'idle' | 'sharing' | 'shared' | 'error'

interface PublishArgs {
  todoId: string
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

const SHARE_HEALTH_QUERY_KEY = ['share', 'health'] as const
const RECENT_SHARE_QUERY_KEY = ['share', 'recent-success'] as const

export function useShareState(todoId: string | null) {
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
    queryFn: () => {
      const cached =
        queryClient.getQueryData<RecentShareRecord | null>(RECENT_SHARE_QUERY_KEY) ??
        null

      return Promise.resolve(cached ?? readRecentShare())
    },
    staleTime: Number.POSITIVE_INFINITY,
  })
  const scopedRecentShare =
    recentShare.data && recentShare.data.todoId === todoId ? recentShare.data : null

  const activeShare = useQuery({
    queryKey: ['share', 'active', todoId],
    queryFn: async () => {
      if (!todoId) return null
      return getShareStrategy().getByTodoId(todoId)
    },
    enabled: Boolean(todoId),
    staleTime: 5_000,
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

      const recent: RecentShareRecord = {
        todoId: args.todoId,
        url: result.url,
        title: context.title,
        format: context.format,
        sharedAt: finishedAt,
      }

      queryClient.setQueryData<RecentShareRecord>(RECENT_SHARE_QUERY_KEY, recent)
      writeRecentShare(recent)
      queryClient.setQueryData(['share', 'active', args.todoId], result)
      void queryClient.invalidateQueries({ queryKey: ['share', 'active-list'] })

      addSharedId(args.todoId)
      writeJustShared({ todoId: args.todoId, sharedAt: finishedAt })
      const landing = shareLandingPosition()
      useTodoStore.getState().moveTodo(args.todoId, landing.x, landing.y)

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

  const revokeMutation = useMutation({
    mutationFn: async (shareId: string) => {
      await getShareStrategy().revoke(shareId)
      return shareId
    },
    onSuccess: (_, shareId) => {
      if (todoId) {
        queryClient.setQueryData(['share', 'active', todoId], null)
        void queryClient.invalidateQueries({ queryKey: ['share', 'active', todoId] })
        removeSharedId(todoId)
      }
      void queryClient.invalidateQueries({ queryKey: ['share', 'active-list'] })

      if (publishMutation.data?.id === shareId) {
        publishMutation.reset()
      }
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

  const unshare = useCallback(async () => {
    const shareId = activeShare.data?.id ?? publishMutation.data?.id ?? null
    if (!shareId) return
    await revokeMutation.mutateAsync(shareId)
  }, [activeShare.data?.id, publishMutation.data?.id, revokeMutation])

  const copyUrl = useCallback(async () => {
    const url =
      activeShare.data?.url ??
      publishMutation.data?.url ??
      scopedRecentShare?.url ??
      null
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setUrlCopied(true)
      setTimeout(() => setUrlCopied(false), 2000)
    } catch (err) {
      console.error('Copy URL failed', err)
    }
  }, [activeShare.data?.url, publishMutation.data?.url, scopedRecentShare?.url])

  let status: ShareStatus = 'idle'
  if (publishMutation.isPending) status = 'sharing'
  else if (revokeMutation.isPending) status = 'sharing'
  else if (publishMutation.isError) status = 'error'
  else if (publishMutation.isSuccess || Boolean(activeShare.data)) status = 'shared'

  const currentShare = publishMutation.data ?? null
  const error = publishMutation.error?.message ?? revokeMutation.error?.message ?? null

  return {
    status,
    url: currentShare?.url ?? null,
    error,
    urlCopied,
    lastAttempt,
    currentShare,
    activeShare,
    recentShare: scopedRecentShare,
    health,
    isLocked: Boolean(activeShare.data),
    isRevoking: revokeMutation.isPending,
    publish,
    unshare,
    copyUrl,
    reset,
  }
}
