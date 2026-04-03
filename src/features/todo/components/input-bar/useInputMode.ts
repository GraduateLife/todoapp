import { useState, useEffect, useRef, useCallback } from 'react'

export function useInputMode() {
  const [isExpanded, setIsExpanded] = useState(true) // Buffer is default
  const dragStartY = useRef<number | null>(null)

  // ── Keyboard: Ctrl+W → open, Ctrl+S → kill ────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) return

      if (e.key === 'w') {
        e.preventDefault()
        setIsExpanded(true)
      }
      if (e.key === 's') {
        e.preventDefault()
        setIsExpanded(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  // ── Drag: up → expand, down → collapse ────────────────────────────────────
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragStartY.current = e.clientY
      const onMove = (ev: PointerEvent) => {
        if (dragStartY.current === null) return
        const delta = ev.clientY - dragStartY.current
        if (!isExpanded && delta < -36) {
          setIsExpanded(true)
          cleanup()
        }
        if (isExpanded && delta > 36) {
          setIsExpanded(false)
          cleanup()
        }
      }
      const cleanup = () => {
        dragStartY.current = null
        document.removeEventListener('pointermove', onMove)
        document.removeEventListener('pointerup', cleanup)
      }
      document.addEventListener('pointermove', onMove)
      document.addEventListener('pointerup', cleanup)
    },
    [isExpanded],
  )

  return { isExpanded, setIsExpanded, handlePointerDown }
}
