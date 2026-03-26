import { motion } from 'framer-motion'
import type { MotionValue } from 'framer-motion'
import { TodoContextMenu } from './TodoContextMenu'
import { SubTaskList } from './note/SubTaskList'
import { NOTE_STYLES } from '../constants/noteColors'
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
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{
          scale: isInEdgeZone ? 0.82 : 1,
          opacity: isInEdgeZone ? 0.65 : priority === 'low' ? 0.8 : 1,
        }}
        exit={{
          scale: 0.3,
          opacity: 0,
          transition: { duration: 0.15, ease: 'easeIn' },
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
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
            const ghostNs = NOTE_STYLES[ghostNote?.color ?? 'cyan']
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

        {/* ── Reminder flowing ring ─────────────────────────────────────────── */}
        {todo.reminder && !isInZone && (
          <div
            style={{
              position: 'absolute',
              top: -8,
              left: -8,
              right: -8,
              bottom: -8,
              borderRadius: 10,
              overflow: 'hidden',
              zIndex: 0,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                position: 'absolute',
                width: '200%',
                height: '200%',
                top: '-50%',
                left: '-50%',
                background: `conic-gradient(from 0deg, transparent 0%, transparent 55%, ${ns.border}44 65%, ${ns.border}cc 73%, ${ns.border} 78%, ${ns.border}cc 83%, ${ns.border}44 91%, transparent 100%)`,
                animation: 'rf-reminder-spin 3s linear infinite',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 3,
                left: 3,
                right: 3,
                bottom: 3,
                borderRadius: 7,
                background: ns.bg,
              }}
            />
          </div>
        )}

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
              className={`w-[6px] h-[6px] rounded-full block ${priority === 'high' ? 'rf-priority-ring' : ''}`}
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
            return (
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleExpand()
                }}
                style={{
                  position: 'absolute',
                  top: `${ghostOffset - 8}px`,
                  right: `${-(ghostOffset + 10)}px`,
                  zIndex: 10,
                  background: ns.border,
                  color: ns.bg,
                  borderRadius: '50%',
                  width: 22,
                  height: 22,
                  fontSize: 10,
                  fontFamily: "'Space Mono', monospace",
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  border: 'none',
                  boxShadow: `0 0 10px ${ns.glow}, 0 0 4px rgba(0,0,0,0.6)`,
                  letterSpacing: 0,
                }}
                title={isExpanded ? 'collapse stack' : 'expand stack'}
              >
                {stackCount + 1}
              </button>
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
