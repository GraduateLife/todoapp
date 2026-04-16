import type { ExportTemplate } from './_types'
import { formatDate } from './_helpers'

const checklistMd: ExportTemplate = {
  id: 'checklist-md',
  name: 'Checklist MD',
  description: 'GitHub task-list style with checkboxes',
  format: 'md',
  render: (todo) => {
    const lines: string[] = []
    // YAML frontmatter
    lines.push('---')
    lines.push(`title: "${(todo.title || 'Untitled').replace(/"/g, '\\"')}"`)
    lines.push(`status: ${todo.completed ? 'done' : 'open'}`)
    lines.push(`priority: ${todo.priority}`)
    lines.push(`created: ${new Date(todo.createdAt).toISOString()}`)
    lines.push('---')
    lines.push('')
    lines.push(`# ${todo.title || 'Untitled'}`)
    lines.push('')
    if (todo.description) {
      lines.push(todo.description)
      lines.push('')
    }
    if (todo.subtasks.length) {
      lines.push('## Tasks')
      lines.push('')
      for (const st of todo.subtasks) {
        lines.push(`- [${st.completed ? 'x' : ' '}] ${st.title}`)
      }
      lines.push('')
    }
    lines.push('---')
    lines.push(`_Exported ${formatDate(Date.now())}_`)
    return lines.join('\n')
  },
}

export default checklistMd
