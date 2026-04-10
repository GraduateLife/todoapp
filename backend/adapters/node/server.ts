import { serve } from '@hono/node-server'
import { config } from 'dotenv'
import { createApp } from '../../http/app.js'
import { createNodeDb } from './db/client.js'

config({ path: new URL('../../.env', import.meta.url).pathname })

const PORT = Number(process.env.PORT ?? '8000')
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:3000'

const db = createNodeDb()

const app = createApp({
  corsOrigin: CORS_ORIGIN,
  db,
})

serve({ fetch: app.fetch, port: PORT })
console.log(`[backend] http://localhost:${PORT}`)
