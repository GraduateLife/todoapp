import { useTodoStore } from '../features/todo/store'

export default function DevTools() {
  const todos = useTodoStore((s) => s.todos)
  const deleteTodo = useTodoStore((s) => s.deleteTodo)
  return (
    <button
      type="button"
      onClick={() => { todos.forEach((t) => deleteTodo(t.id)) }}
      style={{
        background: 'none',
        border: '1px solid rgba(255,48,48,0.3)',
        color: 'rgba(255,48,48,0.6)',
        fontFamily: "'Space Mono', monospace",
        fontSize: 9,
        letterSpacing: '0.1em',
        padding: '1px 6px',
        cursor: 'pointer',
        borderRadius: 2,
        pointerEvents: 'auto',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255,48,48,0.7)'
        e.currentTarget.style.color = '#ff3030'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255,48,48,0.3)'
        e.currentTarget.style.color = 'rgba(255,48,48,0.6)'
      }}
    >
      DEV:CLEAR ALL ({todos.length})
    </button>
  )
}
