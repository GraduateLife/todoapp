interface ShareResultProps {
  status: 'idle' | 'sharing' | 'shared' | 'error'
  url: string | null
  recentUrl: string | null
  recentSharedAt: number | null
  error: string | null
  urlCopied: boolean
  onCopyUrl: () => void
}

export function ShareResult({
  status,
  url,
  recentUrl,
  recentSharedAt,
  error,
  urlCopied,
  onCopyUrl,
}: ShareResultProps) {
  if (status === 'shared' && url) {
    return (
      <div
        className="rounded-[2px] flex flex-col gap-2 relative"
        style={{
          padding: '10px 12px',
          background: 'rgba(0,245,255,0.04)',
          border: '1px solid rgba(0,245,255,0.2)',
        }}
      >
        <span
          className="font-mono text-[9px] tracking-[0.15em] uppercase"
          style={{ color: '#00f5ff', opacity: 0.6 }}
        >
          shared
        </span>
        <div className="flex flex-col gap-1">
          <span
            className="font-mono text-[9px] tracking-[0.12em] uppercase"
            style={{ color: 'var(--rf-text-dim)' }}
          >
            current url
          </span>
          <input
            type="text"
            readOnly
            value={url}
            className="font-mono text-[10px] bg-transparent outline-none"
            style={{ color: '#d8ecf5', border: 'none' }}
            onFocus={(e) => e.target.select()}
          />
        </div>
        {recentUrl && (
          <div className="flex flex-col gap-1">
            <span
              className="font-mono text-[9px] tracking-[0.12em] uppercase"
              style={{ color: 'var(--rf-text-dim)' }}
            >
              recent url
              {recentSharedAt
                ? ` · ${new Date(recentSharedAt).toLocaleTimeString()}`
                : ''}
            </span>
            <input
              type="text"
              readOnly
              value={recentUrl}
              className="font-mono text-[10px] bg-transparent outline-none"
              style={{ color: '#9be7f4', border: 'none', opacity: 0.9 }}
              onFocus={(e) => e.target.select()}
            />
          </div>
        )}
        <div className="flex gap-1.5">
          <button
            type="button"
            className="rf-btn flex-1"
            onClick={onCopyUrl}
            style={{
              borderColor: '#00f5ff',
              color: '#00f5ff',
              background: 'rgba(0,245,255,0.06)',
            }}
          >
            {urlCopied ? '[ copied ]' : '[ copy ]'}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="rf-btn flex-1 text-center"
            style={{
              borderColor: '#00f5ff',
              color: '#00f5ff',
              background: 'rgba(0,245,255,0.06)',
              textDecoration: 'none',
            }}
          >
            [ open ]
          </a>
        </div>
      </div>
    )
  }

  if (status === 'idle' && recentUrl) {
    return (
      <div
        className="rounded-[2px] flex flex-col gap-2 relative"
        style={{
          padding: '10px 12px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(200,224,244,0.12)',
        }}
      >
        <span
          className="font-mono text-[9px] tracking-[0.15em] uppercase"
          style={{ color: '#80d4e8', opacity: 0.7 }}
        >
          recent share
        </span>
        <input
          type="text"
          readOnly
          value={recentUrl}
          className="font-mono text-[10px] bg-transparent outline-none"
          style={{ color: '#9be7f4', border: 'none' }}
          onFocus={(e) => e.target.select()}
        />
        {recentSharedAt && (
          <p
            className="font-mono text-[9px] tracking-[0.12em] uppercase"
            style={{ color: 'var(--rf-text-dim)' }}
          >
            shared at {new Date(recentSharedAt).toLocaleTimeString()}
          </p>
        )}
        <div className="flex gap-1.5">
          <button
            type="button"
            className="rf-btn flex-1"
            onClick={onCopyUrl}
            style={{
              borderColor: '#00f5ff',
              color: '#00f5ff',
              background: 'rgba(0,245,255,0.06)',
            }}
          >
            {urlCopied ? '[ copied ]' : '[ copy recent ]'}
          </button>
          <a
            href={recentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rf-btn flex-1 text-center"
            style={{
              borderColor: '#00f5ff',
              color: '#00f5ff',
              background: 'rgba(0,245,255,0.06)',
              textDecoration: 'none',
            }}
          >
            [ open recent ]
          </a>
        </div>
      </div>
    )
  }

  if (status === 'error' && error) {
    return (
      <div
        className="rounded-[2px]"
        style={{
          padding: '8px 12px',
          background: 'rgba(255,48,48,0.06)',
          border: '1px solid rgba(255,48,48,0.25)',
        }}
      >
        <p className="font-mono text-[10px]" style={{ color: '#ff6060' }}>
          share failed: {error}
        </p>
      </div>
    )
  }

  return null
}
