import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { AppDb } from '../application/db.js'
import { registerFolderRoutes } from './routes/folders.js'
import { registerTodoRoutes } from './routes/todos.js'
import { registerShareRoutes } from './routes/shares.js'

type CreateAppOptions = {
  corsOrigin: string
  db: AppDb
}

export function createApp(options: CreateAppOptions) {
  const app = new Hono()

  app.use('*', cors({ origin: options.corsOrigin }))

  registerTodoRoutes(app, { db: options.db })
  registerFolderRoutes(app, { db: options.db })
  registerShareRoutes(app, { db: options.db })

  return app
}
