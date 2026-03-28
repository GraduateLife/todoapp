import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import Database from 'better-sqlite3'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dir = dirname(fileURLToPath(import.meta.url))
const db = new Database(join(__dir, 'db.sqlite'))

// ── Schema ────────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS folders (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );
`)

// ── App ───────────────────────────────────────────────────────────────────────

const app = new Hono()

app.use('*', cors({ origin: 'http://localhost:3000' }))

// ── Todos ─────────────────────────────────────────────────────────────────────

app.get('/todos', (c) => {
  const rows = db.prepare('SELECT data FROM todos').all() as { data: string }[]
  return c.json(rows.map((r) => JSON.parse(r.data)))
})

app.put('/todos/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  db.prepare('INSERT OR REPLACE INTO todos (id, data) VALUES (?, ?)').run(
    id,
    JSON.stringify(body),
  )
  return c.json({ ok: true })
})

app.delete('/todos/:id', (c) => {
  const id = c.req.param('id')
  db.prepare('DELETE FROM todos WHERE id = ?').run(id)
  return c.json({ ok: true })
})

// ── Folders ───────────────────────────────────────────────────────────────────

app.get('/folders', (c) => {
  const rows = db.prepare('SELECT data FROM folders').all() as { data: string }[]
  return c.json(rows.map((r) => JSON.parse(r.data)))
})

app.put('/folders/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  db.prepare('INSERT OR REPLACE INTO folders (id, data) VALUES (?, ?)').run(
    id,
    JSON.stringify(body),
  )
  return c.json({ ok: true })
})

app.delete('/folders/:id', (c) => {
  const id = c.req.param('id')
  db.prepare('DELETE FROM folders WHERE id = ?').run(id)
  return c.json({ ok: true })
})

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = 8000
serve({ fetch: app.fetch, port: PORT })
console.log(`[backend] http://localhost:${PORT}`)
