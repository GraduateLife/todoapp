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
import {
  condenseTodo,
  splitTodo,
  CHAR_LIMIT,
  type SplitResult,
} from '../../services/condense'

interface VoiceInputOverlayProps {
  isOpen: boolean
  onClose: () => void
  selectedColor: NoteColor | 'random'
  onColorChange: (color: NoteColor | 'random') => void
}

function waveformColor(selectedColor: NoteColor | 'random'): string {
  const opt = COLOR_OPTIONS.find((o) => o.key === selectedColor)
  const hex = opt?.hex ?? '#00f5ff'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},0.85)`
}

type AiStatus = 'idle' | 'condensing' | 'splitting'

export function VoiceInputOverlay({
  isOpen,
  onClose,
  selectedColor,
  onColorChange,
}: VoiceInputOverlayProps) {
  const [transcript, setTranscript] = useState('')
  const [interim, setInterim] = useState('')
  const [isReplaying, setIsReplaying] = useState(false)

  // AI processing state
  const [aiStatus, setAiStatus] = useState<AiStatus>('idle')
  const [condensedText, setCondensedText] = useState('')
  const [splitResult, setSplitResult] = useState<SplitResult | null>(null)
  const [lastAiAction, setLastAiAction] = useState<'condense' | 'split' | null>(
    null,
  )

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
      setCondensedText('')
      setSplitResult(null)
      setAiStatus('idle')
      setLastAiAction(null)
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

  // ── Actions ──────────────────────────────────────────────────────────────

  const handleCreate = useCallback(() => {
    stopVoice()
    stopAnalyser()
    if (splitResult) {
      TodoService.createFromVoiceWithSubtasks(
        splitResult.title,
        splitResult.subtasks,
      )
    } else {
      const final = (condensedText || transcript).trim()
      if (final) TodoService.createFromVoice(final)
    }
    revokeAudio()
    onClose()
  }, [
    stopVoice,
    stopAnalyser,
    splitResult,
    condensedText,
    transcript,
    revokeAudio,
    onClose,
  ])

  const handleCancel = useCallback(() => {
    stopVoice()
    stopAnalyser()
    audioObjRef.current?.pause()
    if (mockReplayTimerRef.current) clearTimeout(mockReplayTimerRef.current)
    revokeAudio()
    onClose()
  }, [stopVoice, stopAnalyser, revokeAudio, onClose])

  const handleCondense = useCallback(() => {
    if (!transcript || aiStatus !== 'idle') return
    setAiStatus('condensing')
    setLastAiAction('condense')
    condenseTodo(transcript)
      .then((result) => {
        setCondensedText(result)
        setSplitResult(null)
        setAiStatus('idle')
      })
      .catch(() => setAiStatus('idle'))
  }, [transcript, aiStatus])

  const handleSplit = useCallback(() => {
    if (!transcript || aiStatus !== 'idle') return
    setAiStatus('splitting')
    setLastAiAction('split')
    splitTodo(transcript)
      .then((result) => {
        setSplitResult(result)
        setCondensedText('')
        setAiStatus('idle')
      })
      .catch(() => setAiStatus('idle'))
  }, [transcript, aiStatus])

  const handleRetry = useCallback(() => {
    if (!lastAiAction || aiStatus !== 'idle') return
    if (lastAiAction === 'condense') {
      setAiStatus('condensing')
      condenseTodo(transcript)
        .then((result) => {
          setCondensedText(result)
          setSplitResult(null)
          setAiStatus('idle')
        })
        .catch(() => setAiStatus('idle'))
    } else {
      setAiStatus('splitting')
      splitTodo(transcript)
        .then((result) => {
          setSplitResult(result)
          setCondensedText('')
          setAiStatus('idle')
        })
        .catch(() => setAiStatus('idle'))
    }
  }, [lastAiAction, aiStatus, transcript])

  const handleUndo = useCallback(() => {
    setCondensedText('')
    setSplitResult(null)
  }, [])

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

  // ── Derived state ────────────────────────────────────────────────────────

  const isListening = voiceState === 'listening'
  const color = waveformColor(selectedColor)
  const showPlayButton = VOICE_MOCK || !!audioUrl
  const isLong = transcript.length > CHAR_LIMIT
  const hasAiResult = !!condensedText || !!splitResult
  const isProcessing = aiStatus !== 'idle'

  if (typeof document === 'undefined') return null

  // ── Button style helpers ─────────────────────────────────────────────────

  const btnBase: React.CSSProperties = {
    fontFamily: "'Space Mono', monospace",
    fontSize: 11,
    letterSpacing: '0.14em',
    background: 'transparent',
    padding: '4px',
    cursor: 'pointer',
    transition: 'border-color 0.15s, color 0.15s',
  }
  const dimColor = 'rgba(192, 216, 240, 0.35)'
  const dimBorder = 'rgba(192, 216, 240, 0.15)'

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
          <>
            {/* ── Close button (top-left) ───────────────────────────────────── */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.2 }}
              onClick={handleCancel}
              style={{
                position: 'absolute',
                top: 20,
                left: 24,
                fontFamily: "'Space Mono', monospace",
                fontSize: 13,
                background: 'transparent',
                border: 'none',
                color: 'rgba(192, 216, 240, 0.25)',
                cursor: 'pointer',
                padding: '4px 6px',
                letterSpacing: '0.05em',
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'rgba(192, 216, 240, 0.75)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(192, 216, 240, 0.25)'
              }}
            >
              ✕
            </motion.button>

            {/* ── Waveform row ─────────────────────────────────────────────── */}
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
                      ...btnBase,
                      fontSize: 13,
                      padding: 0,
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isReplaying ? color : 'rgba(192,216,240,0.45)',
                      border: `1px solid ${isReplaying ? color.replace('0.85)', '0.35)') : dimBorder}`,
                    }}
                    onMouseEnter={(e) => {
                      if (!isReplaying) {
                        e.currentTarget.style.color = 'rgba(192,216,240,0.85)'
                        e.currentTarget.style.borderColor =
                          'rgba(192,216,240,0.4)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isReplaying) {
                        e.currentTarget.style.color = 'rgba(192,216,240,0.45)'
                        e.currentTarget.style.borderColor = dimBorder
                      }
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
                width: '90%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
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
                  onColorChange={onColorChange}
                  hideRandom
                />
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {/* AI action buttons — only for long text without result yet */}
                {transcript && isLong && !hasAiResult && !isProcessing && (
                  <>
                    <button
                      onClick={handleCondense}
                      style={{
                        ...btnBase,
                        color: dimColor,
                        border: `1px solid ${dimBorder}`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'rgba(192,216,240,0.7)'
                        e.currentTarget.style.borderColor =
                          'rgba(192,216,240,0.4)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = dimColor
                        e.currentTarget.style.borderColor = dimBorder
                      }}
                    >
                      [ condense ]
                    </button>
                    <button
                      onClick={handleSplit}
                      style={{
                        ...btnBase,
                        color: dimColor,
                        border: `1px solid ${dimBorder}`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'rgba(192,216,240,0.7)'
                        e.currentTarget.style.borderColor =
                          'rgba(192,216,240,0.4)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = dimColor
                        e.currentTarget.style.borderColor = dimBorder
                      }}
                    >
                      [ split ]
                    </button>
                  </>
                )}

                {/* Processing indicator */}
                {isProcessing && (
                  <span
                    style={{
                      ...btnBase,
                      cursor: 'default',
                      color: color,
                      opacity: 0.5,
                      border: `1px solid ${color.replace('0.85)', '0.2)')}`,
                      animation: 'pulse 1.2s ease-in-out infinite',
                    }}
                  >
                    {aiStatus === 'condensing'
                      ? '[ condensing ]'
                      : '[ splitting ]'}
                  </span>
                )}

                {/* Undo + Retry — after AI result */}
                {hasAiResult && !isProcessing && (
                  <>
                    <button
                      onClick={handleRetry}
                      style={{
                        ...btnBase,
                        color: dimColor,
                        border: `1px solid ${dimBorder}`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'rgba(192,216,240,0.7)'
                        e.currentTarget.style.borderColor =
                          'rgba(192,216,240,0.4)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = dimColor
                        e.currentTarget.style.borderColor = dimBorder
                      }}
                    >
                      [ retry ]
                    </button>
                    <button
                      onClick={handleUndo}
                      style={{
                        ...btnBase,
                        color: dimColor,
                        border: `1px solid ${dimBorder}`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'rgba(192,216,240,0.7)'
                        e.currentTarget.style.borderColor =
                          'rgba(192,216,240,0.4)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = dimColor
                        e.currentTarget.style.borderColor = dimBorder
                      }}
                    >
                      [ undo ]
                    </button>
                  </>
                )}

                {/* Create todo — always shown when there's a transcript */}
                {transcript &&
                  !isProcessing &&
                  (() => {
                    const warnCreate = isLong && !hasAiResult
                    const warnColor = 'rgba(255, 180, 50, 0.85)'
                    const warnBorder = 'rgba(255, 180, 50, 0.45)'
                    const warnBorderHover = 'rgba(255, 180, 50, 0.9)'
                    return (
                      <button
                        onClick={handleCreate}
                        title={
                          warnCreate
                            ? `文字超过 ${CHAR_LIMIT} 字符，创建后将被截断。建议先 condense 或 split。`
                            : undefined
                        }
                        style={{
                          ...btnBase,
                          color: warnCreate ? warnColor : color,
                          border: `1px solid ${warnCreate ? warnBorder : color.replace('0.85)', '0.45)')}`,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = warnCreate
                            ? warnBorderHover
                            : color.replace('0.85)', '0.9)')
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = warnCreate
                            ? warnBorder
                            : color.replace('0.85)', '0.45)')
                        }}
                      >
                        {warnCreate ? '[ create ⚠ ]' : '[ create ]'}
                      </button>
                    )
                  })()}

                {/* <button
                onClick={handleCancel}
                style={{
                  ...btnBase,
                  color: dimColor,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'rgba(192,216,240,0.7)'
                  e.currentTarget.style.borderColor = 'rgba(192,216,240,0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = dimColor
                  e.currentTarget.style.borderColor = dimBorder
                }}
              >
                [ x ]
              </button> */}
              </div>
            </motion.div>

            {/* ── Transcript / Result ──────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              style={{
                width: '80%',
                marginTop: 20,
                textAlign: 'center',
                height: 128,
                overflowY: 'auto',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(192, 216, 240, 0.25) transparent',
                position: 'relative',
              }}
            >
              {/* Char counter — only when transcript is long and no AI result yet */}
              {transcript && isLong && !hasAiResult && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    right: 4,
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 8,
                    letterSpacing: '0.1em',
                    color: 'rgba(255, 180, 50, 0.6)',
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}
                >
                  {transcript.length} / {CHAR_LIMIT}
                </span>
              )}

              {splitResult ? (
                /* Split result: title + subtask list */
                <div style={{ textAlign: 'left', padding: '0 10%' }}>
                  <p
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: '1rem',
                      lineHeight: 1.6,
                      color: 'rgba(220, 245, 255, 0.95)',
                      letterSpacing: '0.04em',
                      margin: '0 0 8px',
                    }}
                  >
                    {splitResult.title}
                  </p>
                  {splitResult.subtasks.map((s, i) => (
                    <p
                      key={i}
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: '0.8rem',
                        lineHeight: 1.5,
                        color: 'rgba(192, 216, 240, 0.6)',
                        letterSpacing: '0.03em',
                        margin: '2px 0',
                        paddingLeft: 12,
                      }}
                    >
                      {'- '}
                      {s.title}
                    </p>
                  ))}
                </div>
              ) : condensedText || transcript || interim ? (
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
                    opacity: isProcessing ? 0.4 : 1,
                  }}
                >
                  {condensedText || transcript || interim}
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
          </>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
