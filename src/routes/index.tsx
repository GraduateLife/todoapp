import { createFileRoute } from '@tanstack/react-router'
import { StickyNoteCanvas } from '../features/todo/containers/StickyNoteCanvas'
import { TodoInputContainer } from '../features/todo/containers/TodoInputContainer'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <>
      {/* Global CRT scanline overlay */}
      <div className="rf-scanlines" aria-hidden="true" />

      {/* Full-screen sticky note canvas */}
      <StickyNoteCanvas />

      {/* Fixed bottom input bar */}
      <TodoInputContainer />
    </>
  )
}
