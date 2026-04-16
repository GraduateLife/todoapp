import type { ExportTemplate } from './_types'
import { escapeHtml, formatDate, renderSubtasksHtml } from './_helpers'

const receipt: ExportTemplate = {
  id: 'receipt',
  name: 'Receipt',
  description: 'Thermal-printer style',
  format: 'html',
  render: (todo) => {
    const subtaskHtml = renderSubtasksHtml(todo, '[ ]', '[x]')
    const desc = todo.description ? escapeHtml(todo.description) : ''
    const stamp = formatDate(todo.createdAt)
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(todo.title || 'Untitled')}</title>
<style>
  body { margin: 0; padding: 40px 20px; background: #2a2a2a;
         font-family: 'Courier New', Courier, monospace;
         min-height: 100vh; display: flex; align-items: center; justify-content: center; }
  .paper { width: 100%; max-width: 360px; background: #f4f0e6; color: #1a1a1a;
           padding: 28px 24px 24px; box-shadow: 0 12px 40px rgba(0,0,0,0.5);
           position: relative; }
  .paper::before, .paper::after {
    content: ''; position: absolute; left: 0; right: 0; height: 12px;
    background:
      repeating-linear-gradient(45deg,
        transparent 0 6px, #f4f0e6 6px 12px),
      linear-gradient(#f4f0e6, #f4f0e6);
    background-blend-mode: normal;
  }
  .paper::before { top: -12px; clip-path: polygon(
    0 100%, 5% 0, 10% 100%, 15% 0, 20% 100%, 25% 0, 30% 100%, 35% 0,
    40% 100%, 45% 0, 50% 100%, 55% 0, 60% 100%, 65% 0, 70% 100%, 75% 0,
    80% 100%, 85% 0, 90% 100%, 95% 0, 100% 100%); }
  .paper::after { bottom: -12px; clip-path: polygon(
    0 0, 5% 100%, 10% 0, 15% 100%, 20% 0, 25% 100%, 30% 0, 35% 100%,
    40% 0, 45% 100%, 50% 0, 55% 100%, 60% 0, 65% 100%, 70% 0, 75% 100%,
    80% 0, 85% 100%, 90% 0, 95% 100%, 100% 0); }
  .head { text-align: center; font-size: 11px; letter-spacing: 0.3em;
          text-transform: uppercase; border-bottom: 1px dashed #1a1a1a;
          padding-bottom: 10px; margin-bottom: 14px; }
  h1 { font-size: 1rem; font-weight: 700; text-transform: uppercase;
       margin: 0 0 14px 0; text-align: center; letter-spacing: 0.05em; }
  .desc { font-size: 0.78rem; line-height: 1.6; white-space: pre-wrap;
          margin: 0 0 14px 0; padding: 8px 0; border-top: 1px dashed #1a1a1a;
          border-bottom: 1px dashed #1a1a1a; }
  ul { list-style: none; margin: 0; padding: 0; }
  li { font-size: 0.78rem; line-height: 1.9; }
  li.done { text-decoration: line-through; opacity: 0.6; }
  .foot { text-align: center; border-top: 1px dashed #1a1a1a; margin-top: 14px;
          padding-top: 10px; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; }
</style>
</head>
<body>
  <div class="paper">
    <div class="head">— task receipt —</div>
    <h1>${escapeHtml(todo.title || 'Untitled')}</h1>
    ${desc ? `<div class="desc">${desc}</div>` : ''}
    ${subtaskHtml ? `<ul>${subtaskHtml}</ul>` : ''}
    <div class="foot">${stamp} · ${todo.completed ? 'closed' : todo.priority}</div>
  </div>
</body>
</html>`
  },
}

export default receipt
