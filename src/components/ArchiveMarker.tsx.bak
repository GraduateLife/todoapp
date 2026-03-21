import { useState } from 'react'
import { useTodoStore } from '#/features/todo/store'
import { ArchivePanel } from '#/features/todo/components/archive/ArchivePanel'

// Grey palette – no glow, intentionally dim
const GRAY       = 'rgba(140,150,160,0.7)'
const GRAY_DIM   = 'rgba(140,150,160,0.25)'
const GRAY_BG    = 'rgba(140,150,160,0.04)'
const GRAY_BG_HO = 'rgba(140,150,160,0.09)'

export function ArchiveMarker() {
  const [open, setOpen]       = useState(false)
  const [hovered, setHovered] = useState(false)

  const archived = useTodoStore((s) => s.todos.filter((t) => t.archived))
  const count    = archived.length

  const borderColor = hovered ? GRAY : GRAY_DIM
  const bg          = hovered ? GRAY_BG_HO : GRAY_BG

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top:      12,
          left:     0,
          zIndex:   200,
          pointerEvents: 'auto',
        }}
        onClick={() => setOpen(true)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          6,
            paddingLeft:  8,
            paddingRight: 10,
            paddingTop:   6,
            paddingBottom: 6,
            borderRadius: '0 3px 3px 0',
            background:   bg,
            borderTop:    `1px solid ${borderColor}`,
            borderRight:  `1px solid ${borderColor}`,
            borderBottom: `1px solid ${borderColor}`,
            borderLeft:   'none',
            cursor:       'pointer',
            transition:   'all 180ms ease',
          }}
        >
          {/* Dim square dot */}
          <span
            style={{
              width:        6,
              height:       6,
              borderRadius: 1,
              flexShrink:   0,
              background:   hovered ? GRAY : 'rgba(140,150,160,0.4)',
              transition:   'background 180ms',
            }}
          />
          {/* Label */}
          <span
            style={{
              fontFamily:    "'Space Mono', ui-monospace, monospace",
              fontSize:      9,
              letterSpacing: '0.1em',
              color:         GRAY,
              opacity:       hovered ? 0.9 : 0.6,
              whiteSpace:    'nowrap',
              transition:    'opacity 180ms',
            }}
          >
            archive
          </span>
          {/* Divider */}
          <span style={{ fontFamily: 'monospace', fontSize: 8, color: GRAY, opacity: 0.3 }}>·</span>
          {/* Count */}
          <span
            style={{
              fontFamily:    "'Space Mono', ui-monospace, monospace",
              fontSize:      9,
              letterSpacing: '0.08em',
              color:         GRAY,
              opacity:       0.65,
            }}
          >
            {count}
          </span>
        </div>
      </div>

      <ArchivePanel open={open} onClose={() => setOpen(false)} />
    </>
  )
}
