import { useRef } from 'react'
import type { LineToken } from '../../utils/parseMarkdownInput'
import { TOKEN_STYLE, TA_LINE_H, TA_PAD_TOP, LABEL_W, TITLE_MAX_LEN } from './constants'

interface BufferEditorProps {
  value: string
  onChange: (value: string) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  tokens: LineToken[] | undefined
}

export function BufferEditor({ value, onChange, onKeyDown, tokens }: BufferEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const mirrorRef = useRef<HTMLDivElement>(null)

  const handleScroll = () => {
    const top = textareaRef.current?.scrollTop ?? 0
    if (overlayRef.current) overlayRef.current.scrollTop = top
    if (mirrorRef.current) mirrorRef.current.scrollTop = top
  }

  const lines = value.split('\n')

  return (
    <div
      style={{
        flex: 1,
        padding: '0.2rem 0 0 0.25rem',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="flex gap-0 items-start" style={{ flex: 1 }}>
        <span className="rf-input-prompt" aria-hidden="true" style={{ paddingTop: TA_PAD_TOP }}>
          &gt;_
        </span>

        {/* Relative wrapper — all layers anchor here */}
        <div className="relative flex-1" style={{ minWidth: 0 }}>
          {/* ── Layer 1: text mirror (colored per-line text) ───── */}
          <div
            ref={mirrorRef}
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              overflow: 'hidden',
              pointerEvents: 'none',
              fontFamily: '"Space Mono", ui-monospace, monospace',
              fontSize: '0.88rem',
              lineHeight: TA_LINE_H,
              paddingTop: TA_PAD_TOP,
              paddingRight: LABEL_W,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              zIndex: 1,
            }}
          >
            {lines.map((line, idx) => {
              const tok = tokens?.[idx]
              const color = tok
                ? TOKEN_STYLE[tok.kind].color
                : 'var(--rf-text)'
              return (
                <span key={idx} style={{ color }}>
                  {line || ''}
                  {idx < lines.length - 1 ? '\n' : ''}
                </span>
              )
            })}
          </div>

          {/* ── Layer 2: wash + wavy underline + right-side labels ── */}
          {tokens && (
            <div
              ref={overlayRef}
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                overflow: 'hidden',
                pointerEvents: 'none',
                paddingTop: TA_PAD_TOP,
                lineHeight: TA_LINE_H,
                fontSize: '0.88rem',
                zIndex: 2,
              }}
            >
              {lines.map((_, idx) => {
                const tok = tokens[idx]
                if (!tok || tok.kind === 'empty') {
                  return (
                    <div
                      key={idx}
                      style={{ height: `${TA_LINE_H}em` }}
                    />
                  )
                }
                const s = TOKEN_STYLE[tok.kind]
                // For title tokens, show priority suffix in the label
                let label = s.label
                let labelColor = s.color
                if (tok.kind === 'title' && tok.priority !== 'normal') {
                  label = tok.priority === 'high' ? 'TITLE !' : 'TITLE ?'
                  labelColor = tok.priority === 'high'
                    ? 'var(--rf-danger, #ff3030)'
                    : 'var(--rf-amber, #ffb800)'
                }
                return (
                  <div
                    key={idx}
                    className={s.wavy ?? ''}
                    style={{
                      height: `${TA_LINE_H}em`,
                      background: s.bg ?? 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      paddingRight: 'calc(0.4rem + 6px)',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: 7,
                        letterSpacing: '0.1em',
                        color: labelColor,
                        opacity: 0.8,
                      }}
                    >
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Layer 3: textarea — fixed height, rf-scrollbar ─── */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              const changedLines = e.target.value.split('\n')
              changedLines[0] = changedLines[0].slice(0, TITLE_MAX_LEN)
              onChange(changedLines.join('\n'))
            }}
            onKeyDown={onKeyDown}
            onScroll={handleScroll}
            placeholder={`Buy groceries!\n- apple\n- milk\n- bread`}
            className="rf-input-field rf-scrollbar w-full resize-none"
            style={{
              position: 'relative',
              zIndex: 3,
              height: 200,
              lineHeight: TA_LINE_H,
              paddingTop: TA_PAD_TOP,
              paddingRight: LABEL_W,
              background: 'transparent',
              color: 'transparent',
              caretColor: 'var(--rf-text)',
              overflowY: 'auto',
            }}
            aria-label="New todo (buffer mode)"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  )
}
