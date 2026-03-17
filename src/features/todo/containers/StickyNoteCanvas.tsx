import { AnimatePresence } from 'framer-motion'
import { useTodoStore } from '../store'
import { StickyNote } from '../components/StickyNote'

export function StickyNoteCanvas() {
  const todos = useTodoStore((s) => s.todos)
  const moveTodo = useTodoStore((s) => s.moveTodo)
  const bringToFront = useTodoStore((s) => s.bringToFront)
  const deleteTodo = useTodoStore((s) => s.deleteTodo)
  const toggleTodo = useTodoStore((s) => s.toggleTodo)
  const updateTitle = useTodoStore((s) => s.updateTitle)

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      // style={{ zIndex: 10 }}
      aria-label="Sticky notes canvas"
    >
      <AnimatePresence>
        {todos.map((todo) => (
          <StickyNote
            key={todo.id}
            todo={todo}
            onMove={moveTodo}
            onBringToFront={bringToFront}
            onDelete={deleteTodo}
            onToggle={toggleTodo}
            onUpdateTitle={updateTitle}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
