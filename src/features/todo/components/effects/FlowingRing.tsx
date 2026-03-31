/**
 * FlowingRing — spinning conic-gradient ring effect.
 *
 * Wraps its children with a rotating arc ring. Not currently used in the app
 * but preserved here as a standalone component for future use.
 *
 * Usage:
 *   <FlowingRing color="#00f5ff" innerBg="rgb(4,22,27)" inset={8} outerRadius={10} innerRadius={7}>
 *     <YourContent />
 *   </FlowingRing>
 */

interface FlowingRingProps {
  children: React.ReactNode
  /** Arc color (the bright part of the conic gradient) */
  color: string
  /** Opaque background color used to "punch out" the ring interior */
  innerBg: string
  /** How many px the ring extends outside the children's bounds */
  inset?: number
  /** border-radius of the outer clipping container */
  outerRadius?: number
  /** border-radius of the inner mask div */
  innerRadius?: number
}

export function FlowingRing({
  children,
  color,
  innerBg,
  inset = 8,
  outerRadius = 10,
  innerRadius = 7,
}: FlowingRingProps) {
  return (
    <div style={{ position: 'relative' }}>
      {/* Ring container — clips the oversized spinning gradient */}
      <div
        style={{
          position: 'absolute',
          top: -inset,
          left: -inset,
          right: -inset,
          bottom: -inset,
          borderRadius: outerRadius,
          overflow: 'hidden',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      >
        {/* Spinning conic-gradient arc */}
        <div
          style={{
            position: 'absolute',
            width: '200%',
            height: '200%',
            top: '-50%',
            left: '-50%',
            background: `conic-gradient(from 0deg, transparent 0%, transparent 55%, ${color}44 65%, ${color}cc 73%, ${color} 78%, ${color}cc 83%, ${color}44 91%, transparent 100%)`,
            animation: 'rf-reminder-spin 3s linear infinite',
          }}
        />
        {/* Inner mask — punches out the child area leaving only the ring border */}
        <div
          style={{
            position: 'absolute',
            top: inset - 5,
            left: inset - 5,
            right: inset - 5,
            bottom: inset - 5,
            borderRadius: innerRadius,
            background: innerBg,
          }}
        />
      </div>

      {/* Content (rendered above the ring) */}
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  )
}
