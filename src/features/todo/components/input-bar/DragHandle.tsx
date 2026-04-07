interface DragHandleProps {
  isExpanded: boolean
  onPointerDown: (e: React.PointerEvent) => void
  onToggle: () => void
  autoFix?: boolean
  onToggleAutoFix?: () => void
  aiSuggest?: boolean
  onToggleAiSuggest?: () => void
}

export function DragHandle({
  isExpanded,
  onPointerDown,
  onToggle,
  autoFix,
  onToggleAutoFix,
  aiSuggest,
  onToggleAiSuggest,
}: DragHandleProps) {
  if (!isExpanded) {
    // Collapsed: just a small clickable button at the bottom of the screen
    return (
      <div
        className="flex items-center justify-center w-full select-none"
        style={{ height: 28 }}
        onPointerDown={onPointerDown}
      >
        <button
          type="button"
          onClick={onToggle}
          className="font-mono"
          style={{
            background: 'transparent',
            border: '1px solid var(--rf-border)',
            borderRadius: 3,
            color: 'var(--rf-text-dim)',
            opacity: 0.45,
            fontSize: 9,
            letterSpacing: '0.15em',
            padding: '3px 12px',
            cursor: 'pointer',
            transition: 'opacity 0.15s, border-color 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.85'
            e.currentTarget.style.borderColor = 'var(--rf-cyan)'
            e.currentTarget.style.color = 'var(--rf-cyan)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.45'
            e.currentTarget.style.borderColor = 'var(--rf-border)'
            e.currentTarget.style.color = 'var(--rf-text-dim)'
          }}
        >
          [ + terminal ]
        </button>
      </div>
    )
  }

  // Expanded: left label + AI toggle + spacer + close button
  return (
    <div
      className="flex items-center w-full select-none"
      style={{
        height: 20,
        borderBottom: '1px solid var(--rf-border)',
        cursor: 's-resize',
      }}
      onPointerDown={onPointerDown}
    >
      {/* Left: label */}
      <span
        className="font-mono"
        style={{
          color: 'var(--rf-cyan)',
          opacity: 0.85,
          fontSize: 9,
          letterSpacing: '0.18em',
          paddingLeft: 12,
          pointerEvents: 'none',
        }}
      >
        TERMINAL
      </span>

      {/* Auto-fix toggle */}
      {onToggleAutoFix && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleAutoFix()
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="font-mono"
          title={autoFix ? 'Disable auto-fix' : 'Enable auto-fix'}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: 8,
            letterSpacing: '0.12em',
            cursor: 'pointer',
            padding: '0 8px',
            lineHeight: '20px',
            transition: 'opacity 0.15s, color 0.15s',
            color: autoFix ? 'var(--rf-cyan)' : 'var(--rf-text-dim)',
            opacity: autoFix ? 0.7 : 0.25,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = autoFix ? '0.7' : '0.25' }}
        >
          {autoFix ? 'FIX ✓' : 'FIX ✗'}
        </button>
      )}

      {/* AI suggest toggle */}
      {onToggleAiSuggest && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleAiSuggest()
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="font-mono"
          title={aiSuggest ? 'Disable AI suggestions' : 'Enable AI suggestions'}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: 8,
            letterSpacing: '0.12em',
            cursor: 'pointer',
            padding: '0 8px',
            lineHeight: '20px',
            transition: 'opacity 0.15s, color 0.15s',
            color: aiSuggest ? 'var(--rf-cyan)' : 'var(--rf-text-dim)',
            opacity: aiSuggest ? 0.7 : 0.25,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = aiSuggest ? '0.7' : '0.25' }}
        >
          {aiSuggest ? 'SUG ✓' : 'SUG ✗'}
        </button>
      )}

      {/* Center: spacer (draggable) */}
      <div style={{ flex: 1 }} />

      {/* Right: close button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        className="font-mono"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--rf-text-dim)',
          opacity: 0.35,
          fontSize: 10,
          cursor: 'pointer',
          padding: '0 12px',
          lineHeight: '20px',
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85' }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.35' }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        ✕
      </button>
    </div>
  )
}
