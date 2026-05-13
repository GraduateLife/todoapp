import type { Todo } from '#/features/todo/types'
import type { ShareResult } from '#/lib/share'
import { CrtScreen } from './CrtScreen'
import { MacTrafficLights } from './MacTrafficLights'
import { useShareStatus } from '../hooks/useShareStatusBatch'

interface ShareMonitorTileProps {
  todo: Todo
  share: ShareResult
  onRevoke: (shareId: string) => void
  onEdit: (todoId: string) => void
  isRevoking: boolean
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(2)
  return `${mm}/${dd}/${yy}`
}

function shortId(id: string): string {
  if (id.length <= 10) return id
  return id.slice(0, 10)
}

function channelNumber(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) | 0
  return String((Math.abs(h) % 99) + 1).padStart(2, '0')
}

export function ShareMonitorTile({
  todo,
  share,
  onRevoke,
  onEdit,
  isRevoking,
}: ShareMonitorTileProps) {
  const { ref, query } = useShareStatus(share.id)

  return (
    <div
      ref={ref}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 180,
        padding: 8,
        background: 'var(--rf-bg-2)',
        border: '1px solid var(--rf-border)',
        borderRadius: 4,
        gap: 6,
      }}
    >
      {/* Top chrome bar: traffic lights + channel id */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 14,
        }}
      >
        <MacTrafficLights
          onRevoke={() => onRevoke(share.id)}
          onEdit={() => onEdit(todo.id)}
          onOpen={() => window.open(share.url, '_blank', 'noopener')}
          isRevoking={isRevoking}
        />
        <span
          className="font-mono uppercase"
          style={{
            fontSize: 8,
            letterSpacing: '0.18em',
            color: 'var(--rf-text-dim)',
          }}
        >
          ch-{channelNumber(share.id)}
        </span>
      </div>

      {/* CRT screen */}
      <CrtScreen
        status={query.data?.status ?? null}
        loading={query.isFetching && !query.data}
        error={query.data?.error ?? null}
      />

      {/* Bottom status bar: id · format · date */}
      <div
        className="font-mono uppercase"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
          fontSize: 8,
          letterSpacing: '0.14em',
          color: 'var(--rf-text-dim)',
          minHeight: 12,
        }}
      >
        <span style={{ color: 'var(--rf-text)' }}>
          {todo.title.trim() || 'untitled'}
        </span>
        <span style={{ whiteSpace: 'nowrap' }}>
          {shortId(share.id)} · {formatDate(share.createdAt)}
        </span>
      </div>
    </div>
  )
}
