import type { Hono } from 'hono'
import type { AppDb } from '../../application/db.js'
import { deleteFolder, listFolders, saveFolder } from '../../application/folders.js'
import type { FolderRecord } from '../../application/types.js'

type FolderRoutesDeps = {
  db: AppDb
}

export function registerFolderRoutes(app: Hono, deps: FolderRoutesDeps) {
  app.get('/folders', async (c) => {
    const folders = await listFolders(deps.db)
    return c.json(folders)
  })

  app.put('/folders/:id', async (c) => {
    const id = c.req.param('id')
    const body = await c.req.json<FolderRecord>()

    await saveFolder(deps.db, { ...body, id })
    return c.json({ ok: true })
  })

  app.delete('/folders/:id', async (c) => {
    const id = c.req.param('id')
    await deleteFolder(deps.db, id)
    return c.json({ ok: true })
  })
}
