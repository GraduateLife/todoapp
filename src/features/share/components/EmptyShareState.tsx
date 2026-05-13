import { useQuery } from '@tanstack/react-query'
import { getShareStrategy } from '#/lib/share'
import type { Todo } from '#/features/todo/types'
import { ShareMonitorGrid } from './ShareMonitorGrid'

interface EmptyShareStateProps {
  requestedId?: string
  todos: Todo[]
  onSelectTodo: (todoId: string) => void
}

export function EmptyShareState({
  requestedId,
  todos,
  onSelectTodo,
}: EmptyShareStateProps) {
  const sharedTodos = useQuery({
    queryKey: ['share', 'active-list', todos.map((todo) => todo.id)],
    queryFn: async () => {
      const strategy = getShareStrategy()
      const results = await Promise.all(
        todos.map(async (todo) => ({
          todo,
          share: await strategy.getByTodoId(todo.id),
        })),
      )

      return results.filter(
        (
          entry,
        ): entry is {
          todo: Todo
          share: NonNullable<typeof entry.share>
        } => Boolean(entry.share),
      )
    },
    enabled: !requestedId && todos.length > 0,
    staleTime: 10_000,
  })

  return (
    <main className="relative page-wrap px-4 py-12 flex flex-col items-center">
      <p
        className="font-mono uppercase tracking-[0.22em] mb-4"
        style={{
          fontSize: 9,
          color: 'var(--rf-text-dim)',
        }}
      >
        [ monitor wall ]
      </p>
      {!requestedId && (
        <div className="w-full max-w-[1080px] mb-6">
          {sharedTodos.isLoading ? (
            <p
              className="font-mono"
              style={{ fontSize: 10, color: 'var(--rf-text-dim)' }}
            >
              &gt; scanning channels...
            </p>
          ) : sharedTodos.data?.length ? (
            <ShareMonitorGrid
              entries={sharedTodos.data}
              onSelectTodo={onSelectTodo}
            />
          ) : (
            <p
              className="font-mono"
              style={{ fontSize: 10, color: 'var(--rf-text-dim)' }}
            >
              &gt; no active shares yet
            </p>
          )}
        </div>
      )}
      <p
        className="font-mono"
        style={{ fontSize: 9, color: 'var(--rf-text-dim)' }}
      >
        &gt; click any monitor to inspect
      </p>
    </main>
  )
}
