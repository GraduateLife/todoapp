import { COLOR_OPTIONS } from '../../constants/noteColors'

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
        gap: 8,
      }}
    >
      {/* Left col: SYNTAX */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 8,
            letterSpacing: '0.18em',
            color: 'var(--rf-cyan)',
            opacity: 0.6,
            marginBottom: 3,
          }}
        >
          SYNTAX
        </div>
        {[
          { text: 'title', color: 'var(--rf-text)', op: 0.45 },
          { text: '- undone', color: 'var(--rf-cyan)', op: 0.45 },
          { text: '- [] undone', color: 'var(--rf-cyan)', op: 0.35 },
          { text: '- [x] done', color: 'var(--rf-cyan)', op: 0.45 },
        ].map((l) => (
          <div
            key={l.text}
            style={{
              fontSize: 9,
              letterSpacing: '0.04em',
              lineHeight: 1.75,
              color: l.color,
              opacity: l.op,
              whiteSpace: 'pre',
            }}
          >
            {l.text}
          </div>
        ))}
      </div>

      {/* Right col: PRIORITY + COLOR */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 8,
            letterSpacing: '0.18em',
            color: 'var(--rf-purple)',
            opacity: 0.6,
            marginBottom: 3,
          }}
        >
          PRIORITY
        </div>
        {[
          { text: '[!+] high', color: 'var(--rf-purple)', op: 0.75 },
          { text: '[!]  normal', color: 'var(--rf-purple)', op: 0.5 },
          { text: '[!-] low', color: 'var(--rf-purple)', op: 0.35 },
        ].map((l) => (
          <div
            key={l.text}
            style={{
              fontSize: 9,
              letterSpacing: '0.04em',
              lineHeight: 1.75,
              color: l.color,
              opacity: l.op,
              whiteSpace: 'pre',
            }}
          >
            {l.text}
          </div>
        ))}

        <div
          style={{
            fontSize: 8,
            letterSpacing: '0.18em',
            color: 'var(--rf-amber)',
            opacity: 0.6,
            marginTop: 6,
            marginBottom: 3,
          }}
        >
          COLOR
        </div>
        {COLOR_OPTIONS.filter((o) => o.key !== 'random').map((opt) => (
          <div
            key={opt.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              lineHeight: 1.75,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: 1,
                background: opt.hex,
                display: 'block',
                flexShrink: 0,
                opacity: 0.85,
              }}
            />
            <span
              style={{
                fontSize: 9,
                letterSpacing: '0.04em',
                color: opt.hex,
                opacity: 0.65,
                fontFamily: 'inherit',
              }}
            >
              [{opt.key}]
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
