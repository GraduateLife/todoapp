import { useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { listContainerVariants } from '../animations/listAnimations'
import { TodoItem } from './TodoItem'
import type { Todo } from '../types'

interface TodoListProps {
  todos: Todo[]
  onToggle: (id: string) => void
  onTitleChange: (id: string, title: string) => void
  onDelete: (id: string) => void
  onReorder: (fromIndex: number, toIndex: number) => void
}

function SortableTodoItem({
  todo,
  onToggle,
  onTitleChange,
  onDelete,
}: {
  todo: Todo
  onToggle: () => void
  onTitleChange: (title: string) => void
  onDelete: () => void
}) {
  const {
    setNodeRef,
    listeners,
    attributes,
    transform,
    transition,
  } = useSortable({ id: todo.id })

  return (
    <TodoItem
      todo={todo}
      onToggle={onToggle}
      onTitleChange={onTitleChange}
      onDelete={onDelete}
      sortableRef={setNodeRef}
      dragHandleListeners={listeners}
      dragHandleAttributes={attributes}
      transform={transform}
      transition={transition}
    />
  )
}

export function TodoList({
  todos,
  onToggle,
  onTitleChange,
  onDelete,
  onReorder,
}: TodoListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor)
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (over == null || active.id === over.id) return
      const fromIndex = todos.findIndex((t) => t.id === active.id)
      const toIndex = todos.findIndex((t) => t.id === over.id)
      if (fromIndex === -1 || toIndex === -1) return
      onReorder(fromIndex, toIndex)
    },
    [todos, onReorder]
  )

  const ids = todos.map((t) => t.id)

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
      <motion.ul
        className="flex flex-col gap-2"
        variants={listContainerVariants}
        initial="initial"
        animate="animate"
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <AnimatePresence mode="popLayout">
            {todos.map((todo) => (
              <SortableTodoItem
                key={todo.id}
                todo={todo}
                onToggle={() => onToggle(todo.id)}
                onTitleChange={(title) => onTitleChange(todo.id, title)}
                onDelete={() => onDelete(todo.id)}
              />
            ))}
          </AnimatePresence>
        </SortableContext>
      </motion.ul>
    </DndContext>
  )
}
