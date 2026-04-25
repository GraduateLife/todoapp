import type { ExportFormat } from '#/features/todo/export/templates'

interface ShareActionsProps {
  format: ExportFormat
  copyStatus: 'idle' | 'copied'
  shareStatus: 'idle' | 'sharing' | 'shared' | 'error'
  hasActiveShare: boolean
  isRevoking: boolean
  onCopy: () => void
  onDownload: () => void
  onShare: () => void
  onUnshare: () => void
}

export function ShareActions({
  format,
  copyStatus,
  shareStatus,
  hasActiveShare,
  isRevoking,
  onCopy,
  onDownload,
  onShare,
  onUnshare,
}: ShareActionsProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        className="rf-btn"
        onClick={onCopy}
        style={{
          color: 'var(--rf-text)',
          borderColor: 'rgba(200,224,244,0.25)',
          background: 'rgba(200,224,244,0.03)',
        }}
      >
        {copyStatus === 'copied' ? '[ copied ]' : `[ copy ${format} ]`}
      </button>
      <button
        type="button"
        className="rf-btn"
        onClick={onDownload}
        style={{
          borderColor: '#ffb800',
          color: '#ffb800',
          background: 'rgba(255,184,0,0.06)',
        }}
      >
        [ download ]
      </button>
      <button
        type="button"
        className="rf-btn"
        onClick={hasActiveShare ? onUnshare : onShare}
        disabled={shareStatus === 'sharing' || isRevoking}
        style={{
          borderColor: hasActiveShare ? '#ff2d78' : '#00f5ff',
          color: hasActiveShare ? '#ff2d78' : '#00f5ff',
          background:
            shareStatus === 'sharing' || isRevoking
              ? hasActiveShare
                ? 'rgba(255,45,120,0.05)'
                : 'rgba(0,245,255,0.04)'
              : hasActiveShare
                ? 'rgba(255,45,120,0.12)'
                : 'rgba(0,245,255,0.12)',
          opacity: shareStatus === 'sharing' || isRevoking ? 0.5 : 1,
          boxShadow:
            shareStatus === 'sharing' || isRevoking
              ? 'none'
              : hasActiveShare
                ? '0 0 18px rgba(255,45,120,0.16)'
                : '0 0 18px rgba(0,245,255,0.14)',
        }}
      >
        {isRevoking
          ? '[ unsharing... ]'
          : shareStatus === 'sharing'
          ? '[ publishing... ]'
          : hasActiveShare
            ? '[ unshare ]'
            : shareStatus === 'shared'
              ? '[ publish again ]'
            : '[ publish share ]'}
      </button>
    </div>
  )
}
