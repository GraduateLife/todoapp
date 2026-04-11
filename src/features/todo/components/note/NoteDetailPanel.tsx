import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useRef, useState, useEffect, useCallback } from 'react'
import { imeGuard } from '@/lib/utils'
import type { Todo, Attachment, Priority, Reminder } from '../../types'
import type { NoteStyleEntry } from '../../constants/noteColors'
import { USER_PRIORITIES } from '../../constants/priority'

interface NoteDetailPanelProps {
  todo: Todo
  ns: NoteStyleEntry
  isOpen: boolean
  cardRect: DOMRect | null
  onClose: () => void
  onUpdateTitle: (title: string) => void
  onUpdateDescription: (desc: string) => void
  onSetPriority: (priority: Priority) => void
  onToggleSubTask: (subtaskId: string) => void
  onDeleteSubTask: (subtaskId: string) => void
  onAddSubTask: (title: string) => void
  onUpdateSubTask: (subtaskId: string, title: string) => void
  onAddAttachment: (attachment: Attachment) => void
  onRemoveAttachment: (attachmentId: string) => void
  onClearReminder: () => void
  onSetReminder: (reminder: Reminder) => void
}

const PRIORITY_LABELS: Record<Priority, string> = {
  high: 'urgent',
  normal: 'todo',
  low: 'minor',
  idea: 'idea',
  system: 'system',
}

const PRIORITY_HEX: Record<Priority, string> = {
  high: '#ff2d78',
  normal: '#ffb800',
  low: '#39ff14',
  idea: '#bf5fff',
  system: '#00f5ff',
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

function SectionLabel({ ns, children, noMargin }: { ns: NoteStyleEntry; children: React.ReactNode; noMargin?: boolean }) {
  return (
    <div
      style={{
        color: ns.dim,
        fontFamily: "'Space Mono', monospace",
        fontSize: 9,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        marginBottom: noMargin ? 0 : 10,
      }}
    >
      {children}
    </div>
  )
}

function TimelineRow({ label, value, ns, dimValue }: { label: string; value: string; ns: NoteStyleEntry; dimValue?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
      <span
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.12em',
          color: ns.dim,
          width: 70,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 11,
          color: dimValue ? ns.dim : ns.text,
          opacity: dimValue ? 0.5 : 0.85,
          letterSpacing: '0.06em',
        }}
      >
        {value}
      </span>
    </div>
  )
}

function HoverButton({ ns, onClick, children, style }: { ns: NoteStyleEntry; onClick: () => void; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <button
      onClick={onClick}
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
        ...style,
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.color = ns.border
        ;(e.currentTarget as HTMLButtonElement).style.borderColor = ns.border
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.color = ns.dim
        ;(e.currentTarget as HTMLButtonElement).style.borderColor = ns.dim
      }}
    >
      {children}
    </button>
  )
}

// ─── Reminder helpers ──────────────────────────────────────────────────────

function formatCountdown(ms: number): string {
  const abs = Math.abs(ms)
  const totalSec = Math.ceil(abs / 1000)
  const d = Math.floor(totalSec / 86400)
  const h = Math.floor((totalSec % 86400) / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

const SOURCE_LABELS: Record<string, string> = {
  manual: 'one-shot',
  recurring: 'recurring',
  ai: 'ai',
}

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

/**
 * Parse a compact duration string like "15m", "1h", "3d", "1h30m", "2d12h".
 * Returns milliseconds, or null if invalid.
 */
function parseDuration(input: string): number | null {
  const trimmed = input.trim().toLowerCase()
  if (!trimmed) return null
  let total = 0
  let matched = false
  const regex = /(\d+(?:\.\d+)?)\s*(d|h|m|s)/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(trimmed)) !== null) {
    matched = true
    const val = parseFloat(match[1])
    switch (match[2]) {
      case 'd': total += val * 86_400_000; break
      case 'h': total += val * 3_600_000; break
      case 'm': total += val * 60_000; break
      case 's': total += val * 1_000; break
    }
  }
  // Also accept plain number as minutes
  if (!matched && /^\d+(\.\d+)?$/.test(trimmed)) {
    total = parseFloat(trimmed) * 60_000
    matched = true
  }
  return matched && total > 0 ? total : null
}

function ReminderSection({ todo, ns, onClear, onSet }: { todo: Todo; ns: NoteStyleEntry; onClear: () => void; onSet: (r: Reminder) => void }) {
  const now = useNow()
  const r = todo.reminder

  // ── Inline creation state ────────────────────────────────────────────────
  const [mode, setMode] = useState<'oneshot' | 'recurring' | null>(null)
  const [durationInput, setDurationInput] = useState('')
  const [deadlineInput, setDeadlineInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (mode) inputRef.current?.focus()
  }, [mode])

  const handleSubmit = () => {
    const ms = parseDuration(durationInput)
    if (!ms) return
    if (mode === 'recurring') {
      const deadline = deadlineInput ? new Date(deadlineInput).getTime() : undefined
      onSet({ source: 'recurring', triggers: [Date.now() + ms], interval: ms, deadline })
    } else {
      onSet({ source: 'manual', triggers: [Date.now() + ms] })
    }
    setMode(null)
    setDurationInput('')
    setDeadlineInput('')
  }

  const handleCancel = () => {
    setMode(null)
    setDurationInput('')
    setDeadlineInput('')
  }

  const handleKeyDown = imeGuard((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
    if (e.key === 'Escape') handleCancel()
  })

  // ── No reminder → show inline creation ───────────────────────────────────
  if (!r || r.triggers.length === 0) {
    const modeStyle = (active: boolean) => ({
      background: 'transparent',
      border: `1px solid ${active ? ns.border : ns.dim}`,
      color: active ? ns.border : ns.dim,
      fontFamily: "'Space Mono', monospace" as const,
      fontSize: 12,
      padding: '3px 8px',
      cursor: 'pointer' as const,
      borderRadius: 2,
      boxShadow: active ? `0 0 8px ${ns.glow}` : 'none',
      transition: 'all 0.15s',
    })

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Mode selectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button style={modeStyle(mode === 'oneshot')} onClick={() => setMode(mode === 'oneshot' ? null : 'oneshot')}>→</button>
          <button style={modeStyle(mode === 'recurring')} onClick={() => setMode(mode === 'recurring' ? null : 'recurring')}>↻</button>
          {!mode && (
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: ns.dim, opacity: 0.4, letterSpacing: '0.06em' }}>
              one-shot / recurring
            </span>
          )}
        </div>

        {/* Inline input (appears when mode selected) */}
        {mode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: ns.dim, flexShrink: 0 }}>
                {mode === 'oneshot' ? '→' : '↻'}
              </span>
              <input
                ref={inputRef}
                type="text"
                value={durationInput}
                onChange={(e) => setDurationInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="15m, 1h, 3d..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  color: ns.text,
                  border: 'none',
                  borderBottom: `1px solid ${ns.border}`,
                  outline: 'none',
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 12,
                  caretColor: ns.border,
                  letterSpacing: '0.06em',
                }}
              />
            </div>
            {mode === 'recurring' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: ns.dim, flexShrink: 0 }}>
                  until
                </span>
                <input
                  type="datetime-local"
                  value={deadlineInput}
                  onChange={(e) => setDeadlineInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    color: ns.text,
                    border: 'none',
                    borderBottom: `1px solid ${ns.border}`,
                    outline: 'none',
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 11,
                    caretColor: ns.border,
                    colorScheme: 'dark',
                  }}
                />
              </div>
            )}
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: ns.dim, opacity: 0.4 }}>
              enter to confirm · esc to cancel
            </span>
          </div>
        )}
      </div>
    )
  }

  // ── Has reminder → show status ───────────────────────────────────────────
  const next = r.triggers[0]
  const delta = next - now
  const isOverdue = delta <= 0

  const typeLabel = SOURCE_LABELS[r.source] ?? r.source
  const intervalLabel = r.source === 'recurring' && r.interval
    ? ` ↻ ${formatCountdown(r.interval)}`
    : ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Type badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.12em',
            color: ns.border,
            border: `1px solid ${ns.border}`,
            borderRadius: 2,
            padding: '2px 6px',
            textTransform: 'uppercase',
          }}
        >
          [{typeLabel}{intervalLabel}]
        </span>
        <HoverButton ns={ns} onClick={onClear}>[clear]</HoverButton>
      </div>

      {/* Next trigger countdown */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: '0.12em', color: ns.dim, width: 70, flexShrink: 0 }}>
          next
        </span>
        <span style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 11,
          color: isOverdue ? '#ff3030' : ns.text,
          opacity: 0.85,
          letterSpacing: '0.06em',
          textShadow: isOverdue ? '0 0 6px rgba(255,48,48,0.5)' : 'none',
        }}>
          {isOverdue ? `overdue by ${formatCountdown(delta)}` : `→ in ${formatCountdown(delta)}`}
        </span>
      </div>

      {/* Deadline (if set) */}
      {r.deadline && (
        <TimelineRow
          label="deadline"
          value={
            new Date(r.deadline).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })
            + ' ' +
            new Date(r.deadline).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
          }
          ns={ns}
        />
      )}

      {/* All upcoming triggers (if more than 1) */}
      {r.triggers.length > 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 2 }}>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: ns.dim, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            upcoming ({r.triggers.length})
          </span>
          <div style={{ maxHeight: 80, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }} className="rf-scrollbar">
            {r.triggers.map((ts, i) => (
              <span key={i} style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 10,
                color: ts <= now ? '#ff3030' : ns.text,
                opacity: 0.7,
                letterSpacing: '0.06em',
              }}>
                {i === 0 ? '→ ' : '  '}
                {new Date(ts).toLocaleString('en-US', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}
                {' '}({ts <= now ? 'overdue' : `in ${formatCountdown(ts - now)}`})
              </span>
            ))}
          </div>
        </div>
      )}
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
  onSetPriority,
  onToggleSubTask,
  onDeleteSubTask,
  onAddSubTask,
  onUpdateSubTask,
  onAddAttachment,
  onRemoveAttachment,
  onClearReminder,
  onSetReminder,
}: NoteDetailPanelProps) {
  const [desc, setDesc] = useState(todo.description ?? '')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(todo.title)
  const [isAddingSubTask, setIsAddingSubTask] = useState(false)
  const [newSubTaskTitle, setNewSubTaskTitle] = useState('')
  const [editingSubTaskId, setEditingSubTaskId] = useState<string | null>(null)
  const [editingSubTaskValue, setEditingSubTaskValue] = useState('')
  const addSubTaskRef = useRef<HTMLInputElement>(null)
  const editSubTaskRef = useRef<HTMLInputElement>(null)
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

  // Focus add/edit subtask inputs
  useEffect(() => { if (isAddingSubTask) addSubTaskRef.current?.focus() }, [isAddingSubTask])
  useEffect(() => { if (editingSubTaskId) editSubTaskRef.current?.focus() }, [editingSubTaskId])

  const handleAddSubTaskSubmit = () => {
    const trimmed = newSubTaskTitle.trim()
    if (trimmed) { onAddSubTask(trimmed); setNewSubTaskTitle('') }
  }
  const handleAddSubTaskKeyDown = imeGuard((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAddSubTaskSubmit()
    if (e.key === 'Escape') { setIsAddingSubTask(false); setNewSubTaskTitle('') }
  })
  const saveSubTaskEdit = () => {
    if (!editingSubTaskId) return
    const trimmed = editingSubTaskValue.trim()
    if (trimmed) onUpdateSubTask(editingSubTaskId, trimmed)
    setEditingSubTaskId(null); setEditingSubTaskValue('')
  }
  const handleEditSubTaskKeyDown = imeGuard((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') saveSubTaskEdit()
    if (e.key === 'Escape') { setEditingSubTaskId(null); setEditingSubTaskValue('') }
  })

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
                  {/* ── Priority ─────────────────────────────────── */}
                  <section>
                    <SectionLabel ns={ns}>// priority</SectionLabel>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {USER_PRIORITIES.map((p) => {
                        const active = todo.priority === p
                        const hex = PRIORITY_HEX[p]
                        return (
                          <button
                            key={p}
                            onClick={() => onSetPriority(p)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              background: 'transparent',
                              border: `1px solid ${active ? hex : ns.dim}`,
                              borderRadius: 2,
                              padding: '5px 10px',
                              cursor: 'pointer',
                              transition: 'border-color 0.15s, box-shadow 0.15s',
                              boxShadow: active ? `0 0 8px ${hex}66` : 'none',
                            }}
                          >
                            <span
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: '50%',
                                background: active ? hex : 'transparent',
                                border: `1.5px solid ${hex}`,
                                boxShadow: active ? `0 0 6px ${hex}` : 'none',
                                flexShrink: 0,
                              }}
                            />
                            <span
                              style={{
                                fontFamily: "'Space Mono', monospace",
                                fontSize: 10,
                                letterSpacing: '0.14em',
                                textTransform: 'uppercase',
                                color: active ? hex : ns.dim,
                              }}
                            >
                              {PRIORITY_LABELS[p]}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </section>

                  {/* ── Description ──────────────────────────────── */}
                  <section>
                    <SectionLabel ns={ns}>// description</SectionLabel>
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

                  {/* ── Subtasks ─────────────────────────────────── */}
                  <section>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <SectionLabel ns={ns} noMargin>// subtasks</SectionLabel>
                      {todo.subtasks.length > 0 && (
                        <span
                          style={{
                            fontFamily: "'Space Mono', monospace",
                            fontSize: 10,
                            color: ns.dim,
                            letterSpacing: '0.1em',
                          }}
                        >
                          [{todo.subtasks.filter((s) => s.completed).length}/{todo.subtasks.length}]
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    {todo.subtasks.length > 0 && (
                      <div
                        style={{
                          height: 2,
                          background: `${ns.dim}40`,
                          borderRadius: 1,
                          marginBottom: 10,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${(todo.subtasks.filter((s) => s.completed).length / todo.subtasks.length) * 100}%`,
                            height: '100%',
                            background: ns.border,
                            boxShadow: `0 0 4px ${ns.glow}`,
                            transition: 'width 300ms ease',
                          }}
                        />
                      </div>
                    )}

                    {/* Subtask list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {todo.subtasks.map((s) => (
                        <div
                          key={s.id}
                          className="group"
                          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                        >
                          <button
                            onClick={() => onToggleSubTask(s.id)}
                            style={{
                              width: 13,
                              height: 13,
                              flexShrink: 0,
                              border: `1px solid ${ns.border}`,
                              background: s.completed ? `${ns.border}30` : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              borderRadius: 1,
                              padding: 0,
                            }}
                          >
                            {s.completed && (
                              <span style={{ color: ns.check, fontSize: 8, lineHeight: 1, fontFamily: 'monospace' }}>✕</span>
                            )}
                          </button>

                          {editingSubTaskId === s.id ? (
                            <input
                              ref={editSubTaskRef}
                              type="text"
                              value={editingSubTaskValue}
                              onChange={(e) => setEditingSubTaskValue(e.target.value)}
                              onKeyDown={handleEditSubTaskKeyDown}
                              onBlur={saveSubTaskEdit}
                              style={{
                                flex: 1,
                                background: 'transparent',
                                color: ns.text,
                                border: 'none',
                                borderBottom: `1px solid ${ns.border}`,
                                outline: 'none',
                                fontFamily: "'Space Mono', monospace",
                                fontSize: 12,
                                caretColor: ns.border,
                              }}
                            />
                          ) : (
                            <span
                              onDoubleClick={() => {
                                if (!s.completed) {
                                  setEditingSubTaskId(s.id)
                                  setEditingSubTaskValue(s.title)
                                }
                              }}
                              style={{
                                flex: 1,
                                fontFamily: "'Space Mono', monospace",
                                fontSize: 12,
                                color: ns.text,
                                opacity: s.completed ? 0.4 : 0.85,
                                textDecoration: s.completed ? 'line-through' : 'none',
                                cursor: s.completed ? 'default' : 'text',
                                wordBreak: 'break-word',
                              }}
                            >
                              {s.title}
                            </span>
                          )}

                          <button
                            onClick={() => onDeleteSubTask(s.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ff3030',
                              fontFamily: "'Space Mono', monospace",
                              fontSize: 10,
                              lineHeight: 1,
                              cursor: 'pointer',
                              flexShrink: 0,
                              padding: 0,
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add subtask */}
                    {isAddingSubTask ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                        <span style={{ color: ns.dim, fontFamily: 'monospace', fontSize: 10, flexShrink: 0 }}>+</span>
                        <input
                          ref={addSubTaskRef}
                          type="text"
                          value={newSubTaskTitle}
                          onChange={(e) => setNewSubTaskTitle(e.target.value)}
                          onKeyDown={handleAddSubTaskKeyDown}
                          onBlur={() => { handleAddSubTaskSubmit(); setIsAddingSubTask(false); setNewSubTaskTitle('') }}
                          placeholder="new subtask..."
                          style={{
                            flex: 1,
                            background: 'transparent',
                            color: ns.text,
                            border: 'none',
                            borderBottom: `1px solid ${ns.border}`,
                            outline: 'none',
                            fontFamily: "'Space Mono', monospace",
                            fontSize: 12,
                            caretColor: ns.border,
                          }}
                        />
                      </div>
                    ) : (
                      <HoverButton ns={ns} onClick={() => setIsAddingSubTask(true)} style={{ marginTop: 6 }}>
                        [+ subtask]
                      </HoverButton>
                    )}
                  </section>

                  {/* ── Reminder ──────────────────────────────────── */}
                  <section>
                    <SectionLabel ns={ns}>// reminder</SectionLabel>
                    <ReminderSection todo={todo} ns={ns} onClear={onClearReminder} onSet={onSetReminder} />
                  </section>

                  {/* ── Timeline ─────────────────────────────────── */}
                  <section>
                    <SectionLabel ns={ns}>// timeline</SectionLabel>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <TimelineRow label="created" value={
                        new Date(todo.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })
                        + ' ' +
                        new Date(todo.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
                      } ns={ns} />
                      <TimelineRow label="updated" value={
                        todo.updatedAt && todo.updatedAt !== todo.createdAt
                          ? new Date(todo.updatedAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })
                            + ' ' +
                            new Date(todo.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
                          : '——'
                      } ns={ns} dimValue={!todo.updatedAt || todo.updatedAt === todo.createdAt} />
                      <TimelineRow label="due" value={
                        todo.reminder?.deadline
                          ? new Date(todo.reminder.deadline).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })
                            + ' ' +
                            new Date(todo.reminder.deadline).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
                          : '——'
                      } ns={ns} dimValue={!todo.reminder?.deadline} />
                    </div>
                  </section>

                  {/* ── Attachments ──────────────────────────────── */}
                  <section>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <SectionLabel ns={ns} noMargin>// attachments</SectionLabel>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="*/*"
                        multiple
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                      />
                      <HoverButton ns={ns} onClick={() => fileInputRef.current?.click()}>
                        [+]
                      </HoverButton>
                    </div>

                    {todo.attachments.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
