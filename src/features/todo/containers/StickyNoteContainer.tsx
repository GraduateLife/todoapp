import { useMotionValue } from 'framer-motion'
import { useState, useCallback } from 'react'
import { imeGuard } from '@/lib/utils'
import { useDragZones } from '../hooks/useDragZones'
import { NOTE_STYLES, LIGHT_NOTE_STYLES } from '../constants/noteColors'
import { priorityToColor } from '../constants/priority'
import { TITLE_MAX_LEN } from '../components/input-bar'
import { useTheme } from '../hooks/useTheme'
import { StickyNote, type ReminderVisualState } from '../components/StickyNote'
import { NoteDetailPanel } from '../components/note/NoteDetailPanel'
import { useTodoStore } from '../store/todoStore'
import type { Todo, NoteColor, Priority, Attachment } from '../types'

// ─── Fixed visual strength ───────────────────────────────────────────────────
// Brightness used to encode priority — it no longer does. These constants
// match what `normal` priority looked like in the old priority-driven system
// and now serve as the *baseline* render for every card regardless of
// priority. Dim / pulse are re-bound to a future reminder system via the
// `reminderState` prop on StickyNote (see also: constants/priority.ts and
// MEMORY: priority_color_system).
const BASELINE_GLOW_SIZE = 18
const BASELINE_GLOW_ALPHA = 0.35

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
  onRequestReminder: (id: string) => void
  onRequestFolder: (id: string) => void
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
}: StickyNoteContainerProps) {
  const priority: Priority = todo.priority ?? 'normal'
  // Color is always derived from priority. We tolerate a stale `todo.color`
  // in memory (e.g. legacy data from before the refactor) by preferring the
  // derived value, so cards can't render mismatched hue+priority.
  const color: NoteColor = priorityToColor(priority)
  const rotation = todo.rotation ?? 0
  const theme = useTheme()

  // No reminder system yet — every card renders with the baseline visual.
  // When the reminder system lands, compute this from `todo.reminder` and the
  // current time: 'active' while a pending reminder is set, 'overdue' after
  // its trigger time has passed without acknowledgement.
  const reminderState: ReminderVisualState = 'none'

  // ─── Motion values ────────────────────────────────────────────────────────
  const x = useMotionValue(todo.position?.x ?? 120)
  const y = useMotionValue(todo.position?.y ?? 120)

  // ─── Drag zone logic ──────────────────────────────────────────────────────
  const {
    handleDragStart,
    handleDrag,
    handleDragEnd,
    isInDeleteZone,
    isInArchiveZone,
    isInReminderZone,
    isInFolderZone,
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
    onRequestReminder,
    onRequestFolder,
    onBringToFront,
    onDropOnNote,
    onStackTargetChange,
    onToggleExpand,
  })

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

  const rgbMatch = ns.glow.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  const [r, g, b] = rgbMatch
    ? [rgbMatch[1], rgbMatch[2], rgbMatch[3]]
    : ['0', '245', '255']

  // Fixed baseline visuals — see BASELINE_* constants at top of file.
  const baselineGlow = `rgba(${r},${g},${b},${BASELINE_GLOW_ALPHA})`
  const baselineBorder = ns.border

  const isInEdgeZone =
    isInDeleteZone || isInArchiveZone || isInReminderZone || isInFolderZone
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

  const borderColor = isInZone
    ? zoneColor
    : isStackTarget
      ? ns.border
      : baselineBorder
  const bgColor = isInDeleteZone
    ? 'rgba(255,30,30,0.12)'
    : isInArchiveZone
      ? 'rgba(57,255,20,0.08)'
      : ns.bg
  const glowColor = isInZone
    ? zoneGlow
    : isStackTarget
      ? `rgba(${r},${g},${b},0.65)`
      : baselineGlow
  const boxShadow = `0 0 ${isInZone || isStackTarget ? 20 : BASELINE_GLOW_SIZE}px ${glowColor}, 0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)`

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
      baselineGlow={baselineGlow}
      reminderState={reminderState}
      isInZone={isInZone}
      isInEdgeZone={isInEdgeZone}
      isInDeleteZone={isInDeleteZone}
      isInArchiveZone={isInArchiveZone}
      isInFolderZone={isInFolderZone}
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
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
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
    />
    </>
  )
}
