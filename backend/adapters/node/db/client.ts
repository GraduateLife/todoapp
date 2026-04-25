import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as schema from '../../db/schema.js'

const __dir = dirname(fileURLToPath(import.meta.url))

export function createNodeDb() {
  const dbPath = process.env.DB_PATH ?? './db.sqlite'
  const resolvedDbPath = dbPath.startsWith('/')
    ? dbPath
    : join(__dir, '../../../', dbPath)

  const sqlite = new Database(resolvedDbPath)

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS shares (
      id TEXT PRIMARY KEY,
      todo_id TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      format TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER
    );
  `)

  try {
    sqlite.exec('ALTER TABLE shares ADD COLUMN todo_id TEXT;')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (!/duplicate column name|already exists/i.test(message)) {
      throw error
    }
  }

  sqlite.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS shares_todo_id_unique
    ON shares(todo_id);
  `)

  return drizzle(sqlite, { schema })
}

export type NodeDb = ReturnType<typeof createNodeDb>
