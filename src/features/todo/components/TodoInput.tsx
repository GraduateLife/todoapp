import { motion } from 'framer-motion'
import { useRef, useState, useEffect, type ReactNode } from 'react'
import { parseMarkdownInput, type LineToken, type ParsedTodo } from '../utils/parseMarkdownInput'

interface TodoInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onSubmitExpanded: (parsed: ParsedTodo) => void
  placeholder?: string
  attachments?: ReactNode
  isDragging?: boolean
}

// ── Token styles ──────────────────────────────────────────────────────────────
const TOKEN_STYLE: Record<
  LineToken['kind'],
  { color: string; label: string; bg?: string; wavy?: string }
> = {
  title:    { color: 'var(--rf-text)',                 label: 'TITLE'    },
  subtask:  { color: 'var(--rf-cyan)',                 label: 'SUB'      },
  priority: { color: 'var(--rf-purple, #bf5fff)',      label: 'PRI'      },
  warn:     { color: 'var(--rf-amber, #ffb800)',        label: 'SUB?',
              bg: 'rgba(255,184,0,0.05)',              wavy: 'rf-row-wavy-warn'  },
  extra:    { color: 'var(--rf-danger, #ff3030)',      label: 'CONFLICT',
              bg: 'rgba(255,48,48,0.07)',              wavy: 'rf-row-wavy-danger' },
  empty:    { color: 'transparent',                    label: ''         },
}

// These constants must stay in sync between textarea and overlay
const TA_LINE_H  = 1.7       // matches lineHeight on textarea
const TA_PAD_TOP = '0.35rem' // matches paddingTop on textarea
const LABEL_W    = '4rem'    // right gutter width for labels
const MAX_HEIGHT = 220       // ~10 lines before scrollbar appears

// Title character limit: ~25 chars/line on main card × 4 lines  (fan card clamps to 3 lines visually)
export const TITLE_MAX_LEN = 100

const HINT_TEXT =
  'title · - subtask · - [] subtask · - [x] done · [!+] high · [!-] low · [!] normal'

export function TodoInput({
  value,
  onChange,
  onSubmit,
  onSubmitExpanded,
  placeholder = 'type a task and press enter_',
  attachments,
  isDragging = false,
}: TodoInputProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const overlayRef  = useRef<HTMLDivElement>(null)
  const mirrorRef   = useRef<HTMLDivElement>(null)

  // Auto-grow with cap — below MAX_HEIGHT: no scrollbar; at MAX_HEIGHT: scrollbar
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const sh = el.scrollHeight
    el.style.height   = `${Math.min(sh, MAX_HEIGHT)}px`
    el.style.overflowY = sh > MAX_HEIGHT ? 'auto' : 'hidden'
  }, [value, isExpanded])

  // Focus textarea on expand
  useEffect(() => {
    if (isExpanded) textareaRef.current?.focus()
  }, [isExpanded])

  // ── Drag handle (up → expand, down → collapse) ───────────────────────────
  const dragStartY = useRef<number | null>(null)

  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartY.current = e.clientY
    const onMove = (ev: PointerEvent) => {
      if (dragStartY.current === null) return
      const delta = ev.clientY - dragStartY.current
      if (!isExpanded && delta < -36) { setIsExpanded(true);  cleanup() }
      if ( isExpanded && delta >  36) { setIsExpanded(false); cleanup() }
    }
    const cleanup = () => {
      dragStartY.current = null
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup',   cleanup)
    }
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup',   cleanup)
  }

  // ── Parse (expanded only) ────────────────────────────────────────────────
  const parseResult     = isExpanded ? parseMarkdownInput(value) : null
  const canExecExpanded = parseResult?.ok === true

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isExpanded && e.key === 'Enter') {
      e.preventDefault()
      onSubmit()
    }
    if (isExpanded && e.key === 'Escape') {
      setIsExpanded(false)
    }
    if (isExpanded && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      if (canExecExpanded && parseResult?.ok) onSubmitExpanded(parseResult.data)
    }
  }

  const handleExec = () => {
    if (isExpanded) {
      if (canExecExpanded && parseResult?.ok) {
        onSubmitExpanded(parseResult.data)
        onChange('')
        setIsExpanded(false)
      }
    } else {
      onSubmit()
    }
  }

  // Sync overlay + mirror scroll when textarea scrolls (at max height)
  const handleScroll = () => {
    const top = textareaRef.current?.scrollTop ?? 0
    if (overlayRef.current) overlayRef.current.scrollTop = top
    if (mirrorRef.current)  mirrorRef.current.scrollTop  = top
  }

  // ── Status bar summary ───────────────────────────────────────────────────
  const renderSummary = () => {
    if (!parseResult) return <span />
    if (!parseResult.ok) {
      return (
        <span
          className="font-mono text-[9px] tracking-[0.12em]"
          style={{ color: 'var(--rf-danger, #ff3030)' }}
        >
          CONFLICT: {parseResult.error}
        </span>
      )
    }
    const { data, hasWarnings } = parseResult
    const doneCount  = data.subtasks.filter((s) => s.completed).length
    const totalSubs  = data.subtasks.length
    const subPart    = totalSubs > 0
      ? `${totalSubs} subtask${totalSubs > 1 ? 's' : ''}${doneCount > 0 ? ` (${doneCount} done)` : ''}`
      : null
    const priPart    = data.priority !== 'normal' ? data.priority : null
    const warnPart   = hasWarnings ? 'check SUB? lines' : null
    const parts      = ['1 todo', subPart, priPart, warnPart].filter(Boolean)
    return (
      <span
        className="font-mono text-[9px] tracking-[0.12em]"
        style={{
          color:   hasWarnings ? 'var(--rf-amber, #ffb800)' : 'var(--rf-cyan)',
          opacity: 0.75,
        }}
      >
        {hasWarnings ? '⚠ ' : '✓ '}{parts.join(' · ')}
      </span>
    )
  }

  return (
    <motion.div
      className="rf-input-bar"
      animate={{ y: isDragging ? '100%' : 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 34, mass: 0.8 }}
    >
      {/* ── Mode / drag handle strip ─────────────────────────────────────── */}
      <div
        className="flex items-center justify-center w-full select-none"
        style={{
          height:       20,
          borderBottom: '1px solid var(--rf-border)',
          cursor:       isExpanded ? 's-resize' : 'n-resize',
        }}
        onPointerDown={handlePointerDown}
      >
        <div className="flex-1" style={{ height: 1, background: 'var(--rf-border)' }} />

        <span
          className="font-mono px-4 flex items-center gap-2"
          style={{ color: 'var(--rf-text-dim)', opacity: 0.8, fontSize: 9, letterSpacing: '0.18em' }}
        >
          {isExpanded ? (
            <>
              <span style={{ color: 'var(--rf-cyan)', opacity: 0.85 }}>BUFFER MODE</span>
              <span style={{ opacity: 0.35 }}>·</span>
              <span>↓ drag to entry mode</span>
            </>
          ) : (
            <>
              <span style={{ color: 'var(--rf-cyan)', opacity: 0.85 }}>ENTRY MODE</span>
              <span style={{ opacity: 0.35 }}>·</span>
              <span>↑ drag to buffer mode</span>
            </>
          )}
        </span>

        <div className="flex-1" style={{ height: 1, background: 'var(--rf-border)' }} />
      </div>

      {/* ── ENTRY MODE (collapsed) ───────────────────────────────────────── */}
      {!isExpanded && (
        <div className="rf-input-inner">
          <span className="rf-input-prompt" aria-hidden="true">&gt;_</span>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value.slice(0, TITLE_MAX_LEN))}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="rf-input-field"
            maxLength={TITLE_MAX_LEN}
            aria-label="New todo"
            autoComplete="off"
            spellCheck={false}
          />
          {attachments && (
            <div className="flex items-center gap-1 flex-shrink-0">{attachments}</div>
          )}
          {value.trim() ? (
            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className="font-mono text-[9px] select-none flex-shrink-0"
                style={{ color: 'var(--rf-text-dim)', opacity: 0.4 }}
              >
                {value.length}/{TITLE_MAX_LEN}
              </span>
              <button type="button" onClick={handleExec} className="rf-btn flex-shrink-0">
                [ exec ]
              </button>
              <span
                className="font-mono text-[10px] select-none flex flex-col items-center justify-center flex-shrink-0"
                style={{ color: 'var(--rf-text-dim)', opacity: 0.75, lineHeight: 1.35 }}
              >
                <span>press</span>
                <span>enter</span>
              </span>
            </div>
          ) : (
            <span
              className="font-mono text-[9px] tracking-[0.18em] flex-shrink-0 select-none"
              style={{ color: 'var(--rf-text-dim)', opacity: 0.5 }}
            >
              READY_
            </span>
          )}
        </div>
      )}

      {/* ── BUFFER MODE (expanded) ───────────────────────────────────────── */}
      {isExpanded && (
        <div style={{ padding: '0.6rem 1.25rem 0.75rem', maxWidth: 860, margin: '0 auto', width: '100%' }}>

          {/* Prompt + textarea wrapper */}
          <div className="flex gap-3 items-start">
            <span className="rf-input-prompt mt-[2px]" aria-hidden="true">&gt;_</span>

            {/* Relative wrapper — all layers anchor here */}
            <div className="relative flex-1" style={{ minWidth: 0 }}>

              {/* ── Layer 1: text mirror (colored per-line text) ─────── */}
              <div
                ref={mirrorRef}
                aria-hidden="true"
                style={{
                  position:      'absolute',
                  top:           0,
                  left:          0,
                  right:         0,
                  bottom:        0,
                  overflow:      'hidden',
                  pointerEvents: 'none',
                  fontFamily:    '"Space Mono", ui-monospace, monospace',
                  fontSize:      '0.88rem',
                  lineHeight:    TA_LINE_H,
                  paddingTop:    TA_PAD_TOP,
                  paddingRight:  LABEL_W,
                  whiteSpace:    'pre-wrap',
                  wordBreak:     'break-word',
                  overflowWrap:  'break-word',
                  zIndex:        1,
                }}
              >
                {value.split('\n').map((line, idx) => {
                  const tok = parseResult?.tokens[idx]
                  const color = tok ? TOKEN_STYLE[tok.kind].color : 'var(--rf-text)'
                  return (
                    <span key={idx} style={{ color }}>
                      {line || ''}
                      {idx < value.split('\n').length - 1 ? '\n' : ''}
                    </span>
                  )
                })}
              </div>

              {/* ── Layer 2: wash + wavy underline + right-side labels ── */}
              {parseResult && (
                <div
                  ref={overlayRef}
                  aria-hidden="true"
                  style={{
                    position:      'absolute',
                    top:           0,
                    left:          0,
                    right:         0,
                    bottom:        0,
                    overflow:      'hidden',
                    pointerEvents: 'none',
                    paddingTop:    TA_PAD_TOP,
                    lineHeight:    TA_LINE_H,
                    fontSize:      '0.88rem',
                    zIndex:        2,
                  }}
                >
                  {value.split('\n').map((_, idx) => {
                    const tok = parseResult.tokens[idx]
                    if (!tok || tok.kind === 'empty') {
                      return <div key={idx} style={{ height: `${TA_LINE_H}em` }} />
                    }
                    const s = TOKEN_STYLE[tok.kind]
                    return (
                      <div
                        key={idx}
                        className={s.wavy ?? ''}
                        style={{
                          height:         `${TA_LINE_H}em`,
                          background:     s.bg ?? 'transparent',
                          display:        'flex',
                          alignItems:     'center',
                          justifyContent: 'flex-end',
                          paddingRight:   '0.4rem',
                        }}
                      >
                        <span
                          style={{
                            fontFamily:    'var(--font-mono, monospace)',
                            fontSize:      7,
                            letterSpacing: '0.1em',
                            color:         s.color,
                            opacity:       0.8,
                          }}
                        >
                          {s.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* ── Layer 3: textarea — transparent text, visible caret ─ */}
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => {
                  // Limit only the first line (title) to TITLE_MAX_LEN
                  const lines = e.target.value.split('\n')
                  lines[0] = lines[0].slice(0, TITLE_MAX_LEN)
                  onChange(lines.join('\n'))
                }}
                onKeyDown={handleKeyDown}
                onScroll={handleScroll}
                placeholder={`Buy something\n- [] apple\n- [x] milk\n[!+]`}
                className="rf-input-field w-full resize-none"
                style={{
                  position:   'relative',
                  zIndex:     3,
                  minHeight:  72,
                  lineHeight: TA_LINE_H,
                  paddingTop: TA_PAD_TOP,
                  paddingRight: LABEL_W,
                  background: 'transparent',
                  color:      'transparent',
                  caretColor: 'var(--rf-text)',
                }}
                aria-label="New todo (buffer mode)"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          </div>

          {/* ── Status bar ──────────────────────────────────────────────── */}
          <div className="mt-2 ml-8 flex flex-col gap-[3px]">

            {/* Row 1: parse feedback */}
            <div className="flex items-center justify-between gap-3">
              {renderSummary()}

              <div className="flex items-center gap-2 flex-shrink-0">
                {attachments && (
                  <div className="flex items-center gap-1">{attachments}</div>
                )}
                <button
                  type="button"
                  onClick={handleExec}
                  disabled={!canExecExpanded}
                  className="rf-btn flex-shrink-0"
                  style={{
                    opacity: canExecExpanded ? 1 : 0.3,
                    cursor:  canExecExpanded ? 'pointer' : 'not-allowed',
                  }}
                >
                  [ exec ]
                </button>
                <span
                  className="font-mono text-[10px] select-none flex flex-col items-center justify-center flex-shrink-0"
                  style={{ color: 'var(--rf-text-dim)', opacity: 0.75, lineHeight: 1.35 }}
                >
                  <span>press</span>
                  <span>ctrl+enter</span>
                </span>
              </div>
            </div>

            {/* Row 2: always-visible format hint */}
            <span
              className="font-mono text-[9px] tracking-[0.1em] select-none"
              style={{ color: 'var(--rf-text-dim)', opacity: 0.32 }}
            >
              {HINT_TEXT}
            </span>

          </div>
        </div>
      )}
    </motion.div>
  )
}
