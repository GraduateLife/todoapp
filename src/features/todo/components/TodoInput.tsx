import { motion } from 'framer-motion'
import { useRef, useState, useEffect, type ReactNode } from 'react'
import {
  parseMarkdownInput,
  type LineToken,
  type ParsedTodo,
} from '../utils/parseMarkdownInput'
import type { NoteColor } from '../types'
import { COLOR_OPTIONS } from '../constants/noteColors'

interface TodoInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onSubmitExpanded: (parsed: ParsedTodo) => void
  placeholder?: string
  attachments?: ReactNode
  isDragging?: boolean
  selectedColor: NoteColor | 'random'
  onColorChange: (color: NoteColor | 'random') => void
}

// ── Token styles ──────────────────────────────────────────────────────────────
const TOKEN_STYLE: Record<
  LineToken['kind'],
  { color: string; label: string; bg?: string; wavy?: string }
> = {
  title: { color: 'var(--rf-text)', label: 'TITLE' },
  subtask: { color: 'var(--rf-cyan)', label: 'SUB' },
  priority: { color: 'var(--rf-purple, #bf5fff)', label: 'PRI' },
  color: { color: 'var(--rf-amber, #ffb800)', label: 'CLR' },
  warn: {
    color: 'var(--rf-amber, #ffb800)',
    label: 'SUB?',
    bg: 'rgba(255,184,0,0.05)',
    wavy: 'rf-row-wavy-warn',
  },
  extra: {
    color: 'var(--rf-danger, #ff3030)',
    label: 'CONFLICT',
    bg: 'rgba(255,48,48,0.07)',
    wavy: 'rf-row-wavy-danger',
  },
  empty: { color: 'transparent', label: '' },
}

// These constants must stay in sync between textarea and overlay
const TA_LINE_H = 1.7 // matches lineHeight on textarea
const TA_PAD_TOP = '0.35rem' // matches paddingTop on textarea
const LABEL_W = '4rem' // right gutter width for labels
const MAX_HEIGHT = 220 // ~10 lines before scrollbar appears

// Title character limit: ~25 chars/line on main card × 4 lines  (fan card clamps to 3 lines visually)
export const TITLE_MAX_LEN = 100

export function TodoInput({
  value,
  onChange,
  onSubmit,
  onSubmitExpanded,
  placeholder = 'type a task and press enter_',
  attachments,
  isDragging = false,
  selectedColor,
  onColorChange,
}: TodoInputProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const mirrorRef = useRef<HTMLDivElement>(null)

  // Auto-grow (entry mode only) — buffer mode uses fixed height with rf-scrollbar
  useEffect(() => {
    const el = textareaRef.current
    if (!el || isExpanded) return
    el.style.height = 'auto'
    const sh = el.scrollHeight
    el.style.height = `${Math.min(sh, MAX_HEIGHT)}px`
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
      if (!isExpanded && delta < -36) {
        setIsExpanded(true)
        cleanup()
      }
      if (isExpanded && delta > 36) {
        setIsExpanded(false)
        cleanup()
      }
    }
    const cleanup = () => {
      dragStartY.current = null
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', cleanup)
    }
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', cleanup)
  }

  // ── Parse (expanded only) ────────────────────────────────────────────────
  const parseResult = isExpanded ? parseMarkdownInput(value) : null
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
    if (mirrorRef.current) mirrorRef.current.scrollTop = top
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
    const doneCount = data.subtasks.filter((s) => s.completed).length
    const totalSubs = data.subtasks.length
    const subPart =
      totalSubs > 0
        ? `${totalSubs} subtask${totalSubs > 1 ? 's' : ''}${doneCount > 0 ? ` (${doneCount} done)` : ''}`
        : null
    const priPart = data.priority !== 'normal' ? data.priority : null
    const warnPart = hasWarnings ? 'check SUB? lines' : null
    const parts = ['1 todo', subPart, priPart, warnPart].filter(Boolean)
    return (
      <span
        className="font-mono text-[9px] tracking-[0.12em]"
        style={{
          color: hasWarnings ? 'var(--rf-amber, #ffb800)' : 'var(--rf-cyan)',
          opacity: 0.75,
        }}
      >
        {hasWarnings ? '⚠ ' : '✓ '}
        {parts.join(' · ')}
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
          height: 20,
          borderBottom: '1px solid var(--rf-border)',
          cursor: isExpanded ? 's-resize' : 'n-resize',
        }}
        onPointerDown={handlePointerDown}
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
              <span>↓ drag to entry mode</span>
            </>
          ) : (
            <>
              <span style={{ color: 'var(--rf-cyan)', opacity: 0.85 }}>
                ENTRY MODE
              </span>
              <span style={{ opacity: 0.35 }}>·</span>
              <span>↑ drag to buffer mode</span>
            </>
          )}
        </span>
      </div>

      {/* ── ENTRY MODE (collapsed) ───────────────────────────────────────── */}
      {!isExpanded && (
        <div style={{ display: 'flex', alignItems: 'stretch', width: '100%' }}>
          {/* ── Color picker (left panel) ──────────────────────────────── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
              padding: '0 8px',
              gap: 2,
            }}
          >
            {COLOR_OPTIONS.map((opt) => {
              const isSelected = selectedColor === opt.key
              return (
                <button
                  key={opt.key}
                  type="button"
                  title={opt.key === 'random' ? 'Random color' : opt.key}
                  onClick={() => onColorChange(opt.key)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px 5px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      width: 6,
                      height: 6,
                      borderRadius: 1,
                      backgroundColor: opt.hex,
                      opacity: isSelected ? 1 : 0.2,
                      boxShadow: isSelected ? `0 0 4px 1px ${opt.hex}` : 'none',
                      transition: 'box-shadow 150ms, opacity 150ms',
                    }}
                  />
                  <span
                    style={{
                      fontFamily: '"Space Mono", ui-monospace, monospace',
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      color: isSelected ? opt.hex : 'var(--rf-text-dim)',
                      opacity: isSelected ? 1 : 0.3,
                      transition: 'opacity 150ms, color 150ms',
                      lineHeight: 1,
                    }}
                  >
                    {opt.label}
                  </span>
                </button>
              )
            })}
          </div>

          {/* ── Input area ─────────────────────────────────────────────── */}
          <div
            className="rf-input-inner"
            style={{
              flex: 1,
              border: 'none',
              padding: '0 1rem',
              maxWidth: 'none',
              margin: 0,
            }}
          >
            <span className="rf-input-prompt" aria-hidden="true">
              &gt;_
            </span>
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
              <div className="flex items-center gap-1 flex-shrink-0">
                {attachments}
              </div>
            )}
            {value.trim() ? (
              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className="font-mono text-[9px] select-none flex-shrink-0"
                  style={{ color: 'var(--rf-text-dim)', opacity: 0.4 }}
                >
                  {value.length}/{TITLE_MAX_LEN}
                </span>
                <button
                  type="button"
                  onClick={handleExec}
                  className="rf-btn flex-shrink-0"
                >
                  [ exec ]
                </button>
                <span
                  className="font-mono text-[10px] select-none flex flex-col items-center justify-center flex-shrink-0"
                  style={{
                    color: 'var(--rf-text-dim)',
                    opacity: 0.75,
                    lineHeight: 1.35,
                  }}
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
        </div>
      )}

      {/* ── BUFFER MODE (expanded) ───────────────────────────────────────── */}
      {isExpanded && (
        <div
          style={{
            // padding: '0 0 0.5rem',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
          }}
        >
          {/* ── Top row: left guide + right textarea ───────────────────── */}
          <div style={{ display: 'flex', gap: 0, alignItems: 'stretch' }}>
            {/* ── Left panel: two-column guide ─────────────────────────── */}
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

            {/* ── Right: Prompt + textarea ─────────────────────────────── */}
            <div
              style={{
                flex: 1,
                // padding: '0.2rem 0 0 0.25rem',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Prompt + textarea wrapper */}
              <div className="flex gap-0 items-start" style={{ flex: 1 }}>
                <span className="rf-input-prompt" aria-hidden="true">
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
                    {value.split('\n').map((line, idx) => {
                      const tok = parseResult?.tokens[idx]
                      const color = tok
                        ? TOKEN_STYLE[tok.kind].color
                        : 'var(--rf-text)'
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
                      {value.split('\n').map((_, idx) => {
                        const tok = parseResult.tokens[idx]
                        if (!tok || tok.kind === 'empty') {
                          return (
                            <div
                              key={idx}
                              style={{ height: `${TA_LINE_H}em` }}
                            />
                          )
                        }
                        const s = TOKEN_STYLE[tok.kind]
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
                                color: s.color,
                                opacity: 0.8,
                              }}
                            >
                              {s.label}
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
                      // Limit only the first line (title) to TITLE_MAX_LEN
                      const lines = e.target.value.split('\n')
                      lines[0] = lines[0].slice(0, TITLE_MAX_LEN)
                      onChange(lines.join('\n'))
                    }}
                    onKeyDown={handleKeyDown}
                    onScroll={handleScroll}
                    placeholder={`Buy groceries\n- [] apple\n- [x] milk\n- undone item\n[!+]\n[cyan]`}
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
            {/* end right column */}
          </div>
          {/* end top row */}

          {/* ── Bottom row: parse summary + exec group ─────────────────── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '0.45rem',
              paddingLeft: 'calc(220px + 0.5rem + 2.75rem)',
              paddingRight: '0',
            }}
          >
            {renderSummary()}

            <div
              className="flex items-center gap-2 flex-shrink-0"
              style={{ paddingRight: '0.5rem' }}
            >
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
                  cursor: canExecExpanded ? 'pointer' : 'not-allowed',
                }}
              >
                [ exec ]
              </button>
              <span
                className="font-mono text-[10px] select-none flex flex-col items-center justify-center flex-shrink-0"
                style={{
                  color: 'var(--rf-text-dim)',
                  opacity: 0.75,
                  lineHeight: 1.35,
                }}
              >
                <span>press</span>
                <span>ctrl+enter</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
