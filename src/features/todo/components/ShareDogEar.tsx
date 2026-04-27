import { useMemo } from 'react'

const SIZE = 20
const FLAP_BORDER = 1
const FLAP_RADIUS = 3

interface ShareDogEarProps {
  borderColor: string
  foldFill: string
  /** Optional tint painted over the flap to match the card's drag-zone overlay. */
  overlayTint?: string | null
  onClick: () => void
}

/**
 * Folded-corner ("dog-ear") affordance painted over the top-right corner of a
 * shared todo card. The cut-out triangle reveals the page background; the flap
 * triangle is the underside of the peeled corner.
 *
 * Must be rendered as a sibling of the card div (not inside its
 * `overflow:hidden` box) so the 1px overshoot can paint over the card border.
 */
export function ShareDogEar({
  borderColor,
  foldFill,
  overlayTint,
  onClick,
}: ShareDogEarProps) {
  const gradId = useMemo(
    () => `dogear-grad-${Math.random().toString(36).slice(2, 8)}`,
    [],
  )
  return (
    <button
      type="button"
      aria-label="Manage share"
      title="manage share"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: SIZE,
        height: SIZE,
        padding: 0,
        margin: 0,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        zIndex: 13,
      }}
    >
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id={gradId} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={foldFill} stopOpacity={1} />
            <stop offset="100%" stopColor={foldFill} stopOpacity={0.7} />
          </linearGradient>
        </defs>
        {/* Cut-out paints over the card's top + right borders inside the
            corner (overshoots by 1px). */}
        <polygon
          points={`-1,-1 ${SIZE + 1},-1 ${SIZE + 1},${SIZE}`}
          fill="var(--rf-bg)"
        />
        {/* Flap — bottom-left tip rounded to match the card's 3px radius. */}
        <path
          d={`M 0,0 L ${SIZE},${SIZE} L ${FLAP_RADIUS},${SIZE} Q 0,${SIZE} 0,${SIZE - FLAP_RADIUS} Z`}
          fill={`url(#${gradId})`}
          stroke={borderColor}
          strokeWidth={FLAP_BORDER}
          strokeLinejoin="round"
        />
        {/* Drag-zone tint overlay — matches the card's inset overlay so the
            flap doesn't visually break out of the highlight. */}
        {overlayTint && (
          <path
            d={`M 0,0 L ${SIZE},${SIZE} L ${FLAP_RADIUS},${SIZE} Q 0,${SIZE} 0,${SIZE - FLAP_RADIUS} Z`}
            fill={overlayTint}
          />
        )}
        {/* Fold crease — softer than the paper edges. */}
        <line
          x1="0"
          y1="0"
          x2={SIZE}
          y2={SIZE}
          stroke={borderColor}
          strokeWidth={FLAP_BORDER}
          opacity={0.55}
        />
      </svg>
    </button>
  )
}
