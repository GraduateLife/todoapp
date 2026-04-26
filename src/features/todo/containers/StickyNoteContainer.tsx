import { useMotionValue } from 'framer-motion'
import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { imeGuard } from '@/lib/utils'
import { REMINDER_SHAKE_DISTANCE } from '@/lib/limits'
import { useIsShared } from '#/features/share/hooks/useSharedIds'
import { useDragZones } from '../hooks/useDragZones'
import { NOTE_STYLES, LIGHT_NOTE_STYLES } from '../constants/noteColors'
import { priorityToColor } from '../constants/priority'
import {
  STACK_TARGET_ALPHA,
  EDGE_ZONE_GLOW_SIZE,
  ZONE_VISUALS,
  buildBoxShadow,
  extractRGB,
  rgbaString,
  computeCardGlow,
} from '../constants/glow'
import { TITLE_MAX_LEN } from '../components/input-bar'
import { useTheme } from '../hooks/useTheme'
import { StickyNote } from '../components/StickyNote'
import { NoteDetailPanel } from '../components/note/NoteDetailPanel'
import { useTodoStore } from '../store/todoStore'
import type { ReminderVisualState } from '../components/StickyNote'
import type { Todo, NoteColor, Priority, Attachment } from '../types'

interface StickyNoteContainerProps {
  todo: Todo
  onMove: (id: string, x: number, y: number) => void
  onBringToFront: (id: string) => void
  onDelete: (id: string) => void
  onToggle: (id: string) => void
  onUpdateTitle: (id: string, title: string) => void
  onArchive: (id: string) => void
  onAddSubTask: (id: string, title: string) => void
  onToggleSubTask: (id: string, subtaskId: string) => void
  onDeleteSubTask: (id: string, subtaskId: string) => void
  onUpdateSubTask: (id: string, subtaskId: string, title: string) => void
  onRequestExport: (id: string) => void
  onManageShare: (id: string) => void
  zIndexOverride?: number
  otherNotes: Array<{ id: string; position: { x: number; y: number } }>
  isStackTarget: boolean
  stackedNotes: Todo[]
  isExpanded: boolean
  onStackTargetChange: (targetId: string | null) => void
  onDropOnNote: (targetId: string) => void
  onToggleExpand: () => void
  onDisbandStack: () => void
}

export function StickyNoteContainer({
  todo,
  onMove,
  onBringToFront,
  onDelete,
  onToggle,
  onUpdateTitle,
  onArchive,
  onAddSubTask,
  onToggleSubTask,
  onDeleteSubTask,
  onUpdateSubTask,
  onRequestExport,
  onManageShare,
  zIndexOverride,
  otherNotes,
  isStackTarget,
  stackedNotes,
  isExpanded,
  onStackTargetChange,
  onDropOnNote,
  onToggleExpand,
  onDisbandStack,
}: StickyNoteContainerProps) {
  const isShared = useIsShared(todo.id)
  const priority: Priority = todo.priority
  // Color is always derived from priority. We tolerate a stale `todo.color`
  // in memory (e.g. legacy data from before the refactor) by preferring the
  // derived value, so cards can't render mismatched hue+priority.
  const color: NoteColor = priorityToColor(priority)
  const rotation = todo.rotation
  const theme = useTheme()

  // Tick every 30s so glow reacts to overdue transitions without perf cost
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  const reminderState: ReminderVisualState = useMemo(() => {
    const r = todo.reminder
    if (!r) return 'none'

    // Fired and awaiting dismiss
    if (r.firedAt) return 'stale'

    // Has future triggers — active
    if (r.triggers.length > 0) {
      const next = r.triggers[0]
      return next <= now ? 'stale' : 'active'
    }

    return 'none'
  }, [todo.reminder, now])

  // ─── Motion values ────────────────────────────────────────────────────────
  const x = useMotionValue(todo.position.x)
  const y = useMotionValue(todo.position.y)

  // ─── Drag zone logic ──────────────────────────────────────────────────────
  const {
    handleDragStart,
    handleDrag,
    handleDragEnd,
    isInBottomZone,
    isInTopZone,
    glitchIntensity,
    isInStackZone,
  } = useDragZones({
    todoId: todo.id,
    x,
    y,
    isExpanded,
    otherNotes,
    onMove,
    onDelete,
    onArchive,
    onRequestExport,
    onBringToFront,
    onDropOnNote,
    onStackTargetChange,
    onToggleExpand,
  })

  // ─── Shake-to-dismiss (stale reminder) ─────────────────────────────────────
  const dismissReminder = useTodoStore((s) => s.dismissReminder)
  const dragStartPos = useRef<{ x: number; y: number } | null>(null)

  const wrappedDragStart = useCallback(() => {
    dragStartPos.current = { x: x.get(), y: y.get() }
    handleDragStart()
  }, [handleDragStart, x, y])

  const wrappedDragEnd = useCallback(() => {
    // Capture position before handleDragEnd potentially modifies things
    const endX = x.get()
    const endY = y.get()
    handleDragEnd()
    if (reminderState === 'stale' && dragStartPos.current) {
      const dx = endX - dragStartPos.current.x
      const dy = endY - dragStartPos.current.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > 0 && dist <= REMINDER_SHAKE_DISTANCE) {
        dismissReminder(todo.id)
      }
    }
    dragStartPos.current = null
  }, [handleDragEnd, reminderState, todo.id, dismissReminder, x, y])

  // ─── Editing state ────────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(todo.title)
  const [isAddingSubTask, setIsAddingSubTask] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [inspectRect, setInspectRect] = useState<DOMRect | null>(null)

  const updateDescription = useTodoStore((s) => s.updateDescription)
  const setPriority = useTodoStore((s) => s.setPriority)
  const addAttachment = useTodoStore((s) => s.addAttachment)
  const removeAttachment = useTodoStore((s) => s.removeAttachment)
  const setReminder = useTodoStore((s) => s.setReminder)

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
    imeGuard((e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') saveEdit()
      if (e.key === 'Escape') {
        setEditValue(todo.title)
        setIsEditing(false)
      }
    }),
    [saveEdit, todo.title],
  )

  // Right-click on a card is intentionally a no-op: we used to open a
  // TodoContextMenu here but it was unintuitive enough to be archived.
  // We still prevent the browser's native menu and stop propagation so the
  // canvas right-click handler (which opens the quick-task ContextInput)
  // doesn't fire when the user's cursor happens to be over a card.
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  // ─── Style computation ────────────────────────────────────────────────────
  const ns = (theme === 'light' ? LIGHT_NOTE_STYLES : NOTE_STYLES)[color]
  const [r, g, b] = extractRGB(ns.glow)

  // Reminder-driven baseline glow (will vary once reminder system lands).
  const cardGlow = computeCardGlow(reminderState, ns.glow)

  // Derive archive vs delete from bottom zone + glitch
  const isInDeleteZone = isInBottomZone && glitchIntensity > 0
  const isInArchiveZone = isInBottomZone && glitchIntensity === 0
  const isInExportZone = isInTopZone
  const isInZone = isInBottomZone || isInTopZone || isInStackZone

  // Resolve which zone we're in (if any).
  const activeZone = isInDeleteZone
    ? ZONE_VISUALS.delete
    : isInArchiveZone
      ? ZONE_VISUALS.archive
      : isInExportZone
        ? ZONE_VISUALS.export
        : ZONE_VISUALS.stack
  const zoneColor = activeZone.color
  const zoneGlow = activeZone.glow

  // Build zone label — delete phase shows a progress bar
  const zoneLabel = isInDeleteZone
    ? (() => {
        const total = 5
        const filled = Math.min(total, Math.ceil(glitchIntensity * total))
        const bar = '▓'.repeat(filled) + '░'.repeat(total - filled)
        return `[ delete ${bar} ]`
      })()
    : activeZone.label

  const borderColor = isInZone
    ? zoneColor
    : isStackTarget
      ? ns.border
      : ns.border
  const bgColor = isInDeleteZone
    ? 'rgba(255,30,30,0.12)'
    : isInArchiveZone
      ? 'rgba(255,30,30,0.12)'
      : isInExportZone
        ? 'rgba(255,184,0,0.10)'
        : ns.bg
  const glowColor = isInZone
    ? zoneGlow
    : isStackTarget
      ? rgbaString(r, g, b, STACK_TARGET_ALPHA)
      : cardGlow.glowColor
  const glowSize = isInZone || isStackTarget
    ? EDGE_ZONE_GLOW_SIZE
    : cardGlow.glowSize
  const boxShadow = buildBoxShadow(glowColor, glowSize)

  const stackCount = stackedNotes.length

  const handleInspect = useCallback((rect: DOMRect) => {
    setInspectRect(rect)
    setIsDetailOpen(true)
  }, [])

  return (
    <>
    <StickyNote
      todo={todo}
      x={x}
      y={y}
      rotation={rotation}
      zIndexOverride={zIndexOverride}
      ns={ns}
      stackTargetShadow={`0 0 10px ${ns.glow}, 0 0 4px rgba(0,0,0,0.6)`}
      borderColor={borderColor}
      bgColor={bgColor}
      glowColor={glowColor}
      boxShadow={boxShadow}
      baselineGlow={cardGlow.glowColor}
      reminderState={reminderState}
      isInZone={isInZone}
      isInDeleteZone={isInDeleteZone}
      isInArchiveZone={isInArchiveZone}
      isInExportZone={isInExportZone}
      glitchIntensity={glitchIntensity}
      isInStackZone={isInStackZone}
      zoneColor={zoneColor}
      zoneLabel={zoneLabel}
      isStackTarget={isStackTarget}
      stackedNotes={stackedNotes}
      isExpanded={isExpanded}
      stackCount={stackCount}
      isEditing={isEditing}
      editValue={editValue}
      isAddingSubTask={isAddingSubTask}
      isShared={isShared}
      onShareCornerClick={() => onManageShare(todo.id)}
      onDragStart={wrappedDragStart}
      onDrag={handleDrag}
      onDragEnd={wrappedDragEnd}
      onContextMenu={handleContextMenu}
      onBringToFront={() => onBringToFront(todo.id)}
      onToggle={() => onToggle(todo.id)}
      onStartEdit={() => setIsEditing(true)}
      onEditChange={(v) => setEditValue(v.slice(0, TITLE_MAX_LEN))}
      onSaveEdit={saveEdit}
      onEditKeyDown={handleEditKeyDown}
      onToggleSubTask={(subtaskId) => onToggleSubTask(todo.id, subtaskId)}
      onDeleteSubTask={(subtaskId) => onDeleteSubTask(todo.id, subtaskId)}
      onAddSubTask={(title) => onAddSubTask(todo.id, title)}
      onUpdateSubTask={(subtaskId, title) =>
        onUpdateSubTask(todo.id, subtaskId, title)
      }
      onAddingSubTaskClose={() => setIsAddingSubTask(false)}
      onToggleExpand={onToggleExpand}
      onInspect={handleInspect}
    />
    <NoteDetailPanel
      todo={todo}
      ns={ns}
      isOpen={isDetailOpen}
      cardRect={inspectRect}
      onClose={() => setIsDetailOpen(false)}
      onUpdateTitle={(title) => onUpdateTitle(todo.id, title)}
      onUpdateDescription={(desc) => updateDescription(todo.id, desc)}
      onSetPriority={(p) => setPriority(todo.id, p)}
      onToggleSubTask={(subtaskId) => onToggleSubTask(todo.id, subtaskId)}
      onDeleteSubTask={(subtaskId) => onDeleteSubTask(todo.id, subtaskId)}
      onAddSubTask={(title) => onAddSubTask(todo.id, title)}
      onUpdateSubTask={(subtaskId, title) => onUpdateSubTask(todo.id, subtaskId, title)}
      onAddAttachment={(att: Attachment) => addAttachment(todo.id, att)}
      onRemoveAttachment={(attId) => removeAttachment(todo.id, attId)}
      onClearReminder={() => setReminder(todo.id, null)}
      onSetReminder={(reminder) => setReminder(todo.id, reminder)}
    />
    </>
  )
}
