import type { Todo } from '../../types'

// ─── HTML helpers ───────────────────────────────────────────────────────────

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function renderSubtasksHtml(
  todo: Todo,
  bullet: string,
  doneBullet: string,
): string {
  if (!todo.subtasks?.length) return ''
  return todo.subtasks
    .map(
      (st) =>
        `<li class="${st.completed ? 'done' : ''}">${
          st.completed ? doneBullet : bullet
        } ${escapeHtml(st.title)}</li>`,
    )
    .join('')
}

// ─── Markdown helpers ───────────────────────────────────────────────────────

/** Slugify a title for filenames — lowercase, alphanum + dashes, trimmed */
export function slugify(s: string, max = 40): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, max) || 'todo'
  )
}
