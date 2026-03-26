import { useState, useCallback, useRef } from 'react'
import type { MotionValue } from 'framer-motion'
import { useUiStore } from '../store/uiStore'

// ─── Zone thresholds ─────────────────────────────────────────────────────────
const DELETE_ZONE_OFFSET = 160 // px from bottom of viewport
const ARCHIVE_ZONE_OFFSET = 48 // px from top of viewport — must clear the header
const REMINDER_ZONE_OFFSET = 80 // px from right of viewport
const FOLDER_ZONE_OFFSET = 80 // px from left of viewport

// ─── Stack hit area ──────────────────────────────────────────────────────────
const STACK_HIT_W = 200
const STACK_HIT_H = 140

interface UseDragZonesOptions {
  todoId: string
  x: MotionValue<number>
  y: MotionValue<number>
  isExpanded: boolean
  otherNotes: Array<{ id: string; position: { x: number; y: number } }>
  onMove: (id: string, x: number, y: number) => void
  onDelete: (id: string) => void
  onArchive: (id: string) => void
  onRequestReminder: (id: string) => void
  onRequestFolder: (id: string) => void
  onBringToFront: (id: string) => void
  onDropOnNote: (targetId: string) => void
  onStackTargetChange: (targetId: string | null) => void
  onToggleExpand: () => void
}

export function useDragZones({
  todoId,
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
}: UseDragZonesOptions) {
  const setDragging = useUiStore((s) => s.setDragging)

  const [isInDeleteZone, setIsInDeleteZone] = useState(false)
  const [isInArchiveZone, setIsInArchiveZone] = useState(false)
  const [isInReminderZone, setIsInReminderZone] = useState(false)
  const [isInFolderZone, setIsInFolderZone] = useState(false)
  const [isInStackZone, setIsInStackZone] = useState(false)

  // Ref to track current stack target without stale closure issues
  const stackTargetRef = useRef<string | null>(null)

  const handleDragStart = useCallback(() => {
    setDragging(true)
    onBringToFront(todoId)
    if (isExpanded) onToggleExpand()
  }, [todoId, onBringToFront, setDragging, isExpanded, onToggleExpand])

  const handleDrag = useCallback(() => {
    if (typeof window === 'undefined') return
    const cx = x.get() + 128 // center of 256px card
    const cy = y.get() + 90 // approximate center Y
    const inDelete = y.get() > window.innerHeight - DELETE_ZONE_OFFSET
    const inArchive = y.get() < ARCHIVE_ZONE_OFFSET
    const inReminder =
      cx > window.innerWidth - REMINDER_ZONE_OFFSET && !inDelete && !inArchive
    const inFolder = x.get() < FOLDER_ZONE_OFFSET && !inDelete && !inArchive

    setIsInDeleteZone(inDelete)
    setIsInArchiveZone(inArchive && !inDelete)
    setIsInReminderZone(inReminder)
    setIsInFolderZone(inFolder)

    // Stack detection — only when not in any edge zone
    if (!inDelete && !inArchive && !inReminder && !inFolder) {
      const target = otherNotes.find(
        (n) =>
          cx > n.position.x + 28 &&
          cx < n.position.x + 28 + STACK_HIT_W &&
          cy > n.position.y + 20 &&
          cy < n.position.y + 20 + STACK_HIT_H,
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

    // Stack drop (edge zones take precedence)
    if (
      !inDelete &&
      !inArchive &&
      !inReminder &&
      !inFolder &&
      stackTargetRef.current
    ) {
      onDropOnNote(stackTargetRef.current)
      stackTargetRef.current = null
      onStackTargetChange(null)
      setIsInStackZone(false)
      return
    }

    if (inDelete) {
      onDelete(todoId)
    } else if (inArchive) {
      onArchive(todoId)
    } else if (inReminder) {
      onMove(todoId, x.get(), y.get())
      onRequestReminder(todoId)
      setIsInReminderZone(false)
    } else if (inFolder) {
      onMove(todoId, x.get(), y.get())
      onRequestFolder(todoId)
      setIsInFolderZone(false)
    } else {
      onMove(todoId, x.get(), y.get())
      setIsInDeleteZone(false)
      setIsInArchiveZone(false)
      setIsInReminderZone(false)
      setIsInFolderZone(false)
    }
  }, [
    todoId,
    x,
    y,
    onMove,
    onDelete,
    onArchive,
    onRequestReminder,
    onRequestFolder,
    onDropOnNote,
    onStackTargetChange,
    setDragging,
  ])

  return {
    handleDragStart,
    handleDrag,
    handleDragEnd,
    isInDeleteZone,
    isInArchiveZone,
    isInReminderZone,
    isInFolderZone,
    isInStackZone,
  }
}
