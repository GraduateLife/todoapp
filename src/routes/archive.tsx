import { createFileRoute } from '@tanstack/react-router'
import { useTodoStore } from '#/features/todo/store'

export const Route = createFileRoute('/archive')({
  component: ArchivePage,
})

function ArchivePage() {
  const todos = useTodoStore((s) => s.todos)
  const unarchiveTodo = useTodoStore((s) => s.unarchiveTodo)
  const deleteTodo = useTodoStore((s) => s.deleteTodo)

  const archived = todos.filter((t) => t.archived)

  return (
    <main className="page-wrap px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <p
          className="font-mono text-[9px] tracking-[0.22em] uppercase mb-1"
          style={{ color: 'var(--rf-cyan)', opacity: 0.6 }}
        >
          archive
        </p>
        <p className="font-mono text-[0.75rem]" style={{ color: 'var(--rf-text-dim)' }}>
          {archived.length} item{archived.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* List */}
      {archived.length === 0 ? (
        <p
          className="font-mono text-[0.75rem] text-center py-16 opacity-30"
          style={{ color: 'var(--rf-text-dim)' }}
        >
          no archived items
        </p>
      ) : (
        <div className="flex flex-col gap-1 max-w-lg">
          {archived.map((todo) => (
            <div
              key={todo.id}
              className="flex items-center gap-3 px-3 py-2 rounded-[2px] group"
              style={{
                border: '1px solid rgba(0,245,255,0.06)',
                background: 'rgba(0,245,255,0.02)',
              }}
            >
              {/* Color dot */}
              <span
                className="w-[6px] h-[6px] rounded-full flex-shrink-0"
                style={{
                  background: `var(--rf-${
                    todo.color === 'cyan'
                      ? 'cyan'
                      : todo.color === 'pink'
                        ? 'pink'
                        : todo.color === 'amber'
                          ? 'amber'
                          : todo.color === 'green'
                            ? 'green'
                            : 'purple'
                  })`,
                  opacity: 0.6,
                }}
              />

              {/* Title */}
              <span
                className="flex-1 font-mono text-[0.75rem] truncate opacity-60"
                style={{ color: 'var(--rf-text)', textDecoration: 'line-through' }}
              >
                {todo.title}
              </span>

              {/* Date */}
              <span
                className="font-mono text-[8px] opacity-30 flex-shrink-0"
                style={{ color: 'var(--rf-text-dim)' }}
              >
                {new Date(todo.createdAt).toLocaleDateString('en-US', {
                  month: '2-digit',
                  day: '2-digit',
                  year: '2-digit',
                })}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => unarchiveTodo(todo.id)}
                  className="rf-btn"
                  style={{ padding: '2px 6px', fontSize: '0.65rem' }}
                  title="Restore to canvas"
                >
                  restore
                </button>
                <button
                  type="button"
                  onClick={() => deleteTodo(todo.id)}
                  className="font-mono text-[10px]"
                  style={{ color: '#ff3030', cursor: 'pointer', opacity: 0.7 }}
                  title="Delete permanently"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
