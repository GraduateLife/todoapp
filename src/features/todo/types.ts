export interface Attachment {
  id: string
  type: 'image' | 'voice'
  url: string // base64 data URL
  name: string
}

export type NoteColor = 'cyan' | 'pink' | 'amber' | 'green' | 'purple'

export const NOTE_COLORS: NoteColor[] = ['cyan', 'pink', 'amber', 'green', 'purple']

export interface Todo {
  id: string // crypto.randomUUID()
  title: string
  completed: boolean
  createdAt: number // Date.now()
  attachments: Attachment[]
  position: { x: number; y: number }
  zIndex: number
  color: NoteColor
  rotation: number // degrees, -6 to +6
}
