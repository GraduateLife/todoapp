import { useMotionValue } from 'framer-motion'
import { useState, useCallback } from 'react'
import { useDragZones } from '../hooks/useDragZones'
import { NOTE_STYLES } from '../constants/noteColors'
import { TITLE_MAX_LEN } from '../components/input-bar'
import { StickyNote } from '../components/StickyNote'
import type { Todo, NoteColor, Priority } from '../types'

// ─── Priority modifiers ───────────────────────────────────────────────────────
const PRIORITY_GLOW: Record<Priority, number> = { low: 6, normal: 18, high: 32 }
const PRIORITY_BORDER_OPACITY: Record<Priority, number> = {
  low: 0.45,
  normal: 1,
  high: 1,
}

interface StickyNoteContainerProps {
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
}: StickyNoteContainerProps) {
  const color: NoteColor = todo.color ?? 'cyan'
  const rotation = todo.rotation ?? 0
  const priority: Priority = todo.priority ?? 'normal'

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
  const [contextMenu, setContextMenu] = useState<{
    open: boolean
    pos: { x: number; y: number }
  }>({ open: false, pos: { x: 0, y: 0 } })

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
    [saveEdit, todo.title],
  )

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      onBringToFront(todo.id)
      setContextMenu({ open: true, pos: { x: e.clientX, y: e.clientY } })
    },
    [todo.id, onBringToFront],
  )

  // ─── Style computation ────────────────────────────────────────────────────
  const ns = NOTE_STYLES[color]
  const glowSize = PRIORITY_GLOW[priority]
  const borderOpacity = PRIORITY_BORDER_OPACITY[priority]

  const glowAlphaMap: Record<Priority, number> = {
    low: 0.15,
    normal: 0.35,
    high: 0.65,
  }
  const rgbMatch = ns.glow.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  const [r, g, b] = rgbMatch
    ? [rgbMatch[1], rgbMatch[2], rgbMatch[3]]
    : ['0', '245', '255']

  const adjustedGlow = `rgba(${r},${g},${b},${glowAlphaMap[priority]})`
  const adjustedBorder =
    borderOpacity < 1 ? `rgba(${r},${g},${b},${borderOpacity})` : ns.border

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
      : adjustedBorder
  const bgColor = isInDeleteZone
    ? 'rgba(255,30,30,0.12)'
    : isInArchiveZone
      ? 'rgba(57,255,20,0.08)'
      : ns.bg
  const glowColor = isInZone
    ? zoneGlow
    : isStackTarget
      ? `rgba(${r},${g},${b},0.65)`
      : adjustedGlow
  const boxShadow = `0 0 ${isInZone || isStackTarget ? 20 : glowSize}px ${glowColor}, 0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)`

  const stackCount = stackedNotes.length

  return (
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
      adjustedGlow={adjustedGlow}
      priority={priority}
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
      contextMenu={contextMenu}
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
      onOpenAddSubTask={() => setIsAddingSubTask(true)}
      onAddingSubTaskClose={() => setIsAddingSubTask(false)}
      onToggleExpand={onToggleExpand}
      onDelete={() => onDelete(todo.id)}
      onArchive={() => onArchive(todo.id)}
      onSetPriority={(p) => onSetPriority(todo.id, p)}
      onRequestReminder={() => onRequestReminder(todo.id)}
      onRequestFolder={() => onRequestFolder(todo.id)}
      onDisbandStack={stackCount > 0 ? onDisbandStack : undefined}
      onCloseContextMenu={() => setContextMenu((p) => ({ ...p, open: false }))}
    />
  )
}
