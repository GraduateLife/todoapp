import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useRef, useState, useEffect, useCallback } from 'react'
import type { Todo, Attachment } from '../../types'
import type { NoteStyleEntry } from '../../constants/noteColors'

interface NoteDetailPanelProps {
  todo: Todo
  ns: NoteStyleEntry
  isOpen: boolean
  cardRect: DOMRect | null
  onClose: () => void
  onUpdateDescription: (desc: string) => void
  onAddAttachment: (attachment: Attachment) => void
  onRemoveAttachment: (attachmentId: string) => void
}

const ATTACHMENT_TYPES = [
  { label: '+ image', accept: 'image/*', type: 'image' as const },
  { label: '+ audio', accept: 'audio/*', type: 'voice' as const },
  { label: '+ video', accept: 'video/*', type: 'video' as const },
  { label: '+ file', accept: '*/*', type: 'file' as const },
]

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
          style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }}
        />
      )}
      {attachment.type === 'voice' && (
        <audio
          controls
          src={attachment.url}
          style={{ height: 32, flexShrink: 0, maxWidth: 160, filter: 'invert(0.8)' }}
        />
      )}
      {attachment.type === 'video' && (
        <video
          src={attachment.url}
          style={{ width: 80, height: 48, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }}
          controls
        />
      )}
      {attachment.type === 'file' && (
        <span
          style={{ color: ns.dim, fontFamily: "'Space Mono', monospace", fontSize: 11 }}
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
  onUpdateDescription,
  onAddAttachment,
  onRemoveAttachment,
}: NoteDetailPanelProps) {
  const [desc, setDesc] = useState(todo.description ?? '')
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const savedRect = useRef<DOMRect | null>(null)

  // Capture the rect when panel opens
  useEffect(() => {
    if (isOpen && cardRect) {
      savedRect.current = cardRect
    }
  }, [isOpen])

  // Sync description when todo changes from outside
  useEffect(() => {
    setDesc(todo.description ?? '')
  }, [todo.id])

  const handleDescBlur = useCallback(() => {
    onUpdateDescription(desc)
  }, [desc, onUpdateDescription])

  const handleFileChange = useCallback(
    (type: Attachment['type'], e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        const url = ev.target?.result as string
        onAddAttachment({
          id: crypto.randomUUID(),
          type,
          url,
          name: file.name,
        })
      }
      reader.readAsDataURL(file)
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
                width: typeof window !== 'undefined' ? window.innerWidth : '100vw',
                height: typeof window !== 'undefined' ? window.innerHeight : '100vh',
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span
                    style={{
                      color: ns.dim,
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 10,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                    }}
                  >
                    inspect //
                  </span>
                  <span
                    style={{
                      color: ns.text,
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 13,
                      letterSpacing: '0.06em',
                    }}
                  >
                    {todo.title || 'Untitled'}
                  </span>
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
                    ;(e.currentTarget as HTMLButtonElement).style.color = ns.border
                    ;(e.currentTarget as HTMLButtonElement).style.borderColor = ns.border
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.color = ns.dim
                    ;(e.currentTarget as HTMLButtonElement).style.borderColor = ns.dim
                  }}
                >
                  [ back ]
                </button>
              </div>

              {/* Body */}
              <div
                style={{
                  flex: 1,
                  overflow: 'auto',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 28,
                  position: 'relative',
                  zIndex: 1,
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
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    onBlur={handleDescBlur}
                    placeholder="> describe your idea, context, constraints..."
                    rows={6}
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
                      resize: 'vertical',
                      caretColor: ns.border,
                      boxSizing: 'border-box',
                      transition: 'border-color 0.15s',
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
                      color: ns.dim,
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 9,
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      marginBottom: 10,
                    }}
                  >
                    // attachments
                  </div>

                  {/* Existing attachments */}
                  {todo.attachments.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        marginBottom: 12,
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

                  {/* Add buttons */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {ATTACHMENT_TYPES.map(({ label, accept, type }) => (
                      <div key={type}>
                        <input
                          ref={(el) => { fileInputRefs.current[type] = el }}
                          type="file"
                          accept={accept}
                          style={{ display: 'none' }}
                          onChange={(e) => handleFileChange(type, e)}
                        />
                        <button
                          onClick={() => fileInputRefs.current[type]?.click()}
                          style={{
                            background: 'transparent',
                            border: `1px solid ${ns.dim}`,
                            color: ns.dim,
                            fontFamily: "'Space Mono', monospace",
                            fontSize: 10,
                            letterSpacing: '0.1em',
                            padding: '5px 10px',
                            cursor: 'pointer',
                            borderRadius: 2,
                            transition: 'color 0.15s, border-color 0.15s',
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
                          [{label}]
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )

  return createPortal(content, document.body)
}
