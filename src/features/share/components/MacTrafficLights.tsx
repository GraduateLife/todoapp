import { useEffect, useRef, useState } from 'react'

const LONG_PRESS_MS = 500

interface MacTrafficLightsProps {
  onRevoke: () => void
  onEdit: () => void
  onOpen: () => void
  isRevoking?: boolean
}

type Lit = 'red' | 'yellow' | 'green' | null

export function MacTrafficLights({
  onRevoke,
  onEdit,
  onOpen,
  isRevoking,
}: MacTrafficLightsProps) {
  const [hovered, setHovered] = useState<Lit>(null)
  const [pressing, setPressing] = useState(false)
  const timerRef = useRef<number | null>(null)

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
  }, [])

  const startLongPress = () => {
    setPressing(true)
    timerRef.current = window.setTimeout(() => {
      setPressing(false)
      onRevoke()
    }, LONG_PRESS_MS)
  }

  const cancelLongPress = () => {
    setPressing(false)
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const tooltip =
    hovered === 'red'
      ? pressing
        ? '[ hold to revoke ]'
        : '[ revoke ]'
      : hovered === 'yellow'
        ? '[ edit ]'
        : hovered === 'green'
          ? '[ open ]'
          : null

  return (
    <div className="flex items-center gap-1.5 relative">
      <Light
        kind="red"
        color="#ff5f57"
        active={hovered === 'red'}
        pressing={pressing}
        disabled={isRevoking}
        onMouseEnter={() => setHovered('red')}
        onMouseLeave={() => {
          setHovered(null)
          cancelLongPress()
        }}
        onPointerDown={startLongPress}
        onPointerUp={cancelLongPress}
        onPointerCancel={cancelLongPress}
      />
      <Light
        kind="yellow"
        color="#febc2e"
        active={hovered === 'yellow'}
        onMouseEnter={() => setHovered('yellow')}
        onMouseLeave={() => setHovered(null)}
        onClick={onEdit}
      />
      <Light
        kind="green"
        color="#28c840"
        active={hovered === 'green'}
        onMouseEnter={() => setHovered('green')}
        onMouseLeave={() => setHovered(null)}
        onClick={onOpen}
      />
      {tooltip && (
        <span
          className="font-mono text-[8px] tracking-[0.14em] uppercase pointer-events-none"
          style={{
            position: 'absolute',
            top: '110%',
            left: 0,
            color: 'var(--rf-text-dim)',
            whiteSpace: 'nowrap',
          }}
        >
          {tooltip}
        </span>
      )}
    </div>
  )
}

interface LightProps {
  kind: 'red' | 'yellow' | 'green'
  color: string
  active: boolean
  pressing?: boolean
  disabled?: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
  onClick?: () => void
  onPointerDown?: () => void
  onPointerUp?: () => void
  onPointerCancel?: () => void
}

function Light({
  color,
  active,
  pressing,
  disabled,
  onMouseEnter,
  onMouseLeave,
  onClick,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
}: LightProps) {
  const size = active ? 11 : 9
  return (
    <button
      type="button"
      disabled={disabled}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        border: `1px solid ${color}`,
        boxShadow: active ? `0 0 8px ${color}` : 'none',
        padding: 0,
        cursor: 'pointer',
        opacity: disabled ? 0.4 : 1,
        transform: pressing ? 'scale(0.85)' : 'scale(1)',
        transition: 'all 120ms ease',
      }}
    />
  )
}
