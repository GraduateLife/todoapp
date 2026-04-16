import type { ExportTemplate } from './_types'
import { formatDate } from './_helpers'

const plainMd: ExportTemplate = {
  id: 'plain-md',
  name: 'Plain MD',
  description: 'Markdown — heading + bullets',
  format: 'md',
  render: (todo) => {
    const lines: string[] = []
    lines.push(`# ${todo.title || 'Untitled'}`)
    lines.push('')
    if (todo.description) {
      lines.push(todo.description)
      lines.push('')
    }
    if (todo.subtasks?.length) {
      for (const st of todo.subtasks) {
        lines.push(`- ${st.completed ? '~~' : ''}${st.title}${st.completed ? '~~' : ''}`)
      }
      lines.push('')
    }
    lines.push(
      `*${formatDate(todo.createdAt)} · ${todo.completed ? 'done' : todo.priority}*`,
    )
    return lines.join('\n')
  },
}

export default plainMd
