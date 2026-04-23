import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { AppDb } from '../application/db.js'
import { registerFolderRoutes } from './routes/folders.js'
import { registerTodoRoutes } from './routes/todos.js'
import { registerShareRoutes } from './routes/shares.js'

type CreateAppOptions = {
  corsOrigin: string | string[]
  db: AppDb
}

function normalizeCorsOrigins(input: string | string[]): string[] {
  const values = Array.isArray(input) ? input : input.split(',')
  return values.map((value) => value.trim()).filter(Boolean)
}

function matchesWildcardOrigin(origin: string, rule: string): boolean {
  if (!rule.includes('*')) return origin === rule

  try {
    const originUrl = new URL(origin)
    const ruleUrl = new URL(rule.replace('*.', 'placeholder.'))
    if (originUrl.protocol !== ruleUrl.protocol) return false

    const suffix = ruleUrl.hostname.replace(/^placeholder\./, '.')
    return originUrl.hostname.endsWith(suffix)
  } catch {
    return false
  }
}

function resolveCorsOrigin(origin: string, rules: string[]): string | undefined {
  if (!origin) return undefined

  for (const rule of rules) {
    if (rule === '*') return '*'
    if (matchesWildcardOrigin(origin, rule)) return origin
  }

  return undefined
}

export function createApp(options: CreateAppOptions) {
  const app = new Hono()
  const allowedOrigins = normalizeCorsOrigins(options.corsOrigin)

  app.use(
    '*',
    cors({
      origin: (origin) => resolveCorsOrigin(origin, allowedOrigins),
    }),
  )

  registerTodoRoutes(app, { db: options.db })
  registerFolderRoutes(app, { db: options.db })
  registerShareRoutes(app, { db: options.db })

  return app
}
