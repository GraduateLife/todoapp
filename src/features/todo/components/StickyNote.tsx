import { motion, useMotionValue } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'
import { TodoContextMenu } from './TodoContextMenu'
import type { Todo, NoteColor } from '../types'

// ─── Color palettes per note color ──────────────────────────────────────────
const NOTE_STYLES: Record<
  NoteColor,
  { bg: string; border: string; glow: string; text: string; dim: string; check: string }
> = {
  cyan: {
    bg: '#04161b',
    border: '#00f5ff',
    glow: 'rgba(0,245,255,0.35)',
    text: '#9ae8f0',
    dim: 'rgba(0,245,255,0.45)',
    check: '#00f5ff',
  },
  pink: {
    bg: '#1c040f',
    border: '#ff2d78',
    glow: 'rgba(255,45,120,0.35)',
    text: '#f0a0be',
    dim: 'rgba(255,45,120,0.45)',
    check: '#ff2d78',
  },
  amber: {
    bg: '#181000',
    border: '#ffb800',
    glow: 'rgba(255,184,0,0.35)',
    text: '#f0d890',
    dim: 'rgba(255,184,0,0.45)',
    check: '#ffb800',
  },
  green: {
    bg: '#041604',
    border: '#39ff14',
    glow: 'rgba(57,255,20,0.35)',
    text: '#9cf09a',
    dim: 'rgba(57,255,20,0.45)',
    check: '#39ff14',
  },
  purple: {
    bg: '#0e0418',
    border: '#bf5fff',
    glow: 'rgba(191,95,255,0.35)',
    text: '#d4a8f4',
    dim: 'rgba(191,95,255,0.45)',
    check: '#bf5fff',
  },
}

const DELETE_ZONE_OFFSET = 120 // px from bottom of viewport

interface StickyNoteProps {
  todo: Todo
  onMove: (id: string, x: number, y: number) => void
  onBringToFront: (id: string) => void
  onDelete: (id: string) => void
  onToggle: (id: string) => void
  onUpdateTitle: (id: string, title: string) => void
}

export function StickyNote({
  todo,
  onMove,
  onBringToFront,
  onDelete,
  onToggle,
  onUpdateTitle,
}: StickyNoteProps) {
  const initX = todo.position?.x ?? 120
  const initY = todo.position?.y ?? 120
  const color: NoteColor = todo.color ?? 'cyan'
  const rotation = todo.rotation ?? 0

  const x = useMotionValue(initX)
  const y = useMotionValue(initY)

  const [isInDeleteZone, setIsInDeleteZone] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(todo.title)
  const [contextMenu, setContextMenu] = useState<{
    open: boolean
    pos: { x: number; y: number }
  }>({ open: false, pos: { x: 0, y: 0 } })

  useEffect(() => {
    setEditValue(todo.title)
  }, [todo.title])

  const ns = NOTE_STYLES[color]

  const handleDragStart = useCallback(() => {
    onBringToFront(todo.id)
  }, [todo.id, onBringToFront])

  const handleDrag = useCallback(() => {
    const inZone = typeof window !== 'undefined'
      ? y.get() > window.innerHeight - DELETE_ZONE_OFFSET
      : false
    setIsInDeleteZone(inZone)
  }, [y])

  const handleDragEnd = useCallback(() => {
    if (typeof window !== 'undefined' && y.get() > window.innerHeight - DELETE_ZONE_OFFSET) {
      onDelete(todo.id)
    } else {
      onMove(todo.id, x.get(), y.get())
      setIsInDeleteZone(false)
    }
  }, [todo.id, x, y, onMove, onDelete])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    onBringToFront(todo.id)
    setContextMenu({ open: true, pos: { x: e.clientX, y: e.clientY } })
  }, [todo.id, onBringToFront])

  const saveEdit = useCallback(() => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== todo.title) {
      onUpdateTitle(todo.id, trimmed)
    } else {
      setEditValue(todo.title)
    }
    setIsEditing(false)
  }, [editValue, todo.title, todo.id, onUpdateTitle])

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') saveEdit()
      if (e.key === 'Escape') {
        setEditValue(todo.title)
        setIsEditing(false)
      }
    },
    [saveEdit, todo.title]
  )

  const borderColor = isInDeleteZone ? '#ff3030' : ns.border
  const bgColor = isInDeleteZone ? 'rgba(255,30,30,0.12)' : ns.bg
  const glowColor = isInDeleteZone ? 'rgba(255,48,48,0.5)' : ns.glow

  return (
    <>
      <motion.div
        drag
        dragMomentum={false}
        style={{
          x,
          y,
          rotate: rotation,
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: todo.zIndex,
          width: 256,
          touchAction: 'none',
        }}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{
          scale: isInDeleteZone ? 0.82 : 1,
          opacity: isInDeleteZone ? 0.65 : 1,
        }}
        exit={{ scale: 0.3, opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        onContextMenu={handleContextMenu}
        onPointerDown={() => onBringToFront(todo.id)}
        className="cursor-grab active:cursor-grabbing select-none"
      >
        {/* Note card */}
        <div
          style={{
            background: bgColor,
            border: `1px solid ${borderColor}`,
            boxShadow: `0 0 18px ${glowColor}, 0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)`,
          }}
          className="relative rounded-[3px] p-4 overflow-hidden"
        >
          {/* Corner bracket decorations */}
          <span
            style={{ color: ns.dim }}
            className="absolute top-[5px] left-[5px] font-mono text-[9px] leading-none pointer-events-none opacity-70"
          >
            ┌─
          </span>
          <span
            style={{ color: ns.dim }}
            className="absolute top-[5px] right-[5px] font-mono text-[9px] leading-none pointer-events-none opacity-70"
          >
            ─┐
          </span>
          <span
            style={{ color: ns.dim }}
            className="absolute bottom-[5px] left-[5px] font-mono text-[9px] leading-none pointer-events-none opacity-70"
          >
            └─
          </span>
          <span
            style={{ color: ns.dim }}
            className="absolute bottom-[5px] right-[5px] font-mono text-[9px] leading-none pointer-events-none opacity-70"
          >
            ─┘
          </span>

          {/* Header row */}
          <div
            style={{ borderBottom: `1px solid ${ns.dim}` }}
            className="flex items-center justify-between pb-2 mb-3"
          >
            <span
              style={{ color: ns.dim }}
              className="font-mono text-[9px] tracking-[0.18em] uppercase"
            >
              {todo.completed ? '// done' : '// todo'}
            </span>
            <span
              style={{
                background: borderColor,
                boxShadow: `0 0 6px ${glowColor}`,
              }}
              className="w-[6px] h-[6px] rounded-full block"
            />
          </div>

          {/* Content row: checkbox + title */}
          <div className="flex items-start gap-3 min-h-[40px]">
            {/* Checkbox */}
            <button
              type="button"
              onClick={() => onToggle(todo.id)}
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                width: 14,
                height: 14,
                flexShrink: 0,
                marginTop: 3,
                border: `1px solid ${borderColor}`,
                background: todo.completed ? `${borderColor}30` : 'transparent',
                boxShadow: todo.completed ? `0 0 6px ${glowColor}` : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                borderRadius: 1,
              }}
            >
              {todo.completed && (
                <span style={{ color: ns.check, fontSize: 9, lineHeight: 1 }} className="font-mono">
                  ✕
                </span>
              )}
            </button>

            {/* Title (editable) */}
            <div className="flex-1 min-w-0">
              {isEditing && !todo.completed ? (
                <input
                  autoFocus
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={saveEdit}
                  onKeyDown={handleEditKeyDown}
                  onPointerDown={(e) => e.stopPropagation()}
                  style={{
                    background: 'transparent',
                    color: ns.text,
                    border: 'none',
                    borderBottom: `1px solid ${ns.border}`,
                    outline: 'none',
                    width: '100%',
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '0.8rem',
                    lineHeight: 1.5,
                    caretColor: ns.border,
                  }}
                />
              ) : (
                <span
                  onDoubleClick={() => !todo.completed && setIsEditing(true)}
                  style={{
                    color: ns.text,
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '0.8rem',
                    lineHeight: 1.5,
                    display: 'block',
                    wordBreak: 'break-word',
                    opacity: todo.completed ? 0.45 : 1,
                    textDecoration: todo.completed ? 'line-through' : 'none',
                    cursor: todo.completed ? 'default' : 'text',
                  }}
                >
                  {todo.title || 'Untitled'}
                </span>
              )}
            </div>
          </div>

          {/* Footer row */}
          <div
            style={{
              borderTop: `1px solid ${ns.dim}`,
              color: ns.dim,
            }}
            className="mt-3 pt-2 flex items-center justify-between"
          >
            <span className="font-mono text-[8px] opacity-60">
              {new Date(todo.createdAt).toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: '2-digit',
              })}
            </span>
            {todo.attachments.length > 0 && (
              <span className="font-mono text-[8px] opacity-60">
                [{todo.attachments.length}]
              </span>
            )}
          </div>

          {/* Scanline overlay */}
          <div
            className="pointer-events-none absolute inset-0 rounded-[3px]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.07) 3px, rgba(0,0,0,0.07) 4px)',
            }}
          />

          {/* Delete zone overlay */}
          {isInDeleteZone && (
            <div className="absolute inset-0 flex items-center justify-center rounded-[3px] bg-[rgba(255,30,30,0.08)]">
              <span
                className="font-mono text-[11px] tracking-[0.2em] uppercase animate-pulse"
                style={{ color: '#ff4444', textShadow: '0 0 8px #ff3030' }}
              >
                [ delete ]
              </span>
            </div>
          )}
        </div>
      </motion.div>

      <TodoContextMenu
        open={contextMenu.open}
        position={contextMenu.pos}
        onClose={() => setContextMenu((p) => ({ ...p, open: false }))}
        onDelete={() => onDelete(todo.id)}
      />
    </>
  )
}
