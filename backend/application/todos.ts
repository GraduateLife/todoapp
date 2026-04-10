import { eq } from 'drizzle-orm'
import { todosTable } from '../adapters/node/db/schema.js'
import type { AppDb } from './db.js'
import type { TodoRecord } from './types.js'

export async function listTodos(db: AppDb): Promise<TodoRecord[]> {
  const rows = await db.select().from(todosTable)
  return rows.map((row) => JSON.parse(row.data) as TodoRecord)
}

export async function saveTodo(db: AppDb, todo: TodoRecord): Promise<void> {
  await db
    .insert(todosTable)
    .values({
      id: todo.id,
      data: JSON.stringify(todo),
    })
    .onConflictDoUpdate({
      target: todosTable.id,
      set: { data: JSON.stringify(todo) },
    })
}

export async function deleteTodo(db: AppDb, id: string): Promise<void> {
  await db.delete(todosTable).where(eq(todosTable.id, id))
}
