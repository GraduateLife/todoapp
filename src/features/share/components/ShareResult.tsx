interface ShareResultProps {
  status: 'idle' | 'sharing' | 'shared' | 'error'
  url: string | null
  error: string | null
  urlCopied: boolean
  onCopyUrl: () => void
}

export function ShareResult({
  status,
  url,
  error,
  urlCopied,
  onCopyUrl,
}: ShareResultProps) {
  if (status === 'shared' && url) {
    return (
      <div
        className="rounded-[2px] flex flex-col gap-2"
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
        <input
          type="text"
          readOnly
          value={url}
          className="font-mono text-[10px] bg-transparent outline-none"
          style={{ color: '#d8ecf5', border: 'none' }}
          onFocus={(e) => e.target.select()}
        />
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
