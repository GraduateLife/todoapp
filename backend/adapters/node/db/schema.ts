import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const todosTable = sqliteTable('todos', {
  id: text('id').primaryKey(),
  data: text('data').notNull(),
})

export const foldersTable = sqliteTable('folders', {
  id: text('id').primaryKey(),
  data: text('data').notNull(),
})
