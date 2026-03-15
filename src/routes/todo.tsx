import { createFileRoute } from '@tanstack/react-router'
import { StickyNoteCanvas } from '../features/todo/containers/StickyNoteCanvas'
import { TodoInputContainer } from '../features/todo/containers/TodoInputContainer'

export const Route = createFileRoute('/todo')({
  component: TodoPage,
})

function TodoPage() {
  return (
    <>
      <div className="rf-scanlines" aria-hidden="true" />
      <StickyNoteCanvas />
      <TodoInputContainer />
    </>
  )
}
