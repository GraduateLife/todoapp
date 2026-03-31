interface DragHandleProps {
  isExpanded: boolean
  onPointerDown: (e: React.PointerEvent) => void
}

export function DragHandle({ isExpanded, onPointerDown }: DragHandleProps) {
  return (
    <div
      className="flex items-center justify-center w-full select-none"
      style={{
        height: 20,
        borderBottom: '1px solid var(--rf-border)',
        cursor: isExpanded ? 's-resize' : 'n-resize',
      }}
      onPointerDown={onPointerDown}
    >
      <span
        className="font-mono px-4 flex items-center gap-2"
        style={{
          color: 'var(--rf-text-dim)',
          opacity: 0.8,
          fontSize: 9,
          letterSpacing: '0.18em',
        }}
      >
        {isExpanded ? (
          <>
            <span style={{ color: 'var(--rf-cyan)', opacity: 0.85 }}>
              BUFFER MODE
            </span>
            <span style={{ opacity: 0.35 }}>·</span>
            <span>↓ drag or Ctrl+S to entry mode</span>
          </>
        ) : (
          <>
            <span style={{ color: 'var(--rf-cyan)', opacity: 0.85 }}>
              ENTRY MODE
            </span>
            <span style={{ opacity: 0.35 }}>·</span>
            <span>↑ drag or Ctrl+W to buffer mode</span>
          </>
        )}
      </span>
    </div>
  )
}
