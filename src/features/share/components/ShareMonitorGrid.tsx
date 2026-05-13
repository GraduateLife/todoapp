import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Todo } from '#/features/todo/types'
import { getShareStrategy } from '#/lib/share'
import type { ShareResult } from '#/lib/share'
import { removeSharedId } from '#/lib/share/recent'
import { ShareMonitorTile } from './ShareMonitorTile'

interface MonitorEntry {
  todo: Todo
  share: ShareResult
}

interface ShareMonitorGridProps {
  entries: MonitorEntry[]
  onSelectTodo: (todoId: string) => void
}

export function ShareMonitorGrid({
  entries,
  onSelectTodo,
}: ShareMonitorGridProps) {
  const queryClient = useQueryClient()
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const revokeMutation = useMutation({
    mutationFn: async ({ shareId }: { shareId: string; todoId: string }) => {
      await getShareStrategy().revoke(shareId)
      return shareId
    },
    onSuccess: (_, { shareId, todoId }) => {
      removeSharedId(todoId)
      queryClient.setQueryData(['share', 'active', todoId], null)
      void queryClient.invalidateQueries({ queryKey: ['share', 'active', todoId] })
      void queryClient.invalidateQueries({ queryKey: ['share', 'active-list'] })
      queryClient.removeQueries({ queryKey: ['share', 'status', shareId] })
    },
  })

  const handleRevoke = (entry: MonitorEntry) => {
    setConfirmingId(entry.share.id)
  }

  const confirmRevoke = (entry: MonitorEntry) => {
    revokeMutation.mutate({ shareId: entry.share.id, todoId: entry.todo.id })
    setConfirmingId(null)
  }

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 12,
          width: '100%',
        }}
      >
        {entries.map((entry) => (
          <ShareMonitorTile
            key={entry.share.id}
            todo={entry.todo}
            share={entry.share}
            isRevoking={
              revokeMutation.isPending &&
              revokeMutation.variables.shareId === entry.share.id
            }
            onRevoke={() => handleRevoke(entry)}
            onEdit={onSelectTodo}
          />
        ))}
      </div>
      {confirmingId && (
        <RevokeConfirmDialog
          entry={entries.find((e) => e.share.id === confirmingId)!}
          onConfirm={confirmRevoke}
          onCancel={() => setConfirmingId(null)}
        />
      )}
    </>
  )
}

interface RevokeConfirmDialogProps {
  entry: MonitorEntry
  onConfirm: (entry: MonitorEntry) => void
  onCancel: () => void
}

function RevokeConfirmDialog({
  entry,
  onConfirm,
  onCancel,
}: RevokeConfirmDialogProps) {
  return (
    <div
      role="dialog"
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--rf-bg-2)',
          border: '1px solid var(--rf-border)',
          borderRadius: 4,
          padding: 24,
          maxWidth: 360,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <p
          className="font-mono uppercase tracking-[0.18em]"
          style={{ fontSize: 10, color: '#ff5f57' }}
        >
          [ revoke share ]
        </p>
        <p
          className="font-mono"
          style={{ fontSize: 11, color: 'var(--rf-text)' }}
        >
          this will permanently delete the public link for{' '}
          <span style={{ color: 'var(--rf-text)' }}>
            {entry.todo.title.trim() || 'untitled'}
          </span>
          .
        </p>
        <p
          className="font-mono break-all"
          style={{ fontSize: 9, color: 'var(--rf-text-dim)' }}
        >
          {entry.share.url}
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            className="font-mono uppercase tracking-[0.18em]"
            style={{
              fontSize: 10,
              padding: '6px 12px',
              border: '1px solid var(--rf-border)',
              background: 'transparent',
              color: 'var(--rf-text-dim)',
              cursor: 'pointer',
            }}
          >
            [ cancel ]
          </button>
          <button
            type="button"
            onClick={() => onConfirm(entry)}
            className="font-mono uppercase tracking-[0.18em]"
            style={{
              fontSize: 10,
              padding: '6px 12px',
              border: '1px solid #ff5f57',
              background: 'rgba(255,95,87,0.08)',
              color: '#ff5f57',
              cursor: 'pointer',
            }}
          >
            [ revoke ]
          </button>
        </div>
      </div>
    </div>
  )
}
