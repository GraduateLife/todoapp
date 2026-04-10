import { useRef, useState, useCallback } from 'react'
import type { LineToken } from '../../utils/parseMarkdownInput'
import { TOKEN_STYLE, TA_LINE_H, TA_PAD_TOP, LABEL_W, TITLE_MAX_LEN } from './constants'

interface BufferEditorProps {
  value: string
  onChange: (value: string) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  tokens: LineToken[] | undefined
  suggestion?: string | null
  suggestLineIdx?: number
  onDropFiles?: (files: File[]) => void
  onCompositionStart?: () => void
  onCompositionEnd?: () => void
}

export function BufferEditor({ value, onChange, onKeyDown, tokens, suggestion, suggestLineIdx, onDropFiles, onCompositionStart, onCompositionEnd }: BufferEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const mirrorRef = useRef<HTMLDivElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const dragCounterRef = useRef(0)

  const handleScroll = () => {
    const top = textareaRef.current?.scrollTop ?? 0
    if (overlayRef.current) overlayRef.current.scrollTop = top
    if (mirrorRef.current) mirrorRef.current.scrollTop = top
  }

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current++
    if (e.dataTransfer.types.includes('Files')) setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) setIsDragOver(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current = 0
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0 && onDropFiles) onDropFiles(files)
  }, [onDropFiles])

  const lines = value.split('\n')

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{
        flex: 1,
        padding: '0.2rem 0 0 0.25rem',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Drop overlay */}
      {isDragOver && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            background: 'rgba(0,245,255,0.06)',
            border: '2px dashed var(--rf-cyan)',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <span
            className="font-mono"
            style={{
              fontSize: 11,
              letterSpacing: '0.15em',
              color: 'var(--rf-cyan)',
              opacity: 0.7,
            }}
          >
            drop files here
          </span>
        </div>
      )}
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
              const showGhost = suggestion && idx === suggestLineIdx
              return (
                <span key={idx} style={{ color }}>
                  {line || ''}
                  {showGhost && (
                    <span
                      style={{
                        color: 'var(--rf-text-dim)',
                        opacity: 0.5,
                        fontStyle: 'italic',
                      }}
                    >
                      {line.trim() ? ' ' : '- '}{suggestion}
                    </span>
                  )}
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
                // For title tokens, show priority mark in the label and color
                // it with the matching priority hue.
                let label = s.label
                let labelColor = s.color
                if (tok.kind === 'title' && tok.priority !== 'normal') {
                  const markMap = {
                    high: { mark: '!', hex: '#ff2d78' }, // pink
                    low:  { mark: '?', hex: '#39ff14' }, // green
                    idea: { mark: '~', hex: '#bf5fff' }, // purple
                    // `normal` is filtered out above; `system` is unreachable
                    // from user input so we never see it here.
                    normal: { mark: '', hex: s.color },
                    system: { mark: '', hex: s.color },
                  } as const
                  const m = markMap[tok.priority]
                  label = `TITLE ${m.mark}`
                  labelColor = m.hex
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
            onCompositionStart={onCompositionStart}
            onCompositionEnd={onCompositionEnd}
          />
        </div>
      </div>
    </div>
  )
}
