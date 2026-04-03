import { createPortal } from 'react-dom'
import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WaveformCanvas } from './WaveformCanvas'
import { useVoiceRecorder } from '../../services/voice'
import { useAudioAnalyser } from '../../services/voice/useAudioAnalyser'
import { TodoService } from '../../services/TodoService'
import { ColorPicker } from '../input-bar/ColorPicker'
import { COLOR_OPTIONS } from '../../constants/noteColors'
import type { NoteColor } from '../../types'
import { VOICE_MOCK } from '../../../../lib/env'

interface VoiceInputOverlayProps {
  isOpen: boolean
  onClose: () => void
  selectedColor: NoteColor | 'random'
  onColorChange: (color: NoteColor | 'random') => void
}

/** Convert a NoteColor/random selection to a CSS rgba color for the waveform. */
function waveformColor(selectedColor: NoteColor | 'random'): string {
  const opt = COLOR_OPTIONS.find((o) => o.key === selectedColor)
  const hex = opt?.hex ?? '#00f5ff'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},0.85)`
}

export function VoiceInputOverlay({
  isOpen,
  onClose,
  selectedColor,
  onColorChange,
}: VoiceInputOverlayProps) {
  const [transcript, setTranscript] = useState('')
  const [interim, setInterim] = useState('')
  const [isReplaying, setIsReplaying] = useState(false)
  const audioObjRef = useRef<HTMLAudioElement | null>(null)
  const mockReplayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const {
    handleRef,
    start: startAnalyser,
    stop: stopAnalyser,
    audioUrl,
    revokeAudio,
  } = useAudioAnalyser()

  const handleTranscript = useCallback((text: string, isFinal: boolean) => {
    if (isFinal) {
      setTranscript(text)
      setInterim('')
    } else {
      setInterim(text)
    }
  }, [])

  const {
    state: voiceState,
    start: startVoice,
    stop: stopVoice,
  } = useVoiceRecorder({
    onTranscript: handleTranscript,
  })

  // Start recording + analyser when overlay opens
  useEffect(() => {
    if (isOpen) {
      setTranscript('')
      setInterim('')
      setIsReplaying(false)
      audioObjRef.current = null
      if (selectedColor === 'random') onColorChange('cyan')
      startAnalyser()
      startVoice()
    }
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioObjRef.current?.pause()
      if (mockReplayTimerRef.current) clearTimeout(mockReplayTimerRef.current)
      revokeAudio()
    }
  }, [revokeAudio])

  const handleStop = useCallback(() => {
    stopVoice()
    stopAnalyser()
    const final = transcript.trim()
    if (final) TodoService.createFromVoice(final)
    revokeAudio()
    onClose()
  }, [stopVoice, stopAnalyser, transcript, revokeAudio, onClose])

  const handleCancel = useCallback(() => {
    stopVoice()
    stopAnalyser()
    audioObjRef.current?.pause()
    if (mockReplayTimerRef.current) clearTimeout(mockReplayTimerRef.current)
    revokeAudio()
    onClose()
  }, [stopVoice, stopAnalyser, revokeAudio, onClose])

  const handleReplay = useCallback(() => {
    if (VOICE_MOCK) {
      if (isReplaying) {
        if (mockReplayTimerRef.current) clearTimeout(mockReplayTimerRef.current)
        setIsReplaying(false)
        return
      }
      setIsReplaying(true)
      mockReplayTimerRef.current = setTimeout(() => setIsReplaying(false), 1000)
      return
    }
    if (isReplaying) {
      audioObjRef.current?.pause()
      audioObjRef.current = null
      setIsReplaying(false)
      return
    }
    if (!audioUrl) return
    if (audioObjRef.current) {
      audioObjRef.current.pause()
      audioObjRef.current = null
    }
    const audio = new Audio(audioUrl)
    audio.onended = () => setIsReplaying(false)
    audio.onerror = () => setIsReplaying(false)
    audioObjRef.current = audio
    audio.play()
    setIsReplaying(true)
  }, [audioUrl, isReplaying])

  // Esc to cancel
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, handleCancel])

  const displayText = transcript || interim
  const isListening = voiceState === 'listening'
  const color = waveformColor(selectedColor)
  const showPlayButton = VOICE_MOCK || !!audioUrl

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(4, 6, 12, 0.92)',
            backdropFilter: 'blur(6px)',
          }}
        >
          {/* ── Waveform row: canvas + play button ───────────────────────── */}
          <motion.div
            initial={{ scaleY: 0.3, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            style={{
              width: '72%',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div style={{ flex: 1, height: 140 }}>
              <WaveformCanvas
                handleRef={handleRef}
                isActive={isListening}
                color={color}
              />
            </div>

            {/* Play / pause + duration */}
            {showPlayButton && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 5,
                  flexShrink: 0,
                }}
              >
                <button
                  onClick={handleReplay}
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 13,
                    color: isReplaying ? color : 'rgba(192,216,240,0.45)',
                    background: 'transparent',
                    border: `1px solid ${isReplaying ? color.replace('0.85)', '0.35)') : 'rgba(192,216,240,0.15)'}`,
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'color 0.15s, border-color 0.15s',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    if (isReplaying) return
                    e.currentTarget.style.color = 'rgba(192,216,240,0.85)'
                    e.currentTarget.style.borderColor = 'rgba(192,216,240,0.4)'
                  }}
                  onMouseLeave={(e) => {
                    if (isReplaying) return
                    e.currentTarget.style.color = 'rgba(192,216,240,0.45)'
                    e.currentTarget.style.borderColor = 'rgba(192,216,240,0.15)'
                  }}
                >
                  {isReplaying ? '■' : '▶'}
                </button>
                <span
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 8,
                    letterSpacing: '0.1em',
                    color: 'rgba(192,216,240,0.25)',
                  }}
                >
                  {VOICE_MOCK ? '0:01' : ''}
                </span>
              </div>
            )}
          </motion.div>

          {/* ── ColorPicker row + action buttons ─────────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.25 }}
            style={{
              width: '72%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* Color picker */}
            <div
              style={
                {
                  '--rf-text-dim': 'rgba(192,216,240,0.55)',
                } as React.CSSProperties
              }
            >
              <ColorPicker
                selectedColor={selectedColor}
                onColorChange={onColorChange}
                hideRandom
              />
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {transcript && (
                <button
                  onClick={handleStop}
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 11,
                    letterSpacing: '0.14em',
                    color: color,
                    background: 'transparent',
                    border: `1px solid ${color.replace('0.85)', '0.45)')}`,
                    padding: '5px 16px',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s, color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = color.replace(
                      '0.85)',
                      '0.9)',
                    )
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = color.replace(
                      '0.85)',
                      '0.45)',
                    )
                  }}
                >
                  [ create todo ]
                </button>
              )}
              <button
                onClick={handleCancel}
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 11,
                  letterSpacing: '0.14em',
                  color: 'rgba(192, 216, 240, 0.35)',
                  background: 'transparent',
                  border: '1px solid rgba(192, 216, 240, 0.15)',
                  padding: '5px 16px',
                  cursor: 'pointer',
                  transition: 'color 0.15s, border-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'rgba(192, 216, 240, 0.7)'
                  e.currentTarget.style.borderColor = 'rgba(192, 216, 240, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(192, 216, 240, 0.35)'
                  e.currentTarget.style.borderColor =
                    'rgba(192, 216, 240, 0.15)'
                }}
              >
                [ cancel ]
              </button>
            </div>
          </motion.div>

          {/* ── Transcript ────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            style={{
              width: '72%',
              paddingTop: 10,
              textAlign: 'center',
              height: 128,
              overflowY: 'auto',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(192, 216, 240, 0.25) transparent',
            }}
          >
            {displayText ? (
              <p
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '1.05rem',
                  lineHeight: 1.7,
                  color: transcript
                    ? 'rgba(220, 245, 255, 0.95)'
                    : 'rgba(192, 216, 240, 0.45)',
                  letterSpacing: '0.04em',
                  margin: 0,
                  transition: 'color 0.2s',
                }}
              >
                {displayText}
              </p>
            ) : (
              <p
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '0.75rem',
                  letterSpacing: '0.2em',
                  color: 'rgba(192, 216, 240, 0.2)',
                  margin: 0,
                  textTransform: 'uppercase',
                  animation: 'pulse 1.8s ease-in-out infinite',
                }}
              >
                listening_
              </p>
            )}
          </motion.div>

          {/* Hint */}
          <p
            style={{
              position: 'absolute',
              bottom: 24,
              fontFamily: "'Space Mono', monospace",
              fontSize: 9,
              letterSpacing: '0.15em',
              color: 'rgba(192, 216, 240, 0.15)',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            esc to cancel
          </p>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
