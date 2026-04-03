export function BufferGuide() {
  return (
    <div
      className="flex-shrink-0 select-none"
      style={{
        width: 220,
        borderRight: '1px solid var(--rf-border)',
        padding: '0.2rem 12px',
        fontFamily: '"Space Mono", ui-monospace, monospace',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      {/* Hint */}
      <div
        style={{
          fontSize: 8,
          letterSpacing: '0.18em',
          color: 'var(--rf-cyan)',
          opacity: 0.6,
          marginBottom: 2,
        }}
      >
        GUIDE
      </div>

      {[
        { text: 'title', color: 'var(--rf-text)', op: 0.4 },
        { text: 'title!  → high priority', color: 'var(--rf-danger, #ff3030)', op: 0.35 },
        { text: 'title?  → low priority', color: 'var(--rf-amber, #ffb800)', op: 0.35 },
        { text: '- item → subtask', color: 'var(--rf-cyan)', op: 0.4 },
        { text: '- [x] done subtask', color: 'var(--rf-cyan)', op: 0.35 },
      ].map((l) => (
        <div
          key={l.text}
          style={{
            fontSize: 9,
            letterSpacing: '0.04em',
            lineHeight: 1.6,
            color: l.color,
            opacity: l.op,
            whiteSpace: 'pre',
          }}
        >
          {l.text}
        </div>
      ))}

      {/* AI hint */}
      <div
        style={{
          fontSize: 8,
          letterSpacing: '0.1em',
          color: 'var(--rf-text-dim)',
          opacity: 0.2,
          marginTop: 'auto',
          lineHeight: 1.5,
        }}
      >
        AI auto-fixes after 3s
      </div>
    </div>
  )
}
