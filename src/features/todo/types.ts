export interface Attachment {
  id: string
  type: 'image' | 'voice' | 'video' | 'file'
  url: string // base64 data URL or object URL
  name: string
}

export type NoteColor = 'cyan' | 'pink' | 'amber' | 'green' | 'purple'
export const NOTE_COLORS: NoteColor[] = [
  'cyan',
  'pink',
  'amber',
  'green',
  'purple',
]

export type Priority = 'high' | 'normal' | 'low' | 'idea' | 'system'

export interface SubTask {
  id: string
  title: string
  completed: boolean
}

export type ReminderSource = 'manual' | 'recurring' | 'ai'

export interface Reminder {
  source: ReminderSource
  triggers: number[]       // sorted ascending — upcoming fire timestamps
  // Recurring config (source === 'recurring')
  interval?: number        // ms between fires
  deadline?: number        // stop generating triggers after this timestamp; doubles as "due date"
  // AI placeholder (source === 'ai')
  aiConfig?: Record<string, unknown>
}

export interface Todo {
  id: string
  title: string
  description?: string
  completed: boolean
  createdAt: number // Date.now()
  attachments: Attachment[]
  position: { x: number; y: number }
  zIndex: number
  color: NoteColor
  rotation: number // degrees, -5 to +5
  priority: Priority
  subtasks: SubTask[]
  folderId: string | null
  reminder: Reminder | null
  archived: boolean
  stackedIds: string[] // IDs of todos stacked beneath this one (this is the root)
  stackName?: string   // display name for the stack (set when first stacked)
}

export interface Folder {
  id: string
  name: string
  color: NoteColor
  createdAt: number
  isOpen: boolean
  markerY: number // Y position of left-side marker on screen
  orderedTodoIds: string[] // ordered list of todo IDs in this folder
}
