import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ColorPicker } from '../input-bar/ColorPicker'
import { TITLE_MAX_LEN } from '../input-bar/constants'
import { TodoService } from '../../services/TodoService'
import { VoiceInputOverlay } from '../voice/VoiceInputOverlay'
import { VOICE_MOCK } from '../../../../lib/env'
import { imeGuard } from '@/lib/utils'
import type { NoteColor } from '../../types'

interface ContextInputProps {
  /** Screen position where the user right-clicked */
  position: { x: number; y: number }
  /** Close the popover */
  onClose: () => void
}

const CARD_W = 256
const CARD_H = 160
const POPOVER_W = 320

export function ContextInput({ position, onClose }: ContextInputProps) {
  const [value, setValue] = useState('')
  const [selectedColor, setSelectedColor] = useState<NoteColor | 'random'>('random')
  const [voiceOpen, setVoiceOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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
    TodoService.createFromText(trimmed, {
      color: selectedColor === 'random' ? undefined : selectedColor,
      position: notePos,
    })
    onClose()
  }, [value, selectedColor, position, onClose])

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

          {/* Color picker row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              borderTop: '1px solid rgba(192, 216, 240, 0.06)',
              paddingTop: 3,
            }}
          >
            <div
              style={
                {
                  '--rf-text-dim': 'rgba(192,216,240,0.55)',
                } as React.CSSProperties
              }
            >
              <ColorPicker
                selectedColor={selectedColor}
                onColorChange={setSelectedColor}
              />
            </div>
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
        selectedColor={selectedColor}
        onColorChange={setSelectedColor}
      />
    </>
  )
}
