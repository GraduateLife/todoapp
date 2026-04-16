import type { ExportTemplate } from './_types'
import { escapeHtml, formatDate, renderSubtasksHtml } from './_helpers'

const minimal: ExportTemplate = {
  id: 'minimal',
  name: 'Minimal',
  description: 'Clean black on white',
  format: 'html',
  render: (todo) => {
    const subtaskHtml = renderSubtasksHtml(todo, '—', '✓')
    const desc = todo.description ? escapeHtml(todo.description) : ''
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(todo.title || 'Untitled')}</title>
<style>
  body { margin: 0; padding: 48px 20px; background: #fafafa; color: #1a1a1a;
         font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
         min-height: 100vh; display: flex; align-items: center; justify-content: center; }
  .card { width: 100%; max-width: 560px; background: #fff; padding: 40px 36px;
          border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 10px 40px rgba(0,0,0,0.05); }
  .tag { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
         color: #888; margin-bottom: 12px; }
  h1 { font-size: 1.5rem; font-weight: 600; margin: 0 0 20px 0; line-height: 1.3; color: #111; }
  .desc { font-size: 0.95rem; line-height: 1.6; color: #444; white-space: pre-wrap;
          margin: 0 0 24px 0; }
  ul { list-style: none; margin: 0; padding: 0; }
  li { font-size: 0.95rem; line-height: 1.8; color: #333; }
  li.done { color: #aaa; text-decoration: line-through; }
  .footer { margin-top: 28px; padding-top: 16px; border-top: 1px solid #eee;
            font-size: 12px; color: #999; }
</style>
</head>
<body>
  <div class="card">
    <div class="tag">${todo.completed ? 'completed' : todo.priority}</div>
    <h1>${escapeHtml(todo.title || 'Untitled')}</h1>
    ${desc ? `<p class="desc">${desc}</p>` : ''}
    ${subtaskHtml ? `<ul>${subtaskHtml}</ul>` : ''}
    <div class="footer">${formatDate(todo.createdAt)}</div>
  </div>
</body>
</html>`
  },
}

export default minimal
