// Color hexes are inlined (rather than imported from NOTE_STYLES) to keep this
// legend theme-agnostic — it always shows the dark-theme accent hues so the
// guide's visual identity stays consistent regardless of board theme.
const PRIORITY_SWATCHES = [
  { mark: 'title',   label: 'normal',      hex: '#ffb800' }, // amber — no mark implies normal
  { mark: 'title!',  label: 'high',        hex: '#ff2d78' }, // pink
  { mark: 'title?',  label: 'low',         hex: '#39ff14' }, // green
  { mark: 'title~',  label: 'inspiration', hex: '#bf5fff' }, // purple
] as const

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

      {PRIORITY_SWATCHES.map((s) => (
        <div
          key={s.mark}
          style={{
            fontSize: 9,
            letterSpacing: '0.04em',
            lineHeight: 1.6,
            color: s.hex,
            opacity: 0.75,
            whiteSpace: 'pre',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: 5,
              height: 5,
              borderRadius: 1,
              backgroundColor: s.hex,
              boxShadow: `0 0 3px 0.5px ${s.hex}`,
              flexShrink: 0,
            }}
          />
          <span>{s.mark}</span>
          <span style={{ opacity: 0.55 }}>→ {s.label}</span>
        </div>
      ))}

      {/* subtask syntax */}
      <div
        style={{
          fontSize: 9,
          letterSpacing: '0.04em',
          lineHeight: 1.6,
          color: 'var(--rf-cyan)',
          opacity: 0.55,
          whiteSpace: 'pre',
          marginTop: 4,
        }}
      >
        - item → subtask
      </div>
      <div
        style={{
          fontSize: 9,
          letterSpacing: '0.04em',
          lineHeight: 1.6,
          color: 'var(--rf-cyan)',
          opacity: 0.45,
          whiteSpace: 'pre',
        }}
      >
        - [x] done subtask
      </div>

      {/* hints */}
      <div
        style={{
          fontSize: 8,
          letterSpacing: '0.1em',
          color: 'var(--rf-text-dim)',
          opacity: 0.45,
          marginTop: 'auto',
          lineHeight: 1.9,
        }}
      >
        <div>drag file to attach</div>
        <div>[ + file ] to browse</div>
        <div>tab → accept suggestion</div>
        <div>auto-fix subtask syntax</div>
      </div>
    </div>
  )
}
