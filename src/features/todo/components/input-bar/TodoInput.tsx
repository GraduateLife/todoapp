import { motion } from 'framer-motion'
import { type ReactNode, useState, useEffect, useRef, useCallback } from 'react'
import { imeGuard } from '@/lib/utils'
import {
  parseMarkdownInput,
  type ParsedTodo,
} from '../../utils/parseMarkdownInput'
import { aiFixSyntax, isAIAvailable } from '../../services/aiParse'
import type { NoteColor } from '../../types'
import {
  EXPAND_TRANSITION,
  COLLAPSE_TRANSITION,
  BUFFER_HEIGHT,
} from './transitions'
import { useInputMode } from './useInputMode'
import { DragHandle } from './DragHandle'
import { BufferGuide } from './BufferGuide'
import { BufferEditor } from './BufferEditor'
import { ParseSummary } from './ParseSummary'

interface TodoInputProps {
  value: string
  onChange: (value: string) => void
  onSubmitExpanded: (parsed: ParsedTodo) => void
  attachments?: ReactNode
  isDragging?: boolean
  selectedColor: NoteColor | 'random'
  onColorChange: (color: NoteColor | 'random') => void
}

const AI_DEBOUNCE_SEC = 3

/**
 * Hook: 3-second debounced AI syntax fix.
 * Replaces the buffer text with corrected syntax when AI returns.
 *
 * Revert detection (per-line):
 * After AI fixes text, we record which lines were changed. If the user
 * edits any of those lines (partial or full revert), we suppress AI
 * until the line count or content changes substantially.
 */
function useAiSyntaxFix(
  value: string,
  onChange: (v: string) => void,
  isExpanded: boolean,
  enabled: boolean,
) {
  const [aiStatus, setAiStatus] = useState<'idle' | 'countdown' | 'parsing'>('idle')
  const [countdown, setCountdown] = useState(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Per-line revert tracking
  const lastFixedValue = useRef<string>('')    // full text AI produced
  const preFixValue = useRef<string>('')       // full text before AI fixed it
  const changedLineIdxs = useRef<Set<number>>(new Set()) // which line indices AI changed
  const suppressUntilNewContent = useRef(false)

  const clearTimers = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
    debounceRef.current = null
    countdownRef.current = null
  }, [])

  useEffect(() => {
    if (!isExpanded || !enabled) {
      clearTimers()
      setAiStatus('idle')
      setCountdown(0)
      return
    }

    const trimmed = value.trim()
    if (!trimmed || !isAIAvailable()) {
      clearTimers()
      setAiStatus('idle')
      setCountdown(0)
      return
    }

    // Don't re-trigger if AI just fixed this exact text
    if (value === lastFixedValue.current) {
      return
    }

    // ── Revert detection ──────────────────────────────────────────────
    if (lastFixedValue.current && preFixValue.current && changedLineIdxs.current.size > 0) {
      const currentLines = value.split('\n')
      const fixedLines = lastFixedValue.current.split('\n')

      // Check if user touched any of the lines AI changed
      const userEditedAiLines = [...changedLineIdxs.current].some((idx) => {
        const cur = currentLines[idx]?.trim()
        const fixed = fixedLines[idx]?.trim()
        // If current differs from AI's fix on a line AI changed, user reverted it
        return cur !== undefined && fixed !== undefined && cur !== fixed
      })

      if (userEditedAiLines) {
        suppressUntilNewContent.current = true
        clearTimers()
        setAiStatus('idle')
        setCountdown(0)
        return
      }
    }

    // If suppressed, check if user wrote genuinely new content
    if (suppressUntilNewContent.current) {
      const currentLines = value.split('\n')
      const preFixLines = preFixValue.current.split('\n')
      const fixedLines = lastFixedValue.current.split('\n')

      // Reset suppression if: line count changed, or content on non-AI lines changed
      const lineCountChanged = currentLines.length !== preFixLines.length
        && currentLines.length !== fixedLines.length
      const hasNewContent = currentLines.some((line, i) => {
        // Skip lines that AI changed — those are "disputed"
        if (changedLineIdxs.current.has(i)) return false
        const pre = preFixLines[i]?.trim()
        const fixed = fixedLines[i]?.trim()
        const cur = line.trim()
        // New content = differs from both pre-fix and fixed versions
        return cur !== pre && cur !== fixed
      })

      if (lineCountChanged || hasNewContent) {
        suppressUntilNewContent.current = false
        changedLineIdxs.current.clear()
        lastFixedValue.current = ''
        preFixValue.current = ''
      } else {
        clearTimers()
        setAiStatus('idle')
        setCountdown(0)
        return
      }
    }

    // Clear previous timers
    clearTimers()

    // Start countdown
    setCountdown(AI_DEBOUNCE_SEC)
    setAiStatus('countdown')

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current)
          countdownRef.current = null
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // After debounce, trigger AI
    debounceRef.current = setTimeout(() => {
      setAiStatus('parsing')
      const currentValue = value.trim()
      preFixValue.current = currentValue
      aiFixSyntax(currentValue)
        .then((corrected) => {
          if (corrected && corrected !== currentValue) {
            // Record which lines AI changed
            const preLines = currentValue.split('\n')
            const fixedLines = corrected.split('\n')
            const changed = new Set<number>()
            for (let i = 0; i < Math.max(preLines.length, fixedLines.length); i++) {
              if (preLines[i]?.trim() !== fixedLines[i]?.trim()) {
                changed.add(i)
              }
            }
            changedLineIdxs.current = changed
            lastFixedValue.current = corrected
            onChange(corrected)
          }
        })
        .catch(() => {})
        .finally(() => setAiStatus('idle'))
    }, AI_DEBOUNCE_SEC * 1000)

    return () => clearTimers()
  }, [value, isExpanded, enabled, onChange, clearTimers])

  // Reset on collapse
  useEffect(() => {
    if (!isExpanded) {
      clearTimers()
      setAiStatus('idle')
      setCountdown(0)
      lastFixedValue.current = ''
      preFixValue.current = ''
      changedLineIdxs.current = new Set()
      suppressUntilNewContent.current = false
    }
  }, [isExpanded, clearTimers])

  return { aiStatus, countdown }
}

export function TodoInput({
  value,
  onChange,
  onSubmitExpanded,
  attachments,
  isDragging = false,
}: TodoInputProps) {
  const { isExpanded, setIsExpanded, handlePointerDown } = useInputMode()
  const [aiAutoFix, setAiAutoFix] = useState(true)

  // ── Local parse (always, instant) ────────────────────────────────────────
  const localResult = isExpanded ? parseMarkdownInput(value) : null
  const canExec = localResult?.ok === true

  // ── AI syntax fix (3s debounce, optional) ────────────────────────────────
  const { aiStatus, countdown } = useAiSyntaxFix(value, onChange, isExpanded, aiAutoFix)

  const handleKeyDown = imeGuard((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsExpanded(false)
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      if (canExec && localResult?.ok) onSubmitExpanded(localResult.data)
    }
  })

  const handleExec = useCallback(() => {
    if (canExec && localResult?.ok) {
      onSubmitExpanded(localResult.data)
      onChange('')
      setIsExpanded(false)
    }
  }, [canExec, localResult, onSubmitExpanded, onChange, setIsExpanded])

  return (
    <motion.div
      className={isExpanded ? 'rf-input-bar' : 'rf-input-bar rf-input-bar--collapsed'}
      animate={{ y: isDragging ? '100%' : 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 34, mass: 0.8 }}
    >
      {/* ── Drag handle strip ─────────────────────────────────────────────── */}
      <DragHandle
        isExpanded={isExpanded}
        onPointerDown={handlePointerDown}
        onToggle={() => setIsExpanded(!isExpanded)}
        aiAutoFix={aiAutoFix}
        onToggleAi={() => setAiAutoFix((v) => !v)}
      />

      {/* ── Animated height container ──────────────────────────────────────── */}
      <motion.div
        animate={{ height: isExpanded ? BUFFER_HEIGHT : 0 }}
        transition={isExpanded ? EXPAND_TRANSITION : COLLAPSE_TRANSITION}
        style={{ overflow: 'hidden', width: '100%' }}
      >
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
            opacity: isExpanded ? 1 : 0,
            transition: 'opacity 0.12s ease-out',
          }}
        >
          {/* ── Top row: left guide + right textarea ───────────────────────── */}
          <div style={{ display: 'flex', gap: 0, alignItems: 'stretch' }}>
            <BufferGuide />
            <BufferEditor
              value={value}
              onChange={onChange}
              onKeyDown={handleKeyDown}
              tokens={localResult?.tokens}
            />
          </div>

          {/* ── Bottom row: parse summary + AI status + exec group ─────────── */}
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
            <div className="flex items-center gap-2">
              <ParseSummary parseResult={localResult} />

              {/* AI countdown / status */}
              {aiAutoFix && aiStatus === 'countdown' && countdown > 0 && (
                <span
                  className="font-mono text-[8px] tracking-[0.12em]"
                  style={{ color: 'var(--rf-text-dim)', opacity: 0.35 }}
                >
                  AI {countdown}s
                </span>
              )}
              {aiAutoFix && aiStatus === 'parsing' && (
                <span
                  className="font-mono text-[8px] tracking-[0.12em]"
                  style={{
                    color: 'var(--rf-cyan)',
                    opacity: 0.5,
                    animation: 'pulse 1.2s ease-in-out infinite',
                  }}
                >
                  AI fixing...
                </span>
              )}
            </div>

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
                disabled={!canExec}
                className="rf-btn flex-shrink-0"
                style={{
                  opacity: canExec ? 1 : 0.3,
                  cursor: canExec ? 'pointer' : 'not-allowed',
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
    </motion.div>
  )
}
