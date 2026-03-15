import { useTodoStore } from '../store'
import { TodoList } from '../components/TodoList'

export function TodoListContainer() {
  const todos = useTodoStore((s) => s.todos)
  const toggleTodo = useTodoStore((s) => s.toggleTodo)
  const updateTitle = useTodoStore((s) => s.updateTitle)
  const deleteTodo = useTodoStore((s) => s.deleteTodo)
  const reorderTodos = useTodoStore((s) => s.reorderTodos)

  return (
    <TodoList
      todos={todos}
      onToggle={toggleTodo}
      onTitleChange={updateTitle}
      onDelete={deleteTodo}
      onReorder={reorderTodos}
    />
  )
}
