import { motion, animate } from 'framer-motion'
import { useState, useMemo, useEffect } from 'react'
import type { MotionValue } from 'framer-motion'
import { TodoContextMenu } from './TodoContextMenu'
import { SubTaskList } from './note/SubTaskList'
import { NOTE_STYLES, LIGHT_NOTE_STYLES } from '../constants/noteColors'
import { useTheme } from '../hooks/useTheme'
import {
  isFreshTodo,
  getThrowYOffset,
  NOTE_THROW_TRANSITION,
  NOTE_DEFAULT_INITIAL,
  NOTE_DEFAULT_TRANSITION,
  NOTE_EXIT,
} from '../animations/noteEntrance'
import type { Todo, NoteColor, Priority } from '../types'

type NoteStyles = (typeof NOTE_STYLES)[NoteColor]

export interface StickyNoteProps {
  todo: Todo
  // ── Motion ──────────────────────────────────────────────────────────────────
  x: MotionValue<number>
  y: MotionValue<number>
  rotation: number
  zIndexOverride?: number
  // ── Computed palette & styles ────────────────────────────────────────────────
  ns: NoteStyles
  stackTargetShadow: string
  borderColor: string
  bgColor: string
  glowColor: string
  boxShadow: string
  adjustedGlow: string
  priority: Priority
  // ── Zone feedback ────────────────────────────────────────────────────────────
  isInZone: boolean
  isInEdgeZone: boolean
  isInDeleteZone: boolean
  isInArchiveZone: boolean
  isInFolderZone: boolean
  isInStackZone: boolean
  zoneColor: string
  zoneLabel: string
  // ── Stack ────────────────────────────────────────────────────────────────────
  isStackTarget: boolean
  stackedNotes: Todo[]
  isExpanded: boolean
  stackCount: number
  // ── Edit state ───────────────────────────────────────────────────────────────
  isEditing: boolean
  editValue: string
  isAddingSubTask: boolean
  // ── Context menu state ───────────────────────────────────────────────────────
  contextMenu: { open: boolean; pos: { x: number; y: number } }
  // ── Drag handlers ────────────────────────────────────────────────────────────
  onDragStart: () => void
  onDrag: () => void
  onDragEnd: () => void
  onContextMenu: (e: React.MouseEvent) => void
  onBringToFront: () => void
  // ── Interactions (id already bound by container) ─────────────────────────────
  onToggle: () => void
  onStartEdit: () => void
  onEditChange: (value: string) => void
  onSaveEdit: () => void
  onEditKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  onToggleSubTask: (subtaskId: string) => void
  onDeleteSubTask: (subtaskId: string) => void
  onAddSubTask: (title: string) => void
  onUpdateSubTask: (subtaskId: string, title: string) => void
  onAddingSubTaskClose: () => void
  onToggleExpand: () => void
  onOpenAddSubTask: () => void
  // ── Context menu actions ──────────────────────────────────────────────────────
  onDelete: () => void
  onArchive: () => void
  onSetPriority: (priority: Priority) => void
  onRequestReminder: () => void
  onRequestFolder: () => void
  onDisbandStack?: () => void
  onCloseContextMenu: () => void
}

// ─── Stack count badge (expands on hover to show stack name) ──────────────────
function StackBadge({
  ghostOffset, stackCount, stackName, isExpanded,
  borderColor, bgColor, glow, onToggleExpand,
}: {
  ghostOffset: number; stackCount: number; stackName?: string
  isExpanded: boolean; borderColor: string; bgColor: string; glow: string
  onToggleExpand: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const showName = hovered && !!stackName

  return (
    <button
      onPointerDown={(e) => e.stopPropagation()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => { e.stopPropagation(); onToggleExpand() }}
      style={{
        position: 'absolute',
        top: `${ghostOffset - 8}px`,
        left: `${244 + ghostOffset}px`,
        zIndex: 10,
        background: borderColor,
        color: bgColor,
        borderRadius: 11,
        height: 22,
        maxWidth: showName ? 160 : 22,
        overflow: 'hidden',
        padding: showName ? '0 8px 0 0' : 0,
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        border: 'none',
        boxShadow: `0 0 10px ${glow}, 0 0 4px rgba(0,0,0,0.6)`,
        whiteSpace: 'nowrap',
        transition: 'max-width 220ms ease, padding 220ms ease',
        letterSpacing: 0,
      }}
      title={isExpanded ? 'collapse stack' : 'expand stack'}
    >
      <span style={{
        width: 22, height: 22, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontFamily: "'Space Mono', monospace", fontWeight: 700,
      }}>
        {stackCount + 1}
      </span>
      <span style={{
        fontSize: 9, fontFamily: "'Space Mono', monospace", fontWeight: 400,
        letterSpacing: '0.07em',
        opacity: showName ? 0.9 : 0,
        transition: 'opacity 140ms ease 60ms',
      }}>
        · {stackName}
      </span>
    </button>
  )
}

export function StickyNote({
  todo,
  x,
  y,
  rotation,
  zIndexOverride,
  ns,
  stackTargetShadow,
  borderColor,
  bgColor,
  glowColor,
  boxShadow,
  adjustedGlow,
  priority,
  isInZone,
  isInEdgeZone,
  isInDeleteZone,
  isInArchiveZone,
  isInFolderZone,
  isInStackZone,
  zoneColor,
  zoneLabel,
  isStackTarget,
  stackedNotes,
  isExpanded,
  stackCount,
  isEditing,
  editValue,
  isAddingSubTask,
  contextMenu,
  onDragStart,
  onDrag,
  onDragEnd,
  onContextMenu,
  onBringToFront,
  onToggle,
  onStartEdit,
  onEditChange,
  onSaveEdit,
  onEditKeyDown,
  onToggleSubTask,
  onDeleteSubTask,
  onAddSubTask,
  onUpdateSubTask,
  onAddingSubTaskClose,
  onToggleExpand,
  onOpenAddSubTask,
  onDelete,
  onArchive,
  onSetPriority,
  onRequestReminder,
  onRequestFolder,
  onDisbandStack,
  onCloseContextMenu,
}: StickyNoteProps) {
  const theme = useTheme()
  const palette = theme === 'light' ? LIGHT_NOTE_STYLES : NOTE_STYLES

  // Decide entrance style once on mount: fresh → throw, existing → scale-in
  const isFresh = useMemo(() => isFreshTodo(todo.createdAt), [todo.id])

  // For fresh cards: offset the y MotionValue, then spring it back
  useEffect(() => {
    if (!isFresh) return
    const offset = getThrowYOffset(todo.position.y)
    y.set(todo.position.y + offset)
    animate(y, todo.position.y, NOTE_THROW_TRANSITION)
  }, [todo.id])

  return (
    <>
      <motion.div
        drag
        dragMomentum={false}
        style={{
          x,
          y,
          rotate: rotation,
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: zIndexOverride ?? todo.zIndex,
          width: 256,
          touchAction: 'none',
        }}
        initial={isFresh ? { scale: 0.75, opacity: 0 } : NOTE_DEFAULT_INITIAL}
        animate={{
          scale: isInEdgeZone ? 0.82 : 1,
          opacity: isInEdgeZone ? 0.65 : priority === 'low' ? 0.8 : 1,
        }}
        exit={NOTE_EXIT}
        transition={isFresh ? NOTE_THROW_TRANSITION : NOTE_DEFAULT_TRANSITION}
        onDragStart={onDragStart}
        onDrag={onDrag}
        onDragEnd={onDragEnd}
        onContextMenu={onContextMenu}
        onPointerDown={onBringToFront}
        className="cursor-grab active:cursor-grabbing select-none"
      >
        {/* ── Ghost pile cards ──────────────────────────────────────────────── */}
        {!isExpanded &&
          stackCount > 0 &&
          Array.from({ length: stackCount }, (_, i) => {
            const depth = stackCount - i
            const ghostNote = stackedNotes[i]
            const ghostNs = palette[ghostNote?.color ?? 'cyan']
            const offset = depth * 3
            return (
              <div
                key={ghostNote?.id ?? i}
                style={{
                  position: 'absolute',
                  top: `${offset}px`,
                  left: `${offset}px`,
                  width: 256,
                  height: 160,
                  background: ghostNs.bg,
                  border: `1px solid ${ghostNs.border}`,
                  borderRadius: 3,
                  transform: `rotate(${rotation + depth * 1.5}deg)`,
                  opacity: Math.max(0.08, 0.45 - (depth - 1) * 0.07),
                  pointerEvents: 'none',
                }}
              />
            )
          })}

        {/* ── Main note card ────────────────────────────────────────────────── */}
        <div
          style={{
            background: bgColor,
            border: `1px solid ${borderColor}`,
            boxShadow,
            position: 'relative',
            zIndex: 1,
          }}
          className="rounded-[3px] p-4 overflow-hidden"
        >
          {/* Stack-target ring */}
          {isStackTarget && (
            <div
              className="absolute inset-[-3px] rounded-[5px] pointer-events-none"
              style={{
                border: `2px solid ${ns.border}`,
                boxShadow: stackTargetShadow,
              }}
            />
          )}

          {/* High-priority pulsing ring */}
          {priority === 'high' && !isInZone && (
            <div
              className="absolute inset-[-2px] rounded-[4px] pointer-events-none rf-priority-ring"
              style={{ border: `1px solid ${ns.border}`, color: ns.border }}
            />
          )}

          {/* Header row */}
          <div
            style={{ borderBottom: `1px solid ${ns.dim}` }}
            className="flex items-center justify-between pb-2 mb-3"
          >
            <div className="flex items-center gap-2">
              <span
                style={{ color: ns.dim }}
                className="font-mono text-[10px] tracking-[0.18em] uppercase"
              >
                {todo.completed ? 'done' : 'todo'}
              </span>
              {priority === 'high' && (
                <span
                  className="font-mono text-[10px] tracking-[0.12em]"
                  style={{
                    color: ns.border,
                    textShadow: `0 0 8px ${ns.border}, 0 0 16px ${ns.border}66`,
                  }}
                >
                  high [!+]
                </span>
              )}
              {priority === 'normal' && (
                <span
                  className="font-mono text-[9px] tracking-[0.12em]"
                  style={{ color: ns.border, opacity: 0.55 }}
                >
                  normal [!]
                </span>
              )}
              {priority === 'low' && (
                <span
                  className="font-mono text-[9px] tracking-[0.12em]"
                  style={{ color: ns.dim, opacity: 0.4 }}
                >
                  low [!-]
                </span>
              )}
            </div>
            <span
              style={{
                background: borderColor,
                boxShadow: `0 0 6px ${glowColor}`,
              }}
              className="w-[6px] h-[6px] rounded-full block"
            />
          </div>

          {/* Content row: checkbox + title */}
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={onToggle}
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                width: 14,
                height: 14,
                flexShrink: 0,
                marginTop: 3,
                border: `1px solid ${borderColor}`,
                background: todo.completed ? `${borderColor}30` : 'transparent',
                boxShadow: todo.completed ? `0 0 6px ${glowColor}` : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                borderRadius: 1,
              }}
            >
              {todo.completed && (
                <span
                  style={{ color: ns.check, fontSize: 9, lineHeight: 1 }}
                  className="font-mono"
                >
                  ✕
                </span>
              )}
            </button>

            <div className="flex-1 min-w-0">
              {isEditing && !todo.completed ? (
                <input
                  autoFocus
                  type="text"
                  value={editValue}
                  onChange={(e) => onEditChange(e.target.value)}
                  onBlur={onSaveEdit}
                  onKeyDown={onEditKeyDown}
                  onPointerDown={(e) => e.stopPropagation()}
                  style={{
                    background: 'transparent',
                    color: ns.text,
                    border: 'none',
                    borderBottom: `1px solid ${ns.border}`,
                    outline: 'none',
                    width: '100%',
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '0.8rem',
                    lineHeight: 1.5,
                    caretColor: ns.border,
                  }}
                />
              ) : (
                <span
                  onDoubleClick={() => !todo.completed && onStartEdit()}
                  style={{
                    color: ns.text,
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '0.8rem',
                    lineHeight: 1.5,
                    display: 'block',
                    wordBreak: 'break-word',
                    opacity: todo.completed ? 0.45 : 1,
                    textDecoration: todo.completed ? 'line-through' : 'none',
                    cursor: todo.completed ? 'default' : 'text',
                  }}
                >
                  {todo.title || 'Untitled'}
                </span>
              )}
            </div>
          </div>

          {/* Sub-tasks */}
          <SubTaskList
            subtasks={todo.subtasks}
            borderColor={borderColor}
            textColor={ns.text}
            dimColor={ns.dim}
            checkColor={ns.check}
            glowColor={adjustedGlow}
            isAddingExternal={isAddingSubTask}
            onAddingClose={onAddingSubTaskClose}
            onToggle={onToggleSubTask}
            onDelete={onDeleteSubTask}
            onAdd={onAddSubTask}
            onUpdate={onUpdateSubTask}
          />

          {/* Footer row */}
          <div
            style={{ borderTop: `1px solid ${ns.dim}`, color: ns.dim }}
            className="mt-3 pt-2 flex items-center justify-between"
          >
            <span className="font-mono text-[10px] opacity-75">
              {new Date(todo.createdAt).toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: '2-digit',
              })}
            </span>
            {todo.attachments.length > 0 && (
              <span
                className="font-mono text-[8px] opacity-60"
                style={{ color: ns.dim }}
              >
                [{todo.attachments.length}]
              </span>
            )}
          </div>

          {/* Scanline overlay */}
          <div
            className="pointer-events-none absolute inset-0 rounded-[3px]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.07) 3px, rgba(0,0,0,0.07) 4px)',
            }}
          />

          {/* Drag zone overlay */}
          {isInZone && (
            <div
              className="absolute inset-0 flex items-center justify-center rounded-[3px]"
              style={{
                background: isInDeleteZone
                  ? 'rgba(255,30,30,0.08)'
                  : isInArchiveZone
                    ? 'rgba(57,255,20,0.06)'
                    : isInFolderZone
                      ? 'rgba(191,95,255,0.08)'
                      : isInStackZone
                        ? 'rgba(0,245,255,0.06)'
                        : 'rgba(255,184,0,0.06)',
              }}
            >
              <span
                className="font-mono text-[11px] tracking-[0.2em] uppercase animate-pulse"
                style={{ color: zoneColor, textShadow: `0 0 8px ${zoneColor}` }}
              >
                {zoneLabel}
              </span>
            </div>
          )}
        </div>

        {/* ── Stack count badge ─────────────────────────────────────────────── */}
        {stackCount > 0 &&
          (() => {
            const ghostOffset = stackCount * 3
            const stackName = todo.stackName
            return (
              <StackBadge
                ghostOffset={ghostOffset}
                stackCount={stackCount}
                stackName={stackName}
                isExpanded={isExpanded}
                borderColor={ns.border}
                bgColor={ns.bg}
                glow={ns.glow}
                onToggleExpand={onToggleExpand}
              />
            )
          })()}
      </motion.div>

      <TodoContextMenu
        open={contextMenu.open}
        position={contextMenu.pos}
        onClose={onCloseContextMenu}
        onDelete={onDelete}
        onArchive={onArchive}
        onSetPriority={onSetPriority}
        onAddSubTask={onOpenAddSubTask}
        onSetReminder={onRequestReminder}
        onMoveToFolder={onRequestFolder}
        onDisbandStack={onDisbandStack}
        currentPriority={priority}
        noteColor={ns.border}
      />
    </>
  )
}


