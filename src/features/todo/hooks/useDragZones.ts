import { useState, useCallback, useRef, useEffect } from 'react'
import type { MotionValue } from 'framer-motion'
import { useUiStore } from '../store/uiStore'
import { DELETE_GLITCH_DELAY, DELETE_GLITCH_DURATION } from '@/lib/limits'

// ─── Zone thresholds ─────────────────────────────────────────────────────────
const BOTTOM_ZONE_OFFSET = 160 // px from bottom of viewport

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
  onBringToFront,
  onDropOnNote,
  onStackTargetChange,
  onToggleExpand,
}: UseDragZonesOptions) {
  const setDragging = useUiStore((s) => s.setDragging)

  const [isInBottomZone, setIsInBottomZone] = useState(false)
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
  }, [todoId, onBringToFront, setDragging, isExpanded, onToggleExpand])

  const handleDrag = useCallback(() => {
    if (typeof window === 'undefined') return
    const cx = x.get() + 128 // center of 256px card
    const cy = y.get() + 90 // approximate center Y
    const inBottom = y.get() > window.innerHeight - BOTTOM_ZONE_OFFSET

    // Bottom zone enter/leave
    if (inBottom && !isInBottomZone) {
      setIsInBottomZone(true)
      startGlitchTimer()
    } else if (!inBottom && isInBottomZone) {
      setIsInBottomZone(false)
      stopGlitchTimer()
    }

    // Stack detection — only when not in bottom zone
    if (!inBottom) {
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
  }, [x, y, otherNotes, onStackTargetChange, isInBottomZone, startGlitchTimer, stopGlitchTimer])

  const handleDragEnd = useCallback(() => {
    setDragging(false)
    if (typeof window === 'undefined') return
    const inBottom = y.get() > window.innerHeight - BOTTOM_ZONE_OFFSET

    // Stack drop (bottom zone takes precedence)
    if (!inBottom && stackTargetRef.current) {
      onDropOnNote(stackTargetRef.current)
      stackTargetRef.current = null
      onStackTargetChange(null)
      setIsInStackZone(false)
      return
    }

    if (inBottom && !autoDeletedRef.current) {
      const elapsed = Date.now() - bottomEnteredAtRef.current
      if (elapsed < DELETE_GLITCH_DELAY) {
        // Quick release → archive
        onArchive(todoId)
      } else {
        // In glitch phase → delete immediately
        onDelete(todoId)
      }
    } else if (!inBottom) {
      onMove(todoId, x.get(), y.get())
    }

    // Always clean up
    stopGlitchTimer()
    setIsInBottomZone(false)
  }, [
    todoId,
    x,
    y,
    onMove,
    onDelete,
    onArchive,
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
    glitchIntensity,
    isInStackZone,
  }
}
