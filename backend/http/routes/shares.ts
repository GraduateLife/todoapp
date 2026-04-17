import type { Hono } from 'hono'
import type { AppDb } from '../../application/db.js'
import {
  createShare,
  getShare,
  deleteShare,
  type CreateShareInput,
} from '../../application/shares.js'

type ShareRoutesDeps = {
  db: AppDb
}

// Minimal HTML wrapper for markdown shares — lets plain markdown look
// reasonable in a browser without pulling in a full renderer.
function wrapMarkdown(title: string, md: string): string {
  // Escape HTML entities in the raw markdown so it renders as <pre> safely
  const escaped = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title.replace(/</g, '&lt;')}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#0a0f1c;color:#d8ecf5;font-family:'SF Mono',Monaco,Consolas,monospace;
       font-size:14px;line-height:1.7;padding:32px 24px;max-width:720px;margin:0 auto}
  pre{white-space:pre-wrap;word-break:break-word}
</style>
</head>
<body><pre>${escaped}</pre></body>
</html>`
}

export function registerShareRoutes(app: Hono, deps: ShareRoutesDeps) {
  // Create a share
  app.post('/share', async (c) => {
    const body = await c.req.json<CreateShareInput>()

    if (!body.content || !body.format || !body.title) {
      return c.json({ error: 'missing required fields' }, 400)
    }
    if (body.format !== 'html' && body.format !== 'md') {
      return c.json({ error: 'format must be "html" or "md"' }, 400)
    }

    const share = await createShare(deps.db, body)

    // Build the public URL from the request origin
    const origin = new URL(c.req.url).origin
    const url = `${origin}/s/${share.id}`

    return c.json({
      id: share.id,
      url,
      expiresAt: share.expiresAt,
    })
  })

  // View a share — returns the rendered content as a full page
  app.get('/s/:id', async (c) => {
    const id = c.req.param('id')
    const share = await getShare(deps.db, id)

    if (!share) {
      return c.html(
        '<html><body style="background:#0a0f1c;color:#d8ecf5;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh"><p>share not found or expired</p></body></html>',
        404,
      )
    }

    if (share.format === 'html') {
      return c.html(share.content)
    }

    // Markdown: wrap in minimal HTML viewer
    return c.html(wrapMarkdown(share.title, share.content))
  })

  // Delete a share
  app.delete('/share/:id', async (c) => {
    const id = c.req.param('id')
    await deleteShare(deps.db, id)
    return c.json({ ok: true })
  })
}
