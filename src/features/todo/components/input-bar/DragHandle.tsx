interface DragHandleProps {
  isExpanded: boolean
  onPointerDown: (e: React.PointerEvent) => void
  onToggle: () => void
  aiAutoFix?: boolean
  onToggleAi?: () => void
}

export function DragHandle({
  isExpanded,
  onPointerDown,
  onToggle,
  aiAutoFix,
  onToggleAi,
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

      {/* AI toggle */}
      {onToggleAi && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleAi()
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="font-mono"
          title={aiAutoFix ? 'Disable AI auto-fix' : 'Enable AI auto-fix'}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: 8,
            letterSpacing: '0.12em',
            cursor: 'pointer',
            padding: '0 8px',
            lineHeight: '20px',
            transition: 'opacity 0.15s, color 0.15s',
            color: aiAutoFix ? 'var(--rf-cyan)' : 'var(--rf-text-dim)',
            opacity: aiAutoFix ? 0.7 : 0.25,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = aiAutoFix ? '0.7' : '0.25' }}
        >
          {aiAutoFix ? 'AI ✓' : 'AI ✗'}
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
