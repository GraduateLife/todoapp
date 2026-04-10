import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { TITLE_MAX_LEN } from '../input-bar/constants'
import { TodoService } from '../../services/TodoService'
import { VoiceInputOverlay } from '../voice/VoiceInputOverlay'
import { VOICE_MOCK } from '../../../../lib/env'
import { imeGuard } from '@/lib/utils'
import { parseTrailingMark } from '../../constants/priority'
import type { NoteColor, Priority } from '../../types'

interface ContextInputProps {
  /** Screen position where the user right-clicked */
  position: { x: number; y: number }
  /** Close the popover */
  onClose: () => void
}

const CARD_W = 256
const CARD_H = 160
const POPOVER_W = 320

/**
 * Priority legend: 4 lamps shown under the quick-task input.
 *
 * This is a *read-only indicator*, not a selector. The currently active lamp
 * is driven by parsing the trailing mark of the user's input text — clicking
 * a lamp does nothing. `system`/cyan is deliberately absent (see
 * constants/priority.ts for the rationale).
 *
 * Hexes are inlined so the legend's colors stay theme-agnostic.
 */
const LEGEND_SLOTS: {
  mark: string
  priority: Priority
  label: string
  hex: string
}[] = [
  { mark: '!', priority: 'high',   label: 'high',        hex: '#ff2d78' },
  { mark: '.', priority: 'normal', label: 'normal',      hex: '#ffb800' },
  { mark: '?', priority: 'low',    label: 'low',         hex: '#39ff14' },
  { mark: '~', priority: 'idea',   label: 'inspiration', hex: '#bf5fff' },
]

export function ContextInput({ position, onClose }: ContextInputProps) {
  const [value, setValue] = useState('')
  // Waveform color for the voice overlay only — has no effect on the created
  // card (card color is derived from priority at store level).
  const [voiceWaveformColor, setVoiceWaveformColor] = useState<
    NoteColor | 'random'
  >('amber')
  const [voiceOpen, setVoiceOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Live-parse the trailing mark so the legend can highlight the matching lamp.
  const parsedPriority: Priority = useMemo(
    () => parseTrailingMark(value.trim()).priority,
    [value],
  )

  // Auto-focus input on mount
  useEffect(() => {
    // Small delay so framer-motion animation doesn't steal focus
    const t = setTimeout(() => inputRef.current?.focus(), 60)
    return () => clearTimeout(t)
  }, [])

  // Close on outside click
  useEffect(() => {
    const handler = (e: PointerEvent) => {
      if (voiceOpen) return
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    window.addEventListener('pointerdown', handler)
    return () => window.removeEventListener('pointerdown', handler)
  }, [onClose, voiceOpen])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !voiceOpen) onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, voiceOpen])

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed) return
    // Place the sticky note centered on the right-click position
    const notePos = {
      x: Math.max(8, position.x - CARD_W / 2),
      y: Math.max(8, position.y - CARD_H / 2),
    }
    // Priority + color are derived from the trailing mark inside the service.
    TodoService.createFromText(trimmed, { position: notePos })
    onClose()
  }, [value, position, onClose])

  const handleKeyDown = imeGuard((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  })

  // Keep popover within viewport
  const clampedX = Math.min(position.x, window.innerWidth - POPOVER_W - 16)
  const clampedY = Math.min(position.y, window.innerHeight - 80)

  return (
    <>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.92, y: 4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 4 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        style={{
          position: 'fixed',
          left: clampedX,
          top: clampedY,
          zIndex: 8000,
          width: POPOVER_W,
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div
          style={{
            background: 'rgba(8, 12, 20, 0.95)',
            border: '1px solid rgba(192, 216, 240, 0.12)',
            borderRadius: 4,
            backdropFilter: 'blur(12px)',
            padding: '6px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {/* Input row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 11,
                color: 'rgba(192, 216, 240, 0.3)',
                flexShrink: 0,
                userSelect: 'none',
              }}
            >
              &gt;_
            </span>
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value.slice(0, TITLE_MAX_LEN))}
              onKeyDown={handleKeyDown}
              placeholder="quick task..."
              maxLength={TITLE_MAX_LEN}
              autoComplete="off"
              spellCheck={false}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontFamily: "'Space Mono', monospace",
                fontSize: 12,
                color: 'rgba(220, 245, 255, 0.9)',
                letterSpacing: '0.03em',
                caretColor: 'rgba(0, 245, 255, 0.7)',
              }}
            />

            {/* Mic button */}
            <button
              type="button"
              title={VOICE_MOCK ? 'voice input (mock)' : 'voice input'}
              onClick={() => setVoiceOpen(true)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 4px',
                fontSize: 13,
                lineHeight: 1,
                color: 'rgba(192, 216, 240, 0.4)',
                transition: 'color 0.15s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(192, 216, 240, 0.8)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(192, 216, 240, 0.4)' }}
            >
              🎤
            </button>

            {/* Char count + Enter hint */}
            {value.trim() ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <span
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 8,
                    color: 'rgba(192, 216, 240, 0.25)',
                    userSelect: 'none',
                  }}
                >
                  {value.length}/{TITLE_MAX_LEN}
                </span>
                <span
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 8,
                    letterSpacing: '0.1em',
                    color: 'rgba(192, 216, 240, 0.2)',
                    userSelect: 'none',
                  }}
                >
                  ENTER
                </span>
              </div>
            ) : null}
          </div>

          {/* Priority legend row (read-only indicator) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              borderTop: '1px solid rgba(192, 216, 240, 0.06)',
              paddingTop: 3,
              gap: 12,
              paddingLeft: 6,
              paddingRight: 6,
            }}
          >
            {LEGEND_SLOTS.map((slot) => {
              const active = slot.priority === parsedPriority
              return (
                <div
                  key={slot.priority}
                  title={`type "${slot.mark}" for ${slot.label}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    userSelect: 'none',
                    // Display-only: no pointer events, no click handler.
                    cursor: 'default',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: 6,
                      height: 6,
                      borderRadius: 1,
                      backgroundColor: slot.hex,
                      opacity: active ? 1 : 0.18,
                      boxShadow: active ? `0 0 5px 1px ${slot.hex}` : 'none',
                      transition: 'box-shadow 150ms, opacity 150ms',
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "'Space Mono', ui-monospace, monospace",
                      fontSize: 8,
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      color: active ? slot.hex : 'rgba(192,216,240,0.3)',
                      opacity: active ? 1 : 0.5,
                      transition: 'color 150ms, opacity 150ms',
                    }}
                  >
                    {slot.mark} {slot.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </motion.div>

      {/* Voice Overlay */}
      <VoiceInputOverlay
        isOpen={voiceOpen}
        onClose={() => {
          setVoiceOpen(false)
          onClose()
        }}
        selectedColor={voiceWaveformColor}
        onColorChange={setVoiceWaveformColor}
      />
    </>
  )
}
