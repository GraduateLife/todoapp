import type { ExportTemplate } from './_types'
import { escapeHtml, formatDate } from './_helpers'
import type { Priority } from '../../types'

const PRIORITY_HEX: Record<Priority, string> = {
  high: '#ff2d78',
  normal: '#ffb800',
  low: '#39ff14',
  idea: '#bf5fff',
  system: '#00f5ff',
}

const fullCard: ExportTemplate = {
  id: 'full-card',
  name: 'Full Card',
  description: 'HTML — title, priority, subtasks, attachments',
  format: 'html',
  render: (todo) => {
    const hex = PRIORITY_HEX[todo.priority]
    const desc = todo.description ? escapeHtml(todo.description) : ''
    const subtaskHtml = todo.subtasks.length
      ? `<ul class="subtasks">${todo.subtasks
          .map(
            (st) => `<li class="${st.completed ? 'done' : ''}">
              <span class="box">${st.completed ? '✓' : '·'}</span>
              <span class="t">${escapeHtml(st.title || '(untitled)')}</span>
            </li>`,
          )
          .join('')}</ul>`
      : ''

    const attHtml = todo.attachments.length
      ? `<div class="attachments">
          <div class="section-label">attachments · ${todo.attachments.length}</div>
          <div class="att-grid">${todo.attachments
            .map((a) => {
              if (a.type === 'image') {
                return `<figure class="att att-image">
                  <img src="${escapeHtml(a.url)}" alt="${escapeHtml(a.name)}" />
                  <figcaption>${escapeHtml(a.name)}</figcaption>
                </figure>`
              }
              const icon =
                a.type === 'voice' ? '♫' : a.type === 'video' ? '▶' : '📄'
              return `<div class="att att-file">
                <span class="icon">${icon}</span>
                <span class="name">${escapeHtml(a.name)}</span>
                <span class="kind">${a.type}</span>
              </div>`
            })
            .join('')}</div>
        </div>`
      : ''

    const doneCount = todo.subtasks.filter((s) => s.completed).length

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(todo.title || 'Untitled')}</title>
<style>
  :root { color-scheme: light dark; }
  body { margin: 0; padding: 40px 20px; background: #0e0f13; color: #e8ecf1;
         font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
         min-height: 100vh; }
  .card { max-width: 640px; margin: 0 auto; background: #151820;
          border: 1px solid rgba(255,255,255,0.08); border-top: 3px solid ${hex};
          border-radius: 10px; padding: 32px 28px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.35); }
  .chips { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
  .chip { font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
          padding: 3px 10px; border-radius: 2px; font-family: ui-monospace, Menlo, monospace; }
  .chip.priority { color: ${hex}; background: ${hex}1a; border: 1px solid ${hex}55; }
  .chip.status { color: #9aa3b2; border: 1px solid rgba(255,255,255,0.12); }
  h1 { font-size: 1.6rem; font-weight: 600; margin: 0 0 18px 0; line-height: 1.3; color: #fff; }
  .desc { font-size: 0.95rem; line-height: 1.65; color: #c7cdd8; white-space: pre-wrap;
          margin: 0 0 24px 0; padding-left: 12px; border-left: 2px solid rgba(255,255,255,0.08); }
  .section-label { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
                   color: #7a8193; margin: 4px 0 8px 0; font-family: ui-monospace, Menlo, monospace; }
  .subtasks { list-style: none; margin: 0 0 24px 0; padding: 0; }
  .subtasks li { display: flex; gap: 10px; align-items: flex-start;
                 padding: 6px 0; font-size: 0.92rem; line-height: 1.5; color: #d6dbe4; }
  .subtasks li.done .t { color: #6d7588; text-decoration: line-through; }
  .subtasks .box { font-family: ui-monospace, Menlo, monospace;
                   width: 18px; height: 18px; display: inline-flex;
                   align-items: center; justify-content: center;
                   border: 1px solid rgba(255,255,255,0.2); border-radius: 3px;
                   font-size: 11px; color: ${hex}; flex-shrink: 0; margin-top: 2px; }
  .subtasks li.done .box { background: ${hex}22; border-color: ${hex}66; }
  .attachments { margin-top: 8px; }
  .att-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
              gap: 10px; }
  .att { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
         border-radius: 6px; padding: 8px; }
  .att-image img { width: 100%; height: 100px; object-fit: cover; border-radius: 3px; display: block; }
  .att-image figcaption { font-size: 11px; color: #9aa3b2; margin-top: 6px;
                          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .att-file { display: flex; flex-direction: column; gap: 4px; min-height: 100px;
              justify-content: center; text-align: center; }
  .att-file .icon { font-size: 24px; color: ${hex}; }
  .att-file .name { font-size: 12px; color: #c7cdd8; word-break: break-all; }
  .att-file .kind { font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #7a8193; }
  .footer { margin-top: 28px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.06);
            font-size: 11px; color: #7a8193; font-family: ui-monospace, Menlo, monospace;
            letter-spacing: 0.1em; display: flex; justify-content: space-between; }
</style>
</head>
<body>
  <div class="card">
    <div class="chips">
      <span class="chip priority">${escapeHtml(todo.priority)}</span>
      ${todo.completed ? '<span class="chip status">completed</span>' : ''}
    </div>
    <h1>${escapeHtml(todo.title || 'Untitled')}</h1>
    ${desc ? `<p class="desc">${desc}</p>` : ''}
    ${subtaskHtml ? `<div class="section-label">subtasks · ${doneCount}/${todo.subtasks.length}</div>${subtaskHtml}` : ''}
    ${attHtml}
    <div class="footer">
      <span>${formatDate(todo.createdAt)}</span>
      <span>${todo.subtasks.length} tasks · ${todo.attachments.length} files</span>
    </div>
  </div>
</body>
</html>`
  },
}

export default fullCard
