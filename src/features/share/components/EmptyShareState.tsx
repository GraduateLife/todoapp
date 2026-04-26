import { useQuery } from '@tanstack/react-query'
import { getShareStrategy } from '#/lib/share'
import type { Todo } from '#/features/todo/types'

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
    <main className="relative page-wrap px-4 py-16 flex flex-col items-center justify-center">
      <p
        className="font-mono text-[9px] tracking-[0.22em] uppercase mb-2"
        style={{ color: '#ffb800', opacity: 0.6 }}
      >
        exported
      </p>
      {!requestedId && (
        <div
          className="w-full max-w-[560px] rounded-[2px] flex flex-col gap-2 mb-6"
          style={{
            padding: '12px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(200,224,244,0.12)',
          }}
        >
          {sharedTodos.isLoading ? (
            <p
              className="font-mono text-[10px]"
              style={{ color: 'var(--rf-text-dim)' }}
            >
              loading shared todos...
            </p>
          ) : sharedTodos.data?.length ? (
            <div className="flex flex-col gap-2">
              {sharedTodos.data.map(({ todo, share }) => (
                <button
                  key={todo.id}
                  type="button"
                  className="text-left rounded-[2px]"
                  onClick={() => onSelectTodo(todo.id)}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid rgba(0,245,255,0.18)',
                    background: 'rgba(0,245,255,0.04)',
                  }}
                >
                  <p
                    className="font-mono text-[10px] uppercase tracking-[0.12em]"
                    style={{ color: '#00f5ff' }}
                  >
                    {todo.title || 'untitled'}
                  </p>
                  <p
                    className="font-mono text-[9px] mt-1"
                    style={{ color: 'var(--rf-text-dim)' }}
                  >
                    {share.url}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <p
              className="font-mono text-[10px]"
              style={{ color: 'var(--rf-text-dim)' }}
            >
              no active shares yet
            </p>
          )}
        </div>
      )}
      <p
        className="font-mono text-[9px]"
        style={{ color: 'var(--rf-text-dim)' }}
      >
        click to inspect any shared todo.
      </p>
    </main>
  )
}
