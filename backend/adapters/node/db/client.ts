import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as schema from './schema.js'

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
  `)

  return drizzle(sqlite, { schema })
}

export type NodeDb = ReturnType<typeof createNodeDb>
