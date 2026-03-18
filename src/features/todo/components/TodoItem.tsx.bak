import { useState, useCallback } from 'react'
import { Checkbox } from '@heroui/react'
import { motion } from 'framer-motion'
import { CSS, type Transform } from '@dnd-kit/utilities'
import type { Todo } from '../types'
import { listItemVariants } from '../animations/listAnimations'
import { EditableTitle } from './EditableTitle'
import { TodoContextMenu } from './TodoContextMenu'
import { useLongPress } from '../hooks/useLongPress'

interface TodoItemProps {
  todo: Todo
  onToggle: () => void
  onTitleChange: (title: string) => void
  onDelete: () => void
  layoutId?: string
  /** dnd-kit sortable: ref for the sortable element */
  sortableRef?: (node: HTMLLIElement | null) => void
  /** dnd-kit: attach to drag handle only */
  dragHandleListeners?: Record<string, unknown>
  dragHandleAttributes?: Record<string, unknown>
  transform?: Transform | null
  transition?: string | null
}

export function TodoItem({
  todo,
  onToggle,
  onTitleChange,
  onDelete,
  layoutId,
  sortableRef,
  dragHandleListeners,
  dragHandleAttributes,
  transform,
  transition,
}: TodoItemProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)

  const openContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }, [])

  const closeContextMenu = useCallback(() => setContextMenu(null), [])

  const longPress = useLongPress({
    onLongPress: onDelete,
    thresholdMs: 800,
  })

  const hasHandle = Boolean(dragHandleListeners && dragHandleAttributes)
  const rowStyle =
    transform != null && transition != null
      ? {
          transform: CSS.Transform.toString(transform),
          transition,
        }
      : undefined

  return (
    <>
      <motion.li
        ref={sortableRef}
        layout
        variants={listItemVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        layoutId={layoutId}
        className="flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 shadow-sm"
        style={rowStyle}
      >
        {hasHandle && (
          <span
            className="touch-none cursor-grab self-stretch py-2 pr-1 text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)] [&:active]:cursor-grabbing"
            {...dragHandleListeners}
            {...dragHandleAttributes}
            aria-label="Drag to reorder"
          >
            ⋮⋮
          </span>
        )}
        <div
          className="flex min-w-0 flex-1 items-center gap-2"
          onContextMenu={openContextMenu}
          {...longPress}
        >
          <Checkbox
            isSelected={todo.completed}
            onValueChange={onToggle}
            aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
            classNames={{
              base: 'p-0',
              wrapper: 'after:border-[var(--lagoon)] after:bg-[var(--lagoon)]',
            }}
          />
          <EditableTitle
            title={todo.title}
            onSave={onTitleChange}
            className={todo.completed ? 'line-through opacity-70' : ''}
            disabled={todo.completed}
          />
          {todo.attachments.length > 0 && (
            <span className="ml-1 text-xs text-[var(--sea-ink-soft)]">
              ({todo.attachments.length})
            </span>
          )}
        </div>
      </motion.li>
      <TodoContextMenu
        open={contextMenu !== null}
        position={contextMenu ?? { x: 0, y: 0 }}
        onClose={closeContextMenu}
        onDelete={onDelete}
      />
    </>
  )
}
