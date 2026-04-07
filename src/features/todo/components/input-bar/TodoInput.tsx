import { motion } from 'framer-motion'
import { useState, useEffect, useRef, useCallback } from 'react'
import { imeGuard } from '@/lib/utils'
import {
  parseMarkdownInput,
  type ParsedTodo,
} from '../../utils/parseMarkdownInput'
import { localFixSyntax } from '../../services/aiParse'
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
import { useAiSuggestion } from './useAiSuggestion'
import { FileChip } from './FileChip'

import type { Attachment } from '../../types'

interface TodoInputProps {
  value: string
  onChange: (value: string) => void
  onSubmitExpanded: (parsed: ParsedTodo) => void
  isDragging?: boolean
  selectedColor: NoteColor | 'random'
  onColorChange: (color: NoteColor | 'random') => void
  pendingFiles: Attachment[]
  onAddFile: (file: File) => void
  onRemoveFile: (id: string) => void
}

const LOCAL_FIX_DEBOUNCE_MS = 600

/**
 * Hook: debounced local syntax fix (no AI).
 * Adds "- " prefix to non-title lines after user stops typing for 600ms.
 * Skips if user just undid a fix (revert detection).
 */
function useLocalSyntaxFix(
  value: string,
  onChange: (v: string) => void,
  isExpanded: boolean,
  enabled: boolean,
  composingRef: React.RefObject<boolean>,
) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastFixedValue = useRef<string>('')

  useEffect(() => {
    if (!isExpanded || !enabled) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      return
    }

    if (!value.trim() || value.split('\n').length < 2) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      return
    }

    // Don't re-trigger if we just fixed this
    if (value === lastFixedValue.current) return

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      // Skip if IME is composing
      if (composingRef.current) return
      const fixed = localFixSyntax(value)
      if (fixed) {
        lastFixedValue.current = fixed
        onChange(fixed)
      }
    }, LOCAL_FIX_DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [value, isExpanded, enabled, onChange])

  // Reset on collapse
  useEffect(() => {
    if (!isExpanded) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      lastFixedValue.current = ''
    }
  }, [isExpanded])
}

export function TodoInput({
  value,
  onChange,
  onSubmitExpanded,
  isDragging = false,
  pendingFiles,
  onAddFile,
  onRemoveFile,
}: TodoInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { isExpanded, setIsExpanded, handlePointerDown } = useInputMode()
  const [autoFix, setAutoFix] = useState(true)
  const [aiSuggest, setAiSuggest] = useState(true)
  const composingRef = useRef(false)

  // ── Local parse (always, instant) ────────────────────────────────────────
  const localResult = isExpanded ? parseMarkdownInput(value) : null
  const canExec = localResult?.ok === true

  // ── Local syntax fix (600ms debounce, no AI) ─────────────────────────────
  useLocalSyntaxFix(value, onChange, isExpanded, autoFix, composingRef)

  // ── AI subtask suggestion (ghost text) ──────────────────────────────────
  const { suggestion, suggestLineIdx, accept: acceptSuggestion } =
    useAiSuggestion(value, onChange, isExpanded && aiSuggest, composingRef)

  const handleKeyDown = imeGuard((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsExpanded(false)
    }
    // Tab to accept AI suggestion
    if (e.key === 'Tab' && suggestion) {
      e.preventDefault()
      acceptSuggestion()
      return
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleExec()
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
      {/* ── File preview strip (above terminal) ──────────────────────────── */}
      {isExpanded && pendingFiles.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-2"
          style={{
            padding: '4px 12px',
            borderBottom: '1px solid var(--rf-border)',
          }}
        >
          {pendingFiles.map((f) => (
            <FileChip key={f.id} file={f} onRemove={onRemoveFile} />
          ))}
        </div>
      )}

      {/* ── Drag handle strip ─────────────────────────────────────────────── */}
      <DragHandle
        isExpanded={isExpanded}
        onPointerDown={handlePointerDown}
        onToggle={() => setIsExpanded(!isExpanded)}
        autoFix={autoFix}
        onToggleAutoFix={() => setAutoFix((v) => !v)}
        aiSuggest={aiSuggest}
        onToggleAiSuggest={() => setAiSuggest((v) => !v)}
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
              suggestion={suggestion}
              suggestLineIdx={suggestLineIdx}
              onDropFiles={(files) => files.forEach(onAddFile)}
              onCompositionStart={() => { composingRef.current = true }}
              onCompositionEnd={() => { composingRef.current = false }}
            />
          </div>

          {/* ── Bottom row: parse summary + file btn + exec ────────────────── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '0.35rem',
              paddingLeft: 'calc(220px + 0.5rem + 2.75rem)',
              paddingRight: '0',
            }}
          >
            <ParseSummary parseResult={localResult} />

            <div
              className="flex items-center gap-2 flex-shrink-0"
              style={{ paddingRight: '0.5rem' }}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                onChange={(e) => {
                  const files = e.target.files
                  if (files) Array.from(files).forEach(onAddFile)
                  e.target.value = ''
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rf-btn flex-shrink-0"
                style={{ opacity: 0.5 }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.5' }}
              >
                [ + file ]
              </button>
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
                [ ^⏎ exec ]
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
