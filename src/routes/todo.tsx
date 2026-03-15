import { createFileRoute } from '@tanstack/react-router'
import MainLayout from '../layouts/MainLayout'
import { TodoInputContainer } from '../features/todo/containers/TodoInputContainer'
import { TodoListContainer } from '../features/todo/containers/TodoListContainer'

export const Route = createFileRoute('/todo')({
  component: TodoPage,
})

function TodoPage() {
  return (
    <MainLayout>
      <section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />
        <p className="island-kicker mb-3">Todo</p>
        <h1 className="display-title mb-6 max-w-3xl text-3xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-4xl">
          Get things done
        </h1>
        <div className="mb-6">
          <TodoInputContainer />
        </div>
        <TodoListContainer />
      </section>
    </MainLayout>
  )
}
