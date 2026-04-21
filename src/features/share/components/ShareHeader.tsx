import type { ExportFormat } from '#/features/todo/export/templates'

interface ShareHeaderProps {
  title: string
  format: ExportFormat
  onBack: () => void
}

export function ShareHeader({ title, format, onBack }: ShareHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-4 pb-3">
      <div className="min-w-0">
        <p
          className="font-mono text-[9px] tracking-[0.22em] uppercase mb-1"
          style={{ color: '#ffb800', opacity: 0.6 }}
        >
          export
        </p>
        <p
          className="font-mono text-[0.85rem] truncate"
          style={{ color: 'var(--rf-text)' }}
        >
          {title || 'Untitled'}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span
          className="font-mono text-[9px] tracking-[0.18em] uppercase px-2 py-1 rounded-[2px]"
          style={{
            color: '#ffb800',
            border: '1px solid rgba(255,184,0,0.3)',
            background: 'rgba(255,184,0,0.05)',
          }}
        >
          .{format}
        </span>
        <button type="button" className="rf-btn" onClick={onBack}>
          [ back ]
        </button>
      </div>
    </div>
  )
}
