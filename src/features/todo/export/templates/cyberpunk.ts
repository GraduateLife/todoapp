import type { ExportTemplate } from './_types'
import { escapeHtml, formatDate, renderSubtasksHtml } from './_helpers'

const cyberpunk: ExportTemplate = {
  id: 'cyberpunk',
  name: 'Cyberpunk',
  description: 'Neon terminal — matches this app',
  format: 'html',
  render: (todo) => {
    const subtaskHtml = renderSubtasksHtml(todo, '›', '✕')
    const desc = todo.description ? escapeHtml(todo.description) : ''
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(todo.title || 'Untitled')}</title>
<style>
  :root {
    --bg: #04060c;
    --fg: #e6faff;
    --dim: rgba(0,245,255,0.45);
    --accent: #00f5ff;
    --border: rgba(0,245,255,0.25);
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 32px 20px;
    background: var(--bg); color: var(--fg);
    font-family: 'Space Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
    min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    background-image:
      repeating-linear-gradient(0deg, transparent, transparent 3px,
        rgba(0,0,0,0.35) 3px, rgba(0,0,0,0.35) 4px);
  }
  .card {
    width: 100%; max-width: 520px;
    border: 1px solid var(--border); border-radius: 3px;
    padding: 28px 26px 24px;
    background: rgba(0,245,255,0.02);
    box-shadow: 0 0 40px rgba(0,245,255,0.10), inset 0 1px 0 rgba(255,255,255,0.04);
  }
  .meta { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--dim); margin-bottom: 14px;
          display: flex; justify-content: space-between; align-items: center; }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent);
         box-shadow: 0 0 6px var(--accent); }
  h1 { font-size: 1.15rem; font-weight: 400; letter-spacing: 0.02em;
       margin: 0 0 16px 0; line-height: 1.4; word-break: break-word; }
  .desc { font-size: 0.82rem; line-height: 1.55; color: rgba(230,250,255,0.75);
          white-space: pre-wrap; word-break: break-word;
          border-left: 2px solid var(--border); padding: 4px 0 4px 12px; margin: 0 0 16px 0; }
  ul { list-style: none; margin: 0; padding: 0; }
  li { font-size: 0.78rem; line-height: 1.8; letter-spacing: 0.02em; }
  li.done { color: var(--dim); text-decoration: line-through; }
  .footer { border-top: 1px solid var(--border); margin-top: 20px; padding-top: 12px;
            font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--dim);
            display: flex; justify-content: space-between; }
</style>
</head>
<body>
  <div class="card">
    <div class="meta">
      <span>${todo.completed ? 'done' : todo.priority}</span>
      <span class="dot"></span>
    </div>
    <h1>${escapeHtml(todo.title || 'Untitled')}</h1>
    ${desc ? `<p class="desc">${desc}</p>` : ''}
    ${subtaskHtml ? `<ul>${subtaskHtml}</ul>` : ''}
    <div class="footer">
      <span>${formatDate(todo.createdAt)}</span>
      <span>// exported</span>
    </div>
  </div>
</body>
</html>`
  },
}

export default cyberpunk
