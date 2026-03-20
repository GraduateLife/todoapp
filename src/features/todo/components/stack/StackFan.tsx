import { motion, useMotionValue, animate } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { Todo, NoteColor } from '../../types'

// ─── Palette (mirrors StickyNote) ─────────────────────────────────────────────
const NOTE_STYLES: Record<
  NoteColor,
  { bg: string; border: string; glow: string; text: string; dim: string }
> = {
  cyan:   { bg: '#04161b', border: '#00f5ff', glow: 'rgba(0,245,255,0.35)',  text: '#9ae8f0', dim: 'rgba(0,245,255,0.45)'  },
  pink:   { bg: '#1c040f', border: '#ff2d78', glow: 'rgba(255,45,120,0.35)', text: '#f0a0be', dim: 'rgba(255,45,120,0.45)' },
  amber:  { bg: '#181000', border: '#ffb800', glow: 'rgba(255,184,0,0.35)',  text: '#f0d890', dim: 'rgba(255,184,0,0.45)'  },
  green:  { bg: '#041604', border: '#39ff14', glow: 'rgba(57,255,20,0.35)',  text: '#9cf09a', dim: 'rgba(57,255,20,0.45)'  },
  purple: { bg: '#0e0418', border: '#bf5fff', glow: 'rgba(191,95,255,0.35)', text: '#d4a8f4', dim: 'rgba(191,95,255,0.45)' },
}

// ─── Grid constants ───────────────────────────────────────────────────────────
const ROWS = 3
const COLS = 2
const CARD_W = 168
const CARD_H = 140             // tall enough for 5 lines of title text
const COL_STEP = CARD_W + 12   // 180
const ROW_STEP = CARD_H + 10   // 150
const SHEAR_X = 18
// Fan is always centered on screen — no attach gap needed

function slotToColRow(slot: number): [col: number, row: number] {
  return [Math.floor(slot / ROWS), slot % ROWS]
}

function slotPos(slot: number, gridX: number, gridY: number) {
  const [col, row] = slotToColRow(slot)
  return {
    x: gridX + col * COL_STEP + row * SHEAR_X,
    y: gridY + row * ROW_STEP,
  }
}

// ─── StackCard ────────────────────────────────────────────────────────────────
interface StackCardProps {
  todo: Todo
  slot: number
  totalSlots: number
  gridX: number
  gridY: number
  isRoot: boolean       // root card: display only, not draggable, no unstack
  onUnstack?: () => void
  onSwap: (fromSlot: number, toSlot: number) => void
}

function StackCard({ todo, slot, totalSlots, gridX, gridY, isRoot, onUnstack, onSwap }: StackCardProps) {
  const pos = slotPos(slot, gridX, gridY)
  const motionX = useMotionValue(pos.x)
  const motionY = useMotionValue(pos.y)
  const [isDragging, setIsDragging] = useState(false)

  // Animate to new slot position when slot changes (after reorder)
  useEffect(() => {
    animate(motionX, pos.x, { type: 'spring', stiffness: 380, damping: 30 })
    animate(motionY, pos.y, { type: 'spring', stiffness: 380, damping: 30 })
  }, [pos.x, pos.y]) // eslint-disable-line

  const [col] = slotToColRow(slot)
  const cardRotate = col === 0 ? -1.2 : 1.2

  const sNs = NOTE_STYLES[todo.color ?? 'cyan']
  const doneSubs = todo.subtasks.filter((s) => s.completed).length
  const totalSubs = todo.subtasks.length
  // Root card → "root";  stacked children → "01", "02" … "05"
  const slotLabel = isRoot ? 'root' : String(slot).padStart(2, '0')

  return (
    <motion.div
      drag={!isRoot}
      dragMomentum={false}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        x: motionX,
        y: motionY,
        rotate: cardRotate,
        width: CARD_W,
        zIndex: isDragging ? 980 : 820 + slot,
        cursor: isRoot ? 'default' : isDragging ? 'grabbing' : 'grab',
        // Parent wrapper has pointerEvents:none — must re-enable for cards
        pointerEvents: 'auto',
      }}
      initial={{ scale: 0.35, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.35, opacity: 0, transition: { duration: 0.12 } }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 22,
        delay: slot * 0.055,
      }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(_, info) => {
        setIsDragging(false)
        // pos.x/y is the slot origin; info.offset is the drag delta from that origin
        const finalCx = pos.x + info.offset.x + CARD_W / 2
        const finalCy = pos.y + info.offset.y + CARD_H / 2
        let nearestSlot = slot
        let minDist = CARD_W * 0.75
        // Only swap with other non-root slots (slot >= 1)
        for (let s = 1; s < totalSlots; s++) {
          if (s === slot) continue
          const sp = slotPos(s, gridX, gridY)
          const dist = Math.hypot(finalCx - (sp.x + CARD_W / 2), finalCy - (sp.y + CARD_H / 2))
          if (dist < minDist) { minDist = dist; nearestSlot = s }
        }
        if (nearestSlot !== slot) {
          // Swap detected — let useEffect animate to new slot after store update
          onSwap(slot, nearestSlot)
        } else {
          // No swap — spring back to current slot
          animate(motionX, pos.x, { type: 'spring', stiffness: 380, damping: 30 })
          animate(motionY, pos.y, { type: 'spring', stiffness: 380, damping: 30 })
        }
      }}
    >
      <div
        style={{
          background: sNs.bg,
          border: `1px solid ${isRoot ? sNs.border : `${sNs.border}99`}`,
          boxShadow: isRoot
            ? `0 0 14px ${sNs.glow}, 0 4px 20px rgba(0,0,0,0.55)`
            : `0 0 7px ${sNs.glow}66, 0 3px 12px rgba(0,0,0,0.45)`,
          borderRadius: 3,
          padding: '8px 11px',
          height: CARD_H,
          overflow: 'hidden',
          position: 'relative',
          userSelect: 'none',
        }}
      >
        {/* Corner brackets */}
        <span style={{ color: sNs.dim, position: 'absolute', top: 4, left: 4, fontFamily: 'monospace', fontSize: 8, opacity: 0.55, lineHeight: 1, pointerEvents: 'none' }}>┌─</span>
        <span style={{ color: sNs.dim, position: 'absolute', top: 4, right: 4, fontFamily: 'monospace', fontSize: 8, opacity: 0.55, lineHeight: 1, pointerEvents: 'none' }}>─┐</span>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${sNs.dim}`, paddingBottom: 5, marginBottom: 7 }}>
          <span
            style={{
              color: isRoot ? sNs.border : sNs.dim,
              fontFamily: "'Space Mono', monospace",
              fontSize: '0.62rem',
              letterSpacing: '0.22em',
              textShadow: isRoot ? `0 0 6px ${sNs.glow}` : 'none',
            }}
          >
            {slotLabel}
          </span>

          {/* Unstack button (root card has none) */}
          {!isRoot && (
            onUnstack && (
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onUnstack() }}
                style={{
                  color: sNs.dim, background: 'none', border: 'none',
                  cursor: 'pointer', padding: '0 0 0 4px',
                  fontFamily: "'Space Mono', monospace", fontSize: 11, lineHeight: 1, opacity: 0.6,
                }}
                title="remove from stack"
              >
                ✕
              </button>
            )
          )}
        </div>

        {/* Title */}
        <p
          style={{
            color: sNs.text,
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.72rem',
            lineHeight: 1.4,
            margin: 0,
            opacity: todo.completed ? 0.4 : 1,
            textDecoration: todo.completed ? 'line-through' : 'none',
            wordBreak: 'break-word',
            display: '-webkit-box',
            WebkitLineClamp: totalSubs > 0 ? 4 : 5,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          } as React.CSSProperties}
        >
          {todo.title || 'Untitled'}
        </p>

        {/* Subtask progress */}
        {totalSubs > 0 && (
          <p style={{ color: sNs.dim, fontFamily: "'Space Mono', monospace", fontSize: '0.62rem', marginTop: 4, opacity: 0.65 }}>
            {doneSubs}/{totalSubs} done
          </p>
        )}

        {/* High priority dot */}
        {todo.priority === 'high' && (
          <div style={{ position: 'absolute', bottom: 6, right: 8, width: 5, height: 5, borderRadius: '50%', background: sNs.border, boxShadow: `0 0 5px ${sNs.glow}` }} />
        )}

        {/* Scanline */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: 3, pointerEvents: 'none', backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.07) 3px, rgba(0,0,0,0.07) 4px)' }} />
      </div>
    </motion.div>
  )
}

// ─── StackFan ─────────────────────────────────────────────────────────────────
interface StackFanProps {
  root: Todo
  stackedNotes: Todo[]
  onUnstack: (childId: string) => void
  onReorder: (fromIdx: number, toIdx: number) => void
}

export function StackFan({ root, stackedNotes, onUnstack, onReorder }: StackFanProps) {
  // Slot 0 = root card (displayed, non-draggable)
  // Slots 1…5 = stacked children (draggable, reorderable)
  const allCards = [root, ...stackedNotes.slice(0, 5)]
  const totalSlots = allCards.length

  // Always center the grid on screen regardless of root note position
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const gridTotalW = COL_STEP * COLS + SHEAR_X * (ROWS - 1)
  const gridTotalH = ROW_STEP * ROWS - 10
  const gridX = Math.round((vw - gridTotalW) / 2)
  const gridY = Math.round((vh - gridTotalH) / 2)

  return (
    <>
      {allCards.map((card, slotIdx) => {
        const isRoot = slotIdx === 0
        return (
          <StackCard
            key={card.id}
            todo={card}
            slot={slotIdx}
            totalSlots={totalSlots}
            gridX={gridX}
            gridY={gridY}
            isRoot={isRoot}
            onUnstack={!isRoot ? () => onUnstack(card.id) : undefined}
            // slot indices: root=0 (not in stackedIds), stacked=1..5 → stackedIds[0..4]
            onSwap={(fromSlot, toSlot) => onReorder(fromSlot - 1, toSlot - 1)}
          />
        )
      })}
    </>
  )
}
