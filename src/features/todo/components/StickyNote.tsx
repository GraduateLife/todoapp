import { motion, useMotionValue } from 'framer-motion'
import { useState, useCallback, useRef } from 'react'
import { TodoContextMenu } from './TodoContextMenu'
import { SubTaskList } from './note/SubTaskList'
import { useUiStore } from '../store/uiStore'
import { TITLE_MAX_LEN } from './TodoInput'
import type { Todo, NoteColor, Priority } from '../types'

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

// ─── Priority modifiers ──────────────────────────────────────────────────────
const PRIORITY_GLOW: Record<Priority, number> = {
  low: 6,
  normal: 18,
  high: 32,
}

const PRIORITY_BORDER_OPACITY: Record<Priority, number> = {
  low: 0.45,
  normal: 1,
  high: 1,
}

const DELETE_ZONE_OFFSET = 160  // px from bottom of viewport
const ARCHIVE_ZONE_OFFSET = 48  // px from top of viewport — must clear the header
const REMINDER_ZONE_OFFSET = 80 // px from right of viewport
const FOLDER_ZONE_OFFSET = 80   // px from left of viewport

// How close (px) another note's center needs to be for stack detection
const STACK_HIT_W = 200
const STACK_HIT_H = 140

interface StickyNoteProps {
  todo: Todo
  onMove: (id: string, x: number, y: number) => void
  onBringToFront: (id: string) => void
  onDelete: (id: string) => void
  onToggle: (id: string) => void
  onUpdateTitle: (id: string, title: string) => void
  onSetPriority: (id: string, priority: Priority) => void
  onArchive: (id: string) => void
  onAddSubTask: (id: string, title: string) => void
  onToggleSubTask: (id: string, subtaskId: string) => void
  onDeleteSubTask: (id: string, subtaskId: string) => void
  onUpdateSubTask: (id: string, subtaskId: string, title: string) => void
  onRequestReminder: (id: string) => void
  onRequestFolder: (id: string) => void
  zIndexOverride?: number
  // ── Stack props ────────────────────────────────────────────────────────────
  otherNotes: Array<{ id: string; position: { x: number; y: number } }>
  isStackTarget: boolean
  stackedNotes: Todo[]
  isExpanded: boolean
  onStackTargetChange: (targetId: string | null) => void
  onDropOnNote: (targetId: string) => void
  onToggleExpand: () => void
  onDisbandStack: () => void
}

export function StickyNote({
  todo,
  onMove,
  onBringToFront,
  onDelete,
  onToggle,
  onUpdateTitle,
  onSetPriority,
  onArchive,
  onAddSubTask,
  onToggleSubTask,
  onDeleteSubTask,
  onUpdateSubTask,
  onRequestReminder,
  onRequestFolder,
  zIndexOverride,
  otherNotes,
  isStackTarget,
  stackedNotes,
  isExpanded,
  onStackTargetChange,
  onDropOnNote,
  onToggleExpand,
  onDisbandStack,
}: StickyNoteProps) {
  const initX = todo.position?.x ?? 120
  const initY = todo.position?.y ?? 120
  const color: NoteColor = todo.color ?? 'cyan'
  const rotation = todo.rotation ?? 0
  const priority: Priority = todo.priority ?? 'normal'

  const x = useMotionValue(initX)
  const y = useMotionValue(initY)
  const setDragging = useUiStore((s) => s.setDragging)

  const [isInDeleteZone, setIsInDeleteZone] = useState(false)
  const [isInArchiveZone, setIsInArchiveZone] = useState(false)
  const [isInReminderZone, setIsInReminderZone] = useState(false)
  const [isInFolderZone, setIsInFolderZone] = useState(false)
  const [isInStackZone, setIsInStackZone] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(todo.title)
  const [isAddingSubTask, setIsAddingSubTask] = useState(false)
  const [contextMenu, setContextMenu] = useState<{
    open: boolean
    pos: { x: number; y: number }
  }>({ open: false, pos: { x: 0, y: 0 } })

  // Ref to track current stack target without stale closure issues
  const stackTargetRef = useRef<string | null>(null)

  const ns = NOTE_STYLES[color]

  // ─── Priority-adjusted styles ──────────────────────────────────────────────
  const glowSize = PRIORITY_GLOW[priority]
  const borderOpacity = PRIORITY_BORDER_OPACITY[priority]

  const glowAlphaMap: Record<Priority, number> = { low: 0.15, normal: 0.35, high: 0.65 }
  const glowAlpha = glowAlphaMap[priority]
  const rgbMatch = ns.glow.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  const [r, g, b] = rgbMatch ? [rgbMatch[1], rgbMatch[2], rgbMatch[3]] : ['0', '245', '255']
  const adjustedGlow = `rgba(${r},${g},${b},${glowAlpha})`

  const adjustedBorder =
    borderOpacity < 1
      ? `rgba(${r},${g},${b},${borderOpacity})`
      : ns.border

  // ─── Drag zone states ──────────────────────────────────────────────────────
  const handleDragStart = useCallback(() => {
    setDragging(true)
    onBringToFront(todo.id)
    // Collapse the fan when dragging starts
    if (isExpanded) onToggleExpand()
  }, [todo.id, onBringToFront, setDragging, isExpanded, onToggleExpand])

  const handleDrag = useCallback(() => {
    if (typeof window === 'undefined') return
    const cx = x.get() + 128 // center of 256px card
    const cy = y.get() + 90  // approximate center Y
    const inDelete = y.get() > window.innerHeight - DELETE_ZONE_OFFSET
    const inArchive = y.get() < ARCHIVE_ZONE_OFFSET
    const inReminder = cx > window.innerWidth - REMINDER_ZONE_OFFSET && !inDelete && !inArchive
    const inFolder = x.get() < FOLDER_ZONE_OFFSET && !inDelete && !inArchive

    setIsInDeleteZone(inDelete)
    setIsInArchiveZone(inArchive && !inDelete)
    setIsInReminderZone(inReminder)
    setIsInFolderZone(inFolder)

    // Stack detection — only when not in any edge zone
    if (!inDelete && !inArchive && !inReminder && !inFolder) {
      const target = otherNotes.find((n) =>
        cx > n.position.x + 28 &&
        cx < n.position.x + 28 + STACK_HIT_W &&
        cy > n.position.y + 20 &&
        cy < n.position.y + 20 + STACK_HIT_H
      )
      const newTargetId = target?.id ?? null
      if (newTargetId !== stackTargetRef.current) {
        stackTargetRef.current = newTargetId
        onStackTargetChange(newTargetId)
        setIsInStackZone(!!newTargetId)
      }
    } else {
      if (stackTargetRef.current !== null) {
        stackTargetRef.current = null
        onStackTargetChange(null)
        setIsInStackZone(false)
      }
    }
  }, [x, y, otherNotes, onStackTargetChange])

  const handleDragEnd = useCallback(() => {
    setDragging(false)
    if (typeof window === 'undefined') return
    const cx = x.get() + 128
    const inDelete = y.get() > window.innerHeight - DELETE_ZONE_OFFSET
    const inArchive = y.get() < ARCHIVE_ZONE_OFFSET
    const inReminder = cx > window.innerWidth - REMINDER_ZONE_OFFSET
    const inFolder = x.get() < FOLDER_ZONE_OFFSET

    // Stack drop (before edge zones; edge zones take precedence)
    if (!inDelete && !inArchive && !inReminder && !inFolder && stackTargetRef.current) {
      onDropOnNote(stackTargetRef.current)
      stackTargetRef.current = null
      onStackTargetChange(null)
      setIsInStackZone(false)
      return
    }

    if (inDelete) {
      onDelete(todo.id)
    } else if (inArchive) {
      onArchive(todo.id)
    } else if (inReminder) {
      onMove(todo.id, x.get(), y.get())
      onRequestReminder(todo.id)
      setIsInReminderZone(false)
    } else if (inFolder) {
      onMove(todo.id, x.get(), y.get())
      onRequestFolder(todo.id)
      setIsInFolderZone(false)
    } else {
      onMove(todo.id, x.get(), y.get())
      setIsInDeleteZone(false)
      setIsInArchiveZone(false)
      setIsInReminderZone(false)
      setIsInFolderZone(false)
    }
  }, [todo.id, x, y, onMove, onDelete, onArchive, onRequestReminder, onRequestFolder, onDropOnNote, onStackTargetChange, setDragging])

  // ─── Context menu ──────────────────────────────────────────────────────────
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    onBringToFront(todo.id)
    setContextMenu({ open: true, pos: { x: e.clientX, y: e.clientY } })
  }, [todo.id, onBringToFront])

  // ─── Inline edit ──────────────────────────────────────────────────────────
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

  // ─── Computed styles ───────────────────────────────────────────────────────
  const isInEdgeZone = isInDeleteZone || isInArchiveZone || isInReminderZone || isInFolderZone
  const isInZone = isInEdgeZone || isInStackZone

  const zoneColor = isInDeleteZone
    ? '#ff3030'
    : isInArchiveZone
      ? '#39ff14'
      : isInFolderZone
        ? '#bf5fff'
        : isInStackZone
          ? '#00f5ff'
          : '#ffb800'
  const zoneGlow = isInDeleteZone
    ? 'rgba(255,48,48,0.5)'
    : isInArchiveZone
      ? 'rgba(57,255,20,0.5)'
      : isInFolderZone
        ? 'rgba(191,95,255,0.5)'
        : isInStackZone
          ? 'rgba(0,245,255,0.5)'
          : 'rgba(255,184,0,0.5)'
  const zoneLabel = isInDeleteZone
    ? '[ delete ]'
    : isInArchiveZone
      ? '[ archive ]'
      : isInFolderZone
        ? '[ folder ]'
        : isInStackZone
          ? '[ stack ]'
          : '[ remind ]'

  // Stack target uses the note's OWN color (not cyan) — it's the receiver's identity
  const borderColor = isInZone ? zoneColor : isStackTarget ? ns.border : adjustedBorder
  const bgColor = isInDeleteZone
    ? 'rgba(255,30,30,0.12)'
    : isInArchiveZone
      ? 'rgba(57,255,20,0.08)'
      : ns.bg
  const glowColor = isInZone ? zoneGlow : isStackTarget ? `rgba(${r},${g},${b},0.65)` : adjustedGlow

  const boxShadow = `0 0 ${isInZone || isStackTarget ? 20 : glowSize}px ${glowColor}, 0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)`

  const stackCount = stackedNotes.length

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
          zIndex: zIndexOverride ?? todo.zIndex,
          width: 256,
          touchAction: 'none',
        }}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{
          scale: isInEdgeZone ? 0.82 : 1,
          opacity: isInEdgeZone ? 0.65 : priority === 'low' ? 0.8 : 1,
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
        {/* ── Ghost pile cards (behind main card, rendered first) ──────────── */}
        {!isExpanded && stackCount > 0 && Array.from({ length: stackCount }, (_, i) => {
          // Render deepest ghost first (largest offset) → shallowest last (smallest offset)
          const depth = stackCount - i   // stackCount … 1  (deepest → shallowest)
          const ghostNote = stackedNotes[i]
          const ghostNs = NOTE_STYLES[ghostNote?.color ?? 'cyan']
          const offset = depth * 3      // 3 px per layer (max 15 px for 5 stacked)
          return (
            <div
              key={ghostNote?.id ?? i}
              style={{
                position: 'absolute',
                top: `${offset}px`,
                left: `${offset}px`,
                width: 256,
                height: 160,
                background: ghostNs.bg,
                border: `1px solid ${ghostNs.border}`,
                borderRadius: 3,
                transform: `rotate(${rotation + depth * 1.5}deg)`,
                opacity: Math.max(0.08, 0.45 - (depth - 1) * 0.07),
                pointerEvents: 'none',
              }}
            />
          )
        })}

        {/* ── Reminder flowing ring (outside card border) ──────────────────── */}
        {todo.reminder && !isInZone && (
          <div
            style={{
              position: 'absolute',
              top: -8, left: -8, right: -8, bottom: -8,
              borderRadius: 10, overflow: 'hidden',
              zIndex: 0, pointerEvents: 'none',
            }}
          >
            {/* Rotating conic gradient fills the whole container */}
            <div
              style={{
                position: 'absolute',
                width: '200%', height: '200%',
                top: '-50%', left: '-50%',
                background: `conic-gradient(from 0deg, transparent 0%, transparent 55%, ${ns.border}44 65%, ${ns.border}cc 73%, ${ns.border} 78%, ${ns.border}cc 83%, ${ns.border}44 91%, transparent 100%)`,
                animation: 'rf-reminder-spin 3s linear infinite',
              }}
            />
            {/* Inner mask punches out the card area, leaving only the outer ring visible */}
            <div
              style={{
                position: 'absolute',
                top: 3, left: 3, right: 3, bottom: 3,
                borderRadius: 7,
                background: ns.bg,
              }}
            />
          </div>
        )}

        {/* ── Main note card ────────────────────────────────────────────────── */}
        <div
          style={{
            background: bgColor,
            border: `1px solid ${borderColor}`,
            boxShadow,
            position: 'relative',
            zIndex: 1,
          }}
          className="rounded-[3px] p-4 overflow-hidden"
        >
          {/* Stack-target ring — own color */}
          {isStackTarget && (
            <div
              className="absolute inset-[-3px] rounded-[5px] pointer-events-none"
              style={{
                border: `2px solid ${ns.border}`,
                boxShadow: `0 0 18px rgba(${r},${g},${b},0.6), inset 0 0 8px rgba(${r},${g},${b},0.12)`,
              }}
            />
          )}

          {/* High-priority pulsing ring */}
          {priority === 'high' && !isInZone && (
            <div
              className="absolute inset-[-2px] rounded-[4px] pointer-events-none rf-priority-ring"
              style={{ border: `1px solid ${ns.border}`, color: ns.border }}
            />
          )}


          {/* Header row */}
          <div
            style={{ borderBottom: `1px solid ${ns.dim}` }}
            className="flex items-center justify-between pb-2 mb-3"
          >
            <div className="flex items-center gap-2">
              <span style={{ color: ns.dim }} className="font-mono text-[10px] tracking-[0.18em] uppercase">
                {todo.completed ? 'done' : 'todo'}
              </span>
              {priority === 'high' && (
                <span className="font-mono text-[10px] tracking-[0.12em]" style={{ color: ns.border, textShadow: `0 0 8px ${ns.border}, 0 0 16px ${ns.border}66` }}>high [!+]</span>
              )}
              {priority === 'normal' && (
                <span className="font-mono text-[9px] tracking-[0.12em]" style={{ color: ns.border, opacity: 0.55 }}>normal [!]</span>
              )}
              {priority === 'low' && (
                <span className="font-mono text-[9px] tracking-[0.12em]" style={{ color: ns.dim, opacity: 0.4 }}>low [!-]</span>
              )}
            </div>
            <span
              style={{ background: borderColor, boxShadow: `0 0 6px ${glowColor}` }}
              className={`w-[6px] h-[6px] rounded-full block ${priority === 'high' ? 'rf-priority-ring' : ''}`}
            />
          </div>

          {/* Content row: checkbox + title */}
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => onToggle(todo.id)}
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                width: 14, height: 14, flexShrink: 0, marginTop: 3,
                border: `1px solid ${borderColor}`,
                background: todo.completed ? `${borderColor}30` : 'transparent',
                boxShadow: todo.completed ? `0 0 6px ${glowColor}` : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', borderRadius: 1,
              }}
            >
              {todo.completed && (
                <span style={{ color: ns.check, fontSize: 9, lineHeight: 1 }} className="font-mono">✕</span>
              )}
            </button>

            <div className="flex-1 min-w-0">
              {isEditing && !todo.completed ? (
                <input
                  autoFocus
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value.slice(0, TITLE_MAX_LEN))}
                  onBlur={saveEdit}
                  onKeyDown={handleEditKeyDown}
                  onPointerDown={(e) => e.stopPropagation()}
                  maxLength={TITLE_MAX_LEN}
                  style={{
                    background: 'transparent', color: ns.text, border: 'none',
                    borderBottom: `1px solid ${ns.border}`, outline: 'none',
                    width: '100%', fontFamily: "'Space Mono', monospace",
                    fontSize: '0.8rem', lineHeight: 1.5, caretColor: ns.border,
                  }}
                />
              ) : (
                <span
                  onDoubleClick={() => !todo.completed && setIsEditing(true)}
                  style={{
                    color: ns.text, fontFamily: "'Space Mono', monospace",
                    fontSize: '0.8rem', lineHeight: 1.5, display: 'block',
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

          {/* Sub-tasks */}
          <SubTaskList
            subtasks={todo.subtasks}
            borderColor={borderColor}
            textColor={ns.text}
            dimColor={ns.dim}
            checkColor={ns.check}
            glowColor={adjustedGlow}
            isAddingExternal={isAddingSubTask}
            onAddingClose={() => setIsAddingSubTask(false)}
            onToggle={(subtaskId) => onToggleSubTask(todo.id, subtaskId)}
            onDelete={(subtaskId) => onDeleteSubTask(todo.id, subtaskId)}
            onAdd={(title) => onAddSubTask(todo.id, title)}
            onUpdate={(subtaskId, title) => onUpdateSubTask(todo.id, subtaskId, title)}
          />

          {/* Footer row */}
          <div
            style={{ borderTop: `1px solid ${ns.dim}`, color: ns.dim }}
            className="mt-3 pt-2 flex items-center justify-between"
          >
            <span className="font-mono text-[10px] opacity-75">
              {new Date(todo.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })}
            </span>
            {todo.attachments.length > 0 && (
              <span className="font-mono text-[8px] opacity-60" style={{ color: ns.dim }}>
                [{todo.attachments.length}]
              </span>
            )}
          </div>

          {/* Scanline overlay */}
          <div
            className="pointer-events-none absolute inset-0 rounded-[3px]"
            style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.07) 3px, rgba(0,0,0,0.07) 4px)' }}
          />

          {/* Drag zone overlay */}
          {isInZone && (
            <div
              className="absolute inset-0 flex items-center justify-center rounded-[3px]"
              style={{
                background: isInDeleteZone
                  ? 'rgba(255,30,30,0.08)'
                  : isInArchiveZone
                    ? 'rgba(57,255,20,0.06)'
                    : isInFolderZone
                      ? 'rgba(191,95,255,0.08)'
                      : isInStackZone
                        ? 'rgba(0,245,255,0.06)'
                        : 'rgba(255,184,0,0.06)',
              }}
            >
              <span
                className="font-mono text-[11px] tracking-[0.2em] uppercase animate-pulse"
                style={{ color: zoneColor, textShadow: `0 0 8px ${zoneColor}` }}
              >
                {zoneLabel}
              </span>
            </div>
          )}
        </div>

        {/* ── Stack count badge (outside card, not clipped) ─────────────────── */}
        {stackCount > 0 && (() => {
          const ghostOffset = stackCount * 3  // 3 px × number of stacked cards
          return (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onToggleExpand() }}
            style={{
              position: 'absolute',
              top: `${ghostOffset - 8}px`,
              right: `${-(ghostOffset + 10)}px`,
              zIndex: 10,
              background: ns.border,
              color: ns.bg,
              borderRadius: '50%',
              width: 22,
              height: 22,
              fontSize: 10,
              fontFamily: "'Space Mono', monospace",
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: 'none',
              boxShadow: `0 0 10px ${ns.glow}, 0 0 4px rgba(0,0,0,0.6)`,
              letterSpacing: 0,
            }}
            title={isExpanded ? 'collapse stack' : 'expand stack'}
          >
            {stackCount + 1}
          </button>
          )
        })()}

        {/* Fan cards are rendered at canvas level to avoid overflow clipping */}
      </motion.div>

      <TodoContextMenu
        open={contextMenu.open}
        position={contextMenu.pos}
        onClose={() => setContextMenu((p) => ({ ...p, open: false }))}
        onDelete={() => onDelete(todo.id)}
        onArchive={() => onArchive(todo.id)}
        onSetPriority={(p) => onSetPriority(todo.id, p)}
        onAddSubTask={() => setIsAddingSubTask(true)}
        onSetReminder={() => onRequestReminder(todo.id)}
        onMoveToFolder={() => onRequestFolder(todo.id)}
        onDisbandStack={stackCount > 0 ? onDisbandStack : undefined}
        currentPriority={priority}
        noteColor={ns.border}
      />
    </>
  )
}
