import type { Todo } from '../../types'

export type ExportFormat = 'html' | 'md'

export interface ExportTemplate {
  /** Stable key used for selection & storage */
  id: string
  /** Short display name (shown as a pill button) */
  name: string
  /** One-line description shown in a tooltip */
  description: string
  /** What the `render` function produces — determines preview + download extension */
  format: ExportFormat
  /** Produce the final string (a full HTML document, or raw markdown) */
  render: (todo: Todo) => string
}
