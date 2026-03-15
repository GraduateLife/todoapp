import { useCallback, useRef, type PointerEvent } from 'react'

const LONG_PRESS_MS = 800

interface UseLongPressOptions {
  onLongPress: () => void
  onClick?: () => void
  thresholdMs?: number
}

export function useLongPress({
  onLongPress,
  onClick,
  thresholdMs = LONG_PRESS_MS,
}: UseLongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didLongPressRef = useRef(false)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const handlePointerDown = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      didLongPressRef.current = false
      timerRef.current = setTimeout(() => {
        didLongPressRef.current = true
        onLongPress()
        clearTimer()
      }, thresholdMs)
    },
    [onLongPress, thresholdMs, clearTimer]
  )

  const handlePointerUp = useCallback(() => {
    clearTimer()
  }, [clearTimer])

  const handlePointerLeave = useCallback(() => {
    clearTimer()
  }, [clearTimer])

  const handleClick = useCallback(() => {
    if (didLongPressRef.current) return
    onClick?.()
  }, [onClick])

  return {
    onPointerDown: handlePointerDown,
    onPointerUp: handlePointerUp,
    onPointerLeave: handlePointerLeave,
    onClick: onClick != null ? handleClick : undefined,
  }
}
