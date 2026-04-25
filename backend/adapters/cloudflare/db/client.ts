import { drizzle } from 'drizzle-orm/d1'
import * as schema from '../../db/schema.js'

type D1RunResult = {
  success?: boolean
}

export interface CloudflareD1Database {
  prepare: (query: string) => {
    run: () => Promise<D1RunResult>
  }
}

const BOOTSTRAP_QUERIES = [
  'CREATE TABLE IF NOT EXISTS todos (id TEXT PRIMARY KEY, data TEXT NOT NULL);',
  'CREATE TABLE IF NOT EXISTS folders (id TEXT PRIMARY KEY, data TEXT NOT NULL);',
  'CREATE TABLE IF NOT EXISTS shares (id TEXT PRIMARY KEY, todo_id TEXT NOT NULL UNIQUE, title TEXT NOT NULL, format TEXT NOT NULL, content TEXT NOT NULL, created_at INTEGER NOT NULL, expires_at INTEGER);',
  'ALTER TABLE shares ADD COLUMN todo_id TEXT;',
  'CREATE UNIQUE INDEX IF NOT EXISTS shares_todo_id_unique ON shares(todo_id);',
]

const bootstrapped = new WeakMap<object, Promise<void>>()

export function createCloudflareDb(d1: CloudflareD1Database) {
  return drizzle(d1 as never, { schema })
}

export function initCloudflareDb(d1: CloudflareD1Database): Promise<void> {
  const existing = bootstrapped.get(d1 as object)
  if (existing) return existing

  const pending = (async () => {
    for (const query of BOOTSTRAP_QUERIES) {
      try {
        await d1.prepare(query).run()
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        if (
          query.startsWith('ALTER TABLE shares ADD COLUMN todo_id') &&
          /duplicate column name|already exists/i.test(message)
        ) {
          continue
        }
        throw error
      }
    }
  })()
  bootstrapped.set(d1 as object, pending)

  return pending.catch((error) => {
    bootstrapped.delete(d1 as object)
    throw error
  })
}

export type CloudflareDb = ReturnType<typeof createCloudflareDb>
