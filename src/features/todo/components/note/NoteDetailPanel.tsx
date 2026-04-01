import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useRef, useState, useEffect, useCallback } from 'react'
import { imeGuard } from '@/lib/utils'
import type { Todo, Attachment } from '../../types'
import type { NoteStyleEntry } from '../../constants/noteColors'

interface NoteDetailPanelProps {
  todo: Todo
  ns: NoteStyleEntry
  isOpen: boolean
  cardRect: DOMRect | null
  onClose: () => void
  onUpdateTitle: (title: string) => void
  onUpdateDescription: (desc: string) => void
  onAddAttachment: (attachment: Attachment) => void
  onRemoveAttachment: (attachmentId: string) => void
}

const IMAGE_EXTS = new Set([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'svg',
  'bmp',
  'tiff',
  'avif',
])
const AUDIO_EXTS = new Set(['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'opus'])
const VIDEO_EXTS = new Set(['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v'])

function detectAttachmentType(filename: string): Attachment['type'] {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  if (IMAGE_EXTS.has(ext)) return 'image'
  if (AUDIO_EXTS.has(ext)) return 'voice'
  if (VIDEO_EXTS.has(ext)) return 'video'
  return 'file'
}

function AudioPlayer({ src, ns }: { src: string; ns: NoteStyleEntry }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onDurationChange = () => setDuration(audio.duration)
    const onEnded = () => setIsPlaying(false)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('durationchange', onDurationChange)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('durationchange', onDurationChange)
      audio.removeEventListener('ended', onEnded)
    }
  }, [])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play()
      setIsPlaying(true)
    }
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    audio.currentTime = ratio * duration
  }

  const fmt = (t: number) => {
    if (!isFinite(t)) return '0:00'
    const m = Math.floor(t / 60)
    const s = Math.floor(t % 60)
      .toString()
      .padStart(2, '0')
    return `${m}:${s}`
  }

  const progress = duration > 0 ? currentTime / duration : 0

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
    >
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        onClick={toggle}
        style={{
          background: 'transparent',
          border: `1px solid ${ns.dim}`,
          color: ns.text,
          cursor: 'pointer',
          fontFamily: "'Space Mono', monospace",
          fontSize: 10,
          padding: '2px 6px',
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        {isPlaying ? '■' : '▶'}
      </button>
      <div
        onClick={seek}
        style={{
          width: 80,
          height: 3,
          background: ns.dim + '40',
          cursor: 'pointer',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${progress * 100}%`,
            background: ns.text,
          }}
        />
      </div>
      <span
        style={{
          color: ns.dim,
          fontFamily: "'Space Mono', monospace",
          fontSize: 9,
          flexShrink: 0,
        }}
      >
        {fmt(currentTime)}/{fmt(duration)}
      </span>
    </div>
  )
}

function AttachmentPreview({
  attachment,
  ns,
  onRemove,
}: {
  attachment: Attachment
  ns: NoteStyleEntry
  onRemove: () => void
}) {
  return (
    <div
      style={{
        border: `1px solid ${ns.dim}`,
        borderRadius: 2,
        padding: '6px 8px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        position: 'relative',
      }}
    >
      {attachment.type === 'image' && (
        <img
          src={attachment.url}
          alt={attachment.name}
          style={{
            width: 48,
            height: 48,
            objectFit: 'cover',
            borderRadius: 2,
            flexShrink: 0,
          }}
        />
      )}
      {attachment.type === 'voice' && (
        <AudioPlayer src={attachment.url} ns={ns} />
      )}
      {attachment.type === 'video' && (
        <video
          src={attachment.url}
          style={{
            width: 80,
            height: 48,
            objectFit: 'cover',
            borderRadius: 2,
            flexShrink: 0,
          }}
          controls
        />
      )}
      {attachment.type === 'file' && (
        <span
          style={{
            color: ns.dim,
            fontFamily: "'Space Mono', monospace",
            fontSize: 11,
          }}
        >
          [file]
        </span>
      )}
      <span
        style={{
          color: ns.text,
          fontFamily: "'Space Mono', monospace",
          fontSize: 10,
          opacity: 0.7,
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {attachment.name}
      </span>
      <button
        onClick={onRemove}
        style={{
          background: 'transparent',
          border: 'none',
          color: ns.dim,
          cursor: 'pointer',
          fontFamily: "'Space Mono', monospace",
          fontSize: 10,
          padding: '0 2px',
          flexShrink: 0,
        }}
      >
        [×]
      </button>
    </div>
  )
}

export function NoteDetailPanel({
  todo,
  ns,
  isOpen,
  cardRect,
  onClose,
  onUpdateTitle,
  onUpdateDescription,
  onAddAttachment,
  onRemoveAttachment,
}: NoteDetailPanelProps) {
  const [desc, setDesc] = useState(todo.description ?? '')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(todo.title)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const savedRect = useRef<DOMRect | null>(null)

  const autoGrow = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [])

  // Capture the rect when panel opens
  useEffect(() => {
    if (isOpen && cardRect) {
      savedRect.current = cardRect
    }
  }, [isOpen])

  // Sync when todo changes from outside
  useEffect(() => {
    setDesc(todo.description ?? '')
    setTitleValue(todo.title)
  }, [todo.id])

  // Auto-grow textarea when panel opens or content loads
  useEffect(() => {
    if (isOpen) setTimeout(() => autoGrow(textareaRef.current), 50)
  }, [isOpen, desc])

  const handleDescBlur = useCallback(() => {
    onUpdateDescription(desc)
  }, [desc, onUpdateDescription])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? [])
      files.forEach((file) => {
        const type = detectAttachmentType(file.name)
        const reader = new FileReader()
        reader.onload = (ev) => {
          onAddAttachment({
            id: crypto.randomUUID(),
            type,
            url: ev.target?.result as string,
            name: file.name,
          })
        }
        reader.readAsDataURL(file)
      })
      e.target.value = ''
    },
    [onAddAttachment],
  )

  const rect = savedRect.current ?? cardRect

  const panelInitial = rect
    ? {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        rotateY: 90,
        opacity: 1,
      }
    : { left: '50%', top: '50%', width: 0, height: 0, rotateY: 90, opacity: 0 }

  const content = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.72)',
              zIndex: 9800,
              backdropFilter: 'blur(2px)',
            }}
          />

          {/* Perspective wrapper */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              perspective: 1200,
              pointerEvents: 'none',
              zIndex: 9801,
            }}
          >
            <motion.div
              key="panel"
              initial={panelInitial}
              animate={{
                left: 0,
                top: 0,
                width:
                  typeof window !== 'undefined' ? window.innerWidth : '100vw',
                height:
                  typeof window !== 'undefined' ? window.innerHeight : '100vh',
                rotateY: 0,
                opacity: 1,
              }}
              exit={{
                left: rect?.left ?? 0,
                top: rect?.top ?? 0,
                width: rect?.width ?? 256,
                height: rect?.height ?? 160,
                rotateY: -90,
                opacity: 0,
              }}
              transition={{
                duration: 0.52,
                ease: [0.16, 1, 0.3, 1],
              }}
              style={{
                position: 'absolute',
                background: ns.bg.replace(/[\d.]+\)$/, '0.97)'),
                border: `1px solid ${ns.border}`,
                boxShadow: `0 0 60px ${ns.glow}, 0 0 120px ${ns.glow}, inset 0 1px 0 rgba(255,255,255,0.05)`,
                overflow: 'hidden',
                pointerEvents: 'auto',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Scanlines overlay */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.05) 3px, rgba(0,0,0,0.05) 4px)',
                  zIndex: 0,
                }}
              />

              {/* Header */}
              <div
                style={{
                  borderBottom: `1px solid ${ns.dim}`,
                  padding: '16px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexShrink: 0,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      color: ns.dim,
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 10,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      flexShrink: 0,
                    }}
                  >
                    inspect //
                  </span>
                  {isEditingTitle ? (
                    <input
                      autoFocus
                      className="mx-2"
                      value={titleValue}
                      onChange={(e) => setTitleValue(e.target.value)}
                      onBlur={() => {
                        const trimmed = titleValue.trim()
                        if (trimmed) onUpdateTitle(trimmed)
                        else setTitleValue(todo.title)
                        setIsEditingTitle(false)
                      }}
                      onKeyDown={imeGuard((e) => {
                        if (e.key === 'Enter')
                          (e.target as HTMLInputElement).blur()
                        if (e.key === 'Escape') {
                          setTitleValue(todo.title)
                          setIsEditingTitle(false)
                        }
                      })}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        borderBottom: `1px solid ${ns.border}`,
                        outline: 'none',
                        color: ns.text,
                        fontFamily: "'Space Mono', monospace",
                        fontSize: 13,
                        letterSpacing: '0.06em',
                        caretColor: ns.border,
                        flex: 1,
                        minWidth: 0,
                      }}
                    />
                  ) : (
                    <span
                      onDoubleClick={() => setIsEditingTitle(true)}
                      title="double-click to edit"
                      className="mx-2"
                      style={{
                        color: ns.text,
                        fontFamily: "'Space Mono', monospace",
                        fontSize: 13,
                        letterSpacing: '0.06em',
                        cursor: 'text',
                        flex: 1,
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {titleValue || 'Untitled'}
                    </span>
                  )}
                </div>
                <button
                  onClick={onClose}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${ns.dim}`,
                    color: ns.dim,
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 11,
                    letterSpacing: '0.1em',
                    padding: '4px 10px',
                    cursor: 'pointer',
                    borderRadius: 2,
                    transition: 'color 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.color =
                      ns.border
                    ;(e.currentTarget as HTMLButtonElement).style.borderColor =
                      ns.border
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.color = ns.dim
                    ;(e.currentTarget as HTMLButtonElement).style.borderColor =
                      ns.dim
                  }}
                >
                  [ back ]
                </button>
              </div>

              {/* Body — full width for scrollbar to hug screen edge */}
              <div
                className="rf-scrollbar"
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <div
                  style={{
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 28,
                    maxWidth: 720,
                    width: '100%',
                    margin: '0 auto',
                  }}
                >
                  {/* Description */}
                  <section>
                    <div
                      style={{
                        color: ns.dim,
                        fontFamily: "'Space Mono', monospace",
                        fontSize: 9,
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        marginBottom: 10,
                      }}
                    >
                      // description
                    </div>
                    <textarea
                      ref={textareaRef}
                      value={desc}
                      onChange={(e) => {
                        setDesc(e.target.value)
                        autoGrow(e.target)
                      }}
                      onBlur={handleDescBlur}
                      placeholder="> describe your idea, context, constraints..."
                      rows={3}
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: `1px solid ${ns.dim}`,
                        borderRadius: 2,
                        color: ns.text,
                        fontFamily: "'Space Mono', monospace",
                        fontSize: 12,
                        lineHeight: 1.7,
                        padding: '12px 14px',
                        outline: 'none',
                        resize: 'none',
                        overflow: 'hidden',
                        caretColor: ns.border,
                        boxSizing: 'border-box',
                        transition: 'border-color 0.15s',
                        minHeight: 80,
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = ns.border
                      }}
                      onBlurCapture={(e) => {
                        e.currentTarget.style.borderColor = ns.dim
                      }}
                    />
                  </section>

                  {/* Attachments */}
                  <section>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 10,
                      }}
                    >
                      <span
                        style={{
                          color: ns.dim,
                          fontFamily: "'Space Mono', monospace",
                          fontSize: 9,
                          letterSpacing: '0.2em',
                          textTransform: 'uppercase',
                        }}
                      >
                        // attachments
                      </span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="*/*"
                        multiple
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          background: 'transparent',
                          border: `1px solid ${ns.dim}`,
                          color: ns.dim,
                          fontFamily: "'Space Mono', monospace",
                          fontSize: 10,
                          letterSpacing: '0.1em',
                          padding: '3px 8px',
                          cursor: 'pointer',
                          borderRadius: 2,
                          transition: 'color 0.15s, border-color 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          ;(e.currentTarget as HTMLButtonElement).style.color =
                            ns.border
                          ;(
                            e.currentTarget as HTMLButtonElement
                          ).style.borderColor = ns.border
                        }}
                        onMouseLeave={(e) => {
                          ;(e.currentTarget as HTMLButtonElement).style.color =
                            ns.dim
                          ;(
                            e.currentTarget as HTMLButtonElement
                          ).style.borderColor = ns.dim
                        }}
                      >
                        [+]
                      </button>
                    </div>

                    {todo.attachments.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                        }}
                      >
                        {todo.attachments.map((att) => (
                          <AttachmentPreview
                            key={att.id}
                            attachment={att}
                            ns={ns}
                            onRemove={() => onRemoveAttachment(att.id)}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                </div>
                {/* inner padding div */}
              </div>
              {/* scroll container */}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )

  return createPortal(content, document.body)
}
