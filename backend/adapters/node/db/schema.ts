import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const todosTable = sqliteTable('todos', {
  id: text('id').primaryKey(),
  data: text('data').notNull(),
})

export const foldersTable = sqliteTable('folders', {
  id: text('id').primaryKey(),
  data: text('data').notNull(),
})

export const sharesTable = sqliteTable('shares', {
  id: text('id').primaryKey(),            // nanoid slug, e.g. "a1b2c3d4"
  title: text('title').notNull(),
  format: text('format').notNull(),       // 'html' | 'md'
  content: text('content').notNull(),     // rendered HTML or Markdown
  createdAt: integer('created_at').notNull(),
  expiresAt: integer('expires_at'),       // null = never expires
})
