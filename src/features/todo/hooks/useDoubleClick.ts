import { useCallback, useRef } from 'react'

const DOUBLE_CLICK_MS = 300

export function useDoubleClick(onDoubleClick: () => void) {
  const lastClickRef = useRef(0)

  const handleClick = useCallback(() => {
    const now = Date.now()
    if (now - lastClickRef.current <= DOUBLE_CLICK_MS) {
      onDoubleClick()
      lastClickRef.current = 0
      return
    }
    lastClickRef.current = now
  }, [onDoubleClick])

  return { onClick: handleClick }
}
