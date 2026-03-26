export interface Attachment {
  id: string
  type: 'image' | 'voice'
  url: string // base64 data URL
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

export type Priority = 'low' | 'normal' | 'high'

export interface SubTask {
  id: string
  title: string
  completed: boolean
}

export interface Reminder {
  remindAt: number // next trigger timestamp (ms)
  interval?: number // ms — if set, recurring; if absent, one-shot
}

export interface Todo {
  id: string
  title: string
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
