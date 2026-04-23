import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const todosTable = sqliteTable('todos', {
  id: text('id').primaryKey(),
  data: text('data').notNull(),
})

export const foldersTable = sqliteTable('folders', {
  id: text('id').primaryKey(),
  data: text('data').notNull(),
})

export const sharesTable = sqliteTable('shares', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  format: text('format').notNull(),
  content: text('content').notNull(),
  createdAt: integer('created_at').notNull(),
  expiresAt: integer('expires_at'),
})
