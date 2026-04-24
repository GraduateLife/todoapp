import type { ExportTemplate } from './_types'
import cyberpunk from './cyberpunk'
import minimal from './minimal'
import receipt from './receipt'
import plainMd from './plain-md'
import checklistMd from './checklist-md'
import fullCard from './full-card'
import fullMd from './full-md'

// ─── Registry ───────────────────────────────────────────────────────────────
// Order here determines the order in the modal's template picker.
// To add a new template: create a file in this folder, default-export an
// `ExportTemplate`, and append it to this list.
export const EXPORT_TEMPLATES: ExportTemplate[] = [
  fullCard,
  cyberpunk,
  minimal,
  receipt,
  fullMd,
  plainMd,
  checklistMd,
]

export function getTemplate(id: string): ExportTemplate | undefined {
  return EXPORT_TEMPLATES.find((t) => t.id === id)
}

export type { ExportTemplate, ExportFormat } from './_types'
