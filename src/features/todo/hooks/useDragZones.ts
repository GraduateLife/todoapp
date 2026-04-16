import { useState, useCallback, useRef, useEffect } from 'react'
import type { MotionValue } from 'framer-motion'
import { useUiStore } from '../store/uiStore'
import { DELETE_GLITCH_DELAY, DELETE_GLITCH_DURATION } from '@/lib/limits'

// ─── Zone thresholds ─────────────────────────────────────────────────────────
// Top zone    = (live header height)    + TOP_ZONE_BUFFER
// Bottom zone = (live input-bar height) + BOTTOM_ZONE_BUFFER
// Buffers give a comfortable trigger band beyond the obstacle (header / bar)
// so the user doesn't have to drag the card all the way *into* the obstacle.
const TOP_ZONE_BUFFER = 20
const BOTTOM_ZONE_BUFFER = 130

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
  onRequestExport: (id: string) => void
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
  onRequestExport,
  onBringToFront,
  onDropOnNote,
  onStackTargetChange,
  onToggleExpand,
}: UseDragZonesOptions) {
  const setDragging = useUiStore((s) => s.setDragging)
  // Live header / input-bar heights — fed through refs so the drag callbacks
  // can read the freshest values without being rebuilt every time either one
  // resizes.
  const headerHeight = useUiStore((s) => s.headerHeight)
  const inputBarHeight = useUiStore((s) => s.inputBarHeight)
  const topZoneOffsetRef = useRef(headerHeight + TOP_ZONE_BUFFER)
  topZoneOffsetRef.current = headerHeight + TOP_ZONE_BUFFER
  const bottomZoneOffsetRef = useRef(inputBarHeight + BOTTOM_ZONE_BUFFER)
  bottomZoneOffsetRef.current = inputBarHeight + BOTTOM_ZONE_BUFFER

  const [isInBottomZone, setIsInBottomZone] = useState(false)
  const [isInTopZone, setIsInTopZone] = useState(false)
  const [glitchIntensity, setGlitchIntensity] = useState(0)
  const [isInStackZone, setIsInStackZone] = useState(false)

  // Refs to avoid stale closures in the glitch timer
  const onDeleteRef = useRef(onDelete)
  onDeleteRef.current = onDelete
  const todoIdRef = useRef(todoId)
  todoIdRef.current = todoId

  // Ref to track current stack target without stale closure issues
  const stackTargetRef = useRef<string | null>(null)

  // Glitch timer refs
  const bottomEnteredAtRef = useRef<number>(0)
  const glitchTickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoDeletedRef = useRef(false)

  // ── "Started inside zone" suppression ──────────────────────────────────────
  // If a drag begins with the card already inside an edge zone, that zone is
  // suppressed for the duration of the drag — until the card leaves the zone
  // at least once. This prevents the case where a user cancels an export
  // modal and then can't drag the (still up-top) card back down without
  // re-triggering export. Same idea applies to the bottom zone.
  const startInBottomZoneRef = useRef(false)
  const startInTopZoneRef = useRef(false)

  const stopGlitchTimer = useCallback(() => {
    if (glitchTickRef.current) {
      clearInterval(glitchTickRef.current)
      glitchTickRef.current = null
    }
    setGlitchIntensity(0)
    autoDeletedRef.current = false
  }, [])

  const startGlitchTimer = useCallback(() => {
    if (glitchTickRef.current) return
    bottomEnteredAtRef.current = Date.now()
    glitchTickRef.current = setInterval(() => {
      const elapsed = Date.now() - bottomEnteredAtRef.current
      if (elapsed < DELETE_GLITCH_DELAY) {
        setGlitchIntensity(0)
      } else {
        const intensity = Math.min(
          1,
          (elapsed - DELETE_GLITCH_DELAY) / DELETE_GLITCH_DURATION,
        )
        setGlitchIntensity(intensity)
        if (intensity >= 1 && !autoDeletedRef.current) {
          autoDeletedRef.current = true
          onDeleteRef.current(todoIdRef.current)
        }
      }
    }, 80)
  }, [])

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (glitchTickRef.current) clearInterval(glitchTickRef.current)
    }
  }, [])

  const handleDragStart = useCallback(() => {
    setDragging(true)
    onBringToFront(todoId)
    if (isExpanded) onToggleExpand()
    // Capture which zones the card is already inside — these get suppressed
    // until the card leaves them.
    if (typeof window !== 'undefined') {
      const startInBottom =
        y.get() > window.innerHeight - bottomZoneOffsetRef.current
      startInBottomZoneRef.current = startInBottom
      startInTopZoneRef.current =
        !startInBottom && y.get() < topZoneOffsetRef.current
    } else {
      startInBottomZoneRef.current = false
      startInTopZoneRef.current = false
    }
  }, [todoId, onBringToFront, setDragging, isExpanded, onToggleExpand, y])

  const handleDrag = useCallback(() => {
    if (typeof window === 'undefined') return
    const cx = x.get() + 128 // center of 256px card
    const cy = y.get() + 90 // approximate center Y
    const inBottom = y.get() > window.innerHeight - bottomZoneOffsetRef.current
    const inTop = !inBottom && y.get() < topZoneOffsetRef.current

    // Once the card leaves a zone it started inside, lift the suppression so
    // a fresh re-entry can trigger normally.
    if (!inBottom && startInBottomZoneRef.current) {
      startInBottomZoneRef.current = false
    }
    if (!inTop && startInTopZoneRef.current) {
      startInTopZoneRef.current = false
    }

    // Effective zone state — what the rest of the system sees. Suppressed
    // while we're still sitting inside a zone the drag started in.
    const effectiveInBottom = inBottom && !startInBottomZoneRef.current
    const effectiveInTop = inTop && !startInTopZoneRef.current

    // Bottom zone enter/leave
    if (effectiveInBottom && !isInBottomZone) {
      setIsInBottomZone(true)
      startGlitchTimer()
    } else if (!effectiveInBottom && isInBottomZone) {
      setIsInBottomZone(false)
      stopGlitchTimer()
    }

    // Top zone enter/leave
    if (effectiveInTop !== isInTopZone) setIsInTopZone(effectiveInTop)

    // Stack detection — only when not in any (effective) edge zone
    if (!effectiveInBottom && !effectiveInTop) {
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
  }, [x, y, otherNotes, onStackTargetChange, isInBottomZone, isInTopZone, startGlitchTimer, stopGlitchTimer])

  const handleDragEnd = useCallback(() => {
    setDragging(false)
    if (typeof window === 'undefined') return
    const inBottom = y.get() > window.innerHeight - bottomZoneOffsetRef.current
    const inTop = !inBottom && y.get() < topZoneOffsetRef.current

    // Apply the same suppression: a zone the drag started in is inert until
    // the card leaves it. If it never left, treat it as "not in zone".
    const effectiveInBottom = inBottom && !startInBottomZoneRef.current
    const effectiveInTop = inTop && !startInTopZoneRef.current

    // Stack drop (edge zones take precedence)
    if (!effectiveInBottom && !effectiveInTop && stackTargetRef.current) {
      onDropOnNote(stackTargetRef.current)
      stackTargetRef.current = null
      onStackTargetChange(null)
      setIsInStackZone(false)
      startInBottomZoneRef.current = false
      startInTopZoneRef.current = false
      return
    }

    if (effectiveInTop) {
      // Drag into top → open export modal
      onMove(todoId, x.get(), y.get())
      onRequestExport(todoId)
    } else if (effectiveInBottom && !autoDeletedRef.current) {
      const elapsed = Date.now() - bottomEnteredAtRef.current
      if (elapsed < DELETE_GLITCH_DELAY) {
        // Quick release → archive
        onArchive(todoId)
      } else {
        // In glitch phase → delete immediately
        onDelete(todoId)
      }
    } else {
      // Either outside any zone, or inside a suppressed zone — just save.
      onMove(todoId, x.get(), y.get())
    }

    // Always clean up
    stopGlitchTimer()
    setIsInBottomZone(false)
    setIsInTopZone(false)
    startInBottomZoneRef.current = false
    startInTopZoneRef.current = false
  }, [
    todoId,
    x,
    y,
    onMove,
    onDelete,
    onArchive,
    onRequestExport,
    onDropOnNote,
    onStackTargetChange,
    setDragging,
    stopGlitchTimer,
  ])

  return {
    handleDragStart,
    handleDrag,
    handleDragEnd,
    isInBottomZone,
    isInTopZone,
    glitchIntensity,
    isInStackZone,
  }
}
