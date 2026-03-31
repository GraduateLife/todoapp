import { motion, AnimatePresence } from 'framer-motion'
import { useRef, useEffect, type ReactNode } from 'react'
import {
  parseMarkdownInput,
  type ParsedTodo,
} from '../../utils/parseMarkdownInput'
import type { NoteColor } from '../../types'
import { TITLE_MAX_LEN, MAX_HEIGHT } from './constants'
import {
  EXPAND_TRANSITION,
  COLLAPSE_TRANSITION,
  FADE_TRANSITION,
  ENTRY_HEIGHT,
  BUFFER_HEIGHT,
} from './transitions'
import { useInputMode } from './useInputMode'
import { DragHandle } from './DragHandle'
import { ColorPicker } from './ColorPicker'
import { BufferGuide } from './BufferGuide'
import { BufferEditor } from './BufferEditor'
import { ParseSummary } from './ParseSummary'

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
  const { isExpanded, setIsExpanded, handlePointerDown } = useInputMode()
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-grow (entry mode only)
  const textareaGrowRef = useRef<HTMLTextAreaElement | null>(null)
  useEffect(() => {
    const el = textareaGrowRef.current
    if (!el || isExpanded) return
    el.style.height = 'auto'
    const sh = el.scrollHeight
    el.style.height = `${Math.min(sh, MAX_HEIGHT)}px`
    el.style.overflowY = sh > MAX_HEIGHT ? 'auto' : 'hidden'
  }, [value, isExpanded])

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

  return (
    <motion.div
      className="rf-input-bar"
      animate={{ y: isDragging ? '100%' : 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 34, mass: 0.8 }}
    >
      {/* ── Mode / drag handle strip ─────────────────────────────────────── */}
      <DragHandle isExpanded={isExpanded} onPointerDown={handlePointerDown} />

      {/* ── Animated height container ────────────────────────────────────── */}
      <motion.div
        animate={{ height: isExpanded ? BUFFER_HEIGHT : ENTRY_HEIGHT }}
        transition={isExpanded ? EXPAND_TRANSITION : COLLAPSE_TRANSITION}
        style={{ overflow: 'hidden', width: '100%' }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {/* ── ENTRY MODE (collapsed) ───────────────────────────────────── */}
          {!isExpanded && (
            <motion.div
              key="entry"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={FADE_TRANSITION}
              style={{ width: '100%' }}
            >
              <div style={{ display: 'flex', alignItems: 'stretch', width: '100%' }}>
                <ColorPicker
                  selectedColor={selectedColor}
                  onColorChange={onColorChange}
                />

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
                    ref={inputRef}
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
            </motion.div>
          )}

          {/* ── BUFFER MODE (expanded) ───────────────────────────────────── */}
          {isExpanded && (
            <motion.div
              key="buffer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={FADE_TRANSITION}
              style={{ width: '100%' }}
            >
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0,
                }}
              >
                {/* ── Top row: left guide + right textarea ───────────────── */}
                <div style={{ display: 'flex', gap: 0, alignItems: 'stretch' }}>
                  <BufferGuide />
                  <BufferEditor
                    value={value}
                    onChange={onChange}
                    onKeyDown={handleKeyDown}
                    tokens={parseResult?.tokens}
                  />
                </div>

                {/* ── Bottom row: parse summary + exec group ─────────────── */}
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
                  <ParseSummary parseResult={parseResult} />

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
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
