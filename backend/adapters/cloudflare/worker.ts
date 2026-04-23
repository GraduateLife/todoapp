import type { CloudflareD1Database } from './db/client.js'
import { createApp } from '../../http/app.js'
import { createCloudflareDb, initCloudflareDb } from './db/client.js'

type WorkerEnv = {
  DB: CloudflareD1Database
  CORS_ORIGIN?: string
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    await initCloudflareDb(env.DB)

    const app = createApp({
      corsOrigin: env.CORS_ORIGIN ?? new URL(request.url).origin,
      db: createCloudflareDb(env.DB),
    })

    return app.fetch(request, env)
  },
}
