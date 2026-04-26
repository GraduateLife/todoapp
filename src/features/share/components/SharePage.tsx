import { useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { Todo } from '#/features/todo/types'
import { EmptyShareState } from './EmptyShareState'
import { ShareWorkspace } from './ShareWorkspace'

interface SharePageProps {
  requestedId?: string
  todo: Todo | null
  todos: Todo[]
}

export function SharePage({ requestedId, todo, todos }: SharePageProps) {
  const navigate = useNavigate()

  const handleBack = useCallback(() => {
    navigate({ to: '/share' })
  }, [navigate])

  const handleSelectTodo = useCallback(
    (todoId: string) => {
      navigate({
        to: '/share',
        search: { id: todoId },
      })
    },
    [navigate],
  )

  if (!requestedId || !todo) {
    return (
      <EmptyShareState
        requestedId={requestedId}
        todos={todos}
        onSelectTodo={handleSelectTodo}
      />
    )
  }

  return <ShareWorkspace todo={todo} onBack={handleBack} />
}
