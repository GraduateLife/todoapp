interface CrtScreenProps {
  status: number | null
  loading: boolean
  error: string | null
}

function statusColor(status: number | null): string {
  if (status === null) return '#febc2e'
  if (status >= 200 && status < 300) return '#39ff14'
  if (status >= 300 && status < 400) return '#febc2e'
  return '#ff5f57'
}

function statusLabel(status: number | null, loading: boolean): string {
  if (loading) return '...'
  if (status === null) return '??'
  return String(status)
}

/**
 * Black "CRT screen" panel: scanlines + barrel/fisheye distortion on the
 * background only. The status code label sits on a flat overlay so small text
 * stays sharp.
 */
export function CrtScreen({ status, loading, error }: CrtScreenProps) {
  const color = statusColor(status)
  return (
    <div
      style={{
        position: 'relative',
        flex: 1,
        background: '#05060a',
        borderRadius: '40% / 22%',
        overflow: 'hidden',
        boxShadow:
          'inset 0 0 12px rgba(0,0,0,0.8), inset 0 0 32px rgba(0,0,0,0.6)',
      }}
    >
      {/* Scanlines */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.04) 2px, rgba(255,255,255,0.04) 3px)',
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}
      />
      {/* Vignette */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.7) 100%)',
          pointerEvents: 'none',
        }}
      />
      {/* Status code (flat, not distorted) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <span
          className="font-mono"
          style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: '0.08em',
            color,
            textShadow: `0 0 10px ${color}, 0 0 4px ${color}`,
          }}
        >
          {statusLabel(status, loading)}
        </span>
        {error && (
          <span
            className="font-mono uppercase tracking-[0.18em]"
            style={{
              fontSize: 7,
              color: '#ff9090',
              opacity: 0.7,
              padding: '0 8px',
              textAlign: 'center',
            }}
          >
            {error.length > 24 ? `${error.slice(0, 24)}…` : error}
          </span>
        )}
      </div>
    </div>
  )
}
