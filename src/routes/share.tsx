import { createFileRoute } from '@tanstack/react-router'
import { useTodoStore } from '#/features/todo/store'
import { SharePage } from '#/features/share'

type ShareSearch = {
  id?: string
}

export const Route = createFileRoute('/share')({
  validateSearch: (search: Record<string, unknown>): ShareSearch => ({
    id: typeof search.id === 'string' ? search.id : undefined,
  }),
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useSearch()
  const todos = useTodoStore((s) => s.todos)
  const todo = useTodoStore((s) =>
    id ? (s.todos.find((t) => t.id === id) ?? null) : null,
  )

  return <SharePage requestedId={id} todo={todo} todos={todos} />
}
