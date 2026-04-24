import type { ExportTemplate } from './_types'
import { formatDate } from './_helpers'

const fullMd: ExportTemplate = {
  id: 'full-md',
  name: 'Full MD',
  description: 'Markdown — with priority, subtasks & attachments',
  format: 'md',
  render: (todo) => {
    const lines: string[] = []
    lines.push(`# ${todo.title || 'Untitled'}`)
    lines.push('')

    const meta: string[] = [`**priority:** ${todo.priority}`]
    if (todo.completed) meta.push('**status:** done')
    meta.push(`**created:** ${formatDate(todo.createdAt)}`)
    lines.push(meta.join(' · '))
    lines.push('')

    if (todo.description) {
      lines.push(todo.description)
      lines.push('')
    }

    if (todo.subtasks.length) {
      const done = todo.subtasks.filter((s) => s.completed).length
      lines.push(`## Subtasks (${done}/${todo.subtasks.length})`)
      lines.push('')
      for (const st of todo.subtasks) {
        const box = st.completed ? '[x]' : '[ ]'
        const title = st.title || '(untitled)'
        lines.push(`- ${box} ${st.completed ? `~~${title}~~` : title}`)
      }
      lines.push('')
    }

    if (todo.attachments.length) {
      lines.push(`## Attachments (${todo.attachments.length})`)
      lines.push('')
      for (const a of todo.attachments) {
        if (a.type === 'image') {
          lines.push(`![${a.name}](${a.url})`)
        } else {
          lines.push(`- \`${a.type}\` · [${a.name}](${a.url})`)
        }
      }
      lines.push('')
    }

    return lines.join('\n').trimEnd() + '\n'
  },
}

export default fullMd
