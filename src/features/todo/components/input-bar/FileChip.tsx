import { useState, useRef } from 'react'
import type { Attachment } from '../../types'

interface FileChipProps {
  file: Attachment
  onRemove: (id: string) => void
}

const TYPE_ICON: Record<Attachment['type'], string> = {
  image: '🖼',
  voice: '🔊',
  video: '🎬',
  file: '📄',
}

/**
 * A small chip representing an attached file.
 * Hover shows a preview popover (image thumbnail, audio player, etc.).
 */
export function FileChip({ file, onRemove }: FileChipProps) {
  const [showPreview, setShowPreview] = useState(false)
  const chipRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={chipRef}
      className="flex items-center gap-1 flex-shrink-0 font-mono"
      style={{
        fontSize: 9,
        letterSpacing: '0.04em',
        color: 'var(--rf-text-dim)',
        background: 'rgba(0,245,255,0.04)',
        border: '1px solid var(--rf-border)',
        borderRadius: 3,
        padding: '2px 6px',
        position: 'relative',
        cursor: 'default',
      }}
      onMouseEnter={() => setShowPreview(true)}
      onMouseLeave={() => setShowPreview(false)}
    >
      <span style={{ opacity: 0.5 }}>{TYPE_ICON[file.type]}</span>
      <span
        style={{
          maxWidth: 120,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {file.name}
      </span>
      <button
        type="button"
        onClick={() => onRemove(file.id)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--rf-text-dim)',
          opacity: 0.4,
          cursor: 'pointer',
          fontSize: 9,
          padding: '0 2px',
          lineHeight: 1,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.4' }}
      >
        ✕
      </button>

      {/* ── Hover preview popover ──────────────────────────── */}
      {showPreview && (
        <FilePreview file={file} />
      )}
    </div>
  )
}

function FilePreview({ file }: { file: Attachment }) {
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 'calc(100% + 6px)',
    left: 0,
    zIndex: 20,
    background: 'var(--rf-bg, #0a1628)',
    border: '1px solid var(--rf-border)',
    borderRadius: 4,
    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    pointerEvents: 'none',
  }

  if (file.type === 'image') {
    return (
      <div style={{ ...baseStyle, padding: 4 }}>
        <img
          src={file.url}
          alt={file.name}
          style={{
            maxWidth: 200,
            maxHeight: 150,
            borderRadius: 3,
            display: 'block',
          }}
        />
      </div>
    )
  }

  if (file.type === 'voice' || file.type === 'video') {
    return (
      <div
        style={{
          ...baseStyle,
          padding: '6px 10px',
          fontSize: 9,
          letterSpacing: '0.08em',
          color: 'var(--rf-text-dim)',
          opacity: 0.7,
          whiteSpace: 'nowrap',
        }}
      >
        {file.type === 'voice' ? '🔊' : '🎬'} {file.name}
      </div>
    )
  }

  // Generic file — just show name
  return (
    <div
      style={{
        ...baseStyle,
        padding: '6px 10px',
        fontSize: 9,
        letterSpacing: '0.08em',
        color: 'var(--rf-text-dim)',
        opacity: 0.7,
        whiteSpace: 'nowrap',
      }}
    >
      📄 {file.name}
    </div>
  )
}
