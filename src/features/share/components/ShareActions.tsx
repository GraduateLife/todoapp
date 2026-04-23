import type { ExportFormat } from '#/features/todo/export/templates'

interface ShareActionsProps {
  format: ExportFormat
  copyStatus: 'idle' | 'copied'
  shareStatus: 'idle' | 'sharing' | 'shared' | 'error'
  onCopy: () => void
  onDownload: () => void
  onShare: () => void
}

export function ShareActions({
  format,
  copyStatus,
  shareStatus,
  onCopy,
  onDownload,
  onShare,
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
        onClick={onShare}
        disabled={shareStatus === 'sharing'}
        style={{
          borderColor: '#00f5ff',
          color: '#00f5ff',
          background:
            shareStatus === 'sharing'
              ? 'rgba(0,245,255,0.04)'
              : 'rgba(0,245,255,0.12)',
          opacity: shareStatus === 'sharing' ? 0.5 : 1,
          boxShadow:
            shareStatus === 'sharing'
              ? 'none'
              : '0 0 18px rgba(0,245,255,0.14)',
        }}
      >
        {shareStatus === 'sharing'
          ? '[ publishing... ]'
          : shareStatus === 'shared'
            ? '[ publish again ]'
            : '[ publish share ]'}
      </button>
    </div>
  )
}
