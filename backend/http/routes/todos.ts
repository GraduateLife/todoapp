import type { Hono } from 'hono'
import type { AppDb } from '../../application/db.js'
import { deleteTodo, listTodos, saveTodo } from '../../application/todos.js'
import type { TodoRecord } from '../../application/types.js'

type TodoRoutesDeps = {
  db: AppDb
}

export function registerTodoRoutes(app: Hono, deps: TodoRoutesDeps) {
  app.get('/todos', async (c) => {
    const todos = await listTodos(deps.db)
    return c.json(todos)
  })

  app.put('/todos/:id', async (c) => {
    const id = c.req.param('id')
    const body = await c.req.json<TodoRecord>()

    await saveTodo(deps.db, { ...body, id })
    return c.json({ ok: true })
  })

  app.delete('/todos/:id', async (c) => {
    const id = c.req.param('id')
    await deleteTodo(deps.db, id)
    return c.json({ ok: true })
  })
}
