import type { UseQueryResult } from '@tanstack/react-query'
import { SHARE_PROXY_BASE_URL } from '#/lib/share'
import type { ShareAttempt } from '../hooks/useShareState'
import type { ShareHealthStatus } from '#/lib/share'

interface ShareDiagnosticsProps {
  lastAttempt: ShareAttempt | null
  health: UseQueryResult<ShareHealthStatus, Error>
}

function formatClock(timestamp: number | null): string {
  if (!timestamp) return '--'
  return new Date(timestamp).toLocaleTimeString()
}

export function ShareDiagnostics({
  lastAttempt,
  health,
}: ShareDiagnosticsProps) {
  const healthData = health.data ?? null
  const probing = health.isFetching

  return (
    <div
      className="rounded-[2px] flex flex-col gap-1.5 relative"
      style={{
        padding: '10px 12px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(200,224,244,0.12)',
      }}
    >
      <p
        className="font-mono text-[9px] tracking-[0.16em] uppercase"
        style={{ color: '#80d4e8', opacity: 0.75 }}
      >
        share diagnostics
      </p>
      <p
        className="font-mono text-[10px]"
        style={{ color: 'var(--rf-text-dim)' }}
      >
        bff: {`${SHARE_PROXY_BASE_URL}/share`}
      </p>
      <p
        className="font-mono text-[10px]"
        style={{ color: 'var(--rf-text-dim)' }}
      >
        health:{' '}
        {probing
          ? 'probing...'
          : healthData?.ok
            ? `ok (${healthData.status ?? 'n/a'})`
            : `down${healthData?.status ? ` (${healthData.status})` : ''}`}
      </p>
      <p
        className="font-mono text-[10px]"
        style={{ color: 'var(--rf-text-dim)' }}
      >
        checked: {formatClock(healthData?.checkedAt ?? null)}
      </p>
      <p
        className="font-mono text-[10px]"
        style={{ color: 'var(--rf-text-dim)' }}
      >
        upstream: {healthData?.target ?? '(unknown)'}
      </p>
      {(healthData?.error ?? health.error?.message) && (
        <p className="font-mono text-[10px]" style={{ color: '#ff9090' }}>
          health error: {healthData?.error ?? health.error?.message}
        </p>
      )}
      {lastAttempt && (
        <>
          <p
            className="font-mono text-[10px]"
            style={{ color: 'var(--rf-text-dim)' }}
          >
            last publish: {lastAttempt.outcome}
            {lastAttempt.statusCode ? ` · ${lastAttempt.statusCode}` : ''}
          </p>
          <p
            className="font-mono text-[10px]"
            style={{ color: 'var(--rf-text-dim)' }}
          >
            started: {formatClock(lastAttempt.startedAt)}
            {lastAttempt.durationMs !== null
              ? ` · ${lastAttempt.durationMs}ms`
              : ''}
          </p>
          <p
            className="font-mono text-[10px]"
            style={{ color: 'var(--rf-text-dim)' }}
          >
            format: {lastAttempt.format}
          </p>
          {lastAttempt.shareUrl && (
            <p
              className="font-mono text-[10px] break-all"
              style={{ color: '#80d4e8' }}
            >
              url: {lastAttempt.shareUrl}
            </p>
          )}
          {lastAttempt.error && (
            <p className="font-mono text-[10px]" style={{ color: '#ff9090' }}>
              error: {lastAttempt.error}
            </p>
          )}
        </>
      )}
    </div>
  )
}
