export interface Attachment {
  id: string
  type: 'image' | 'voice'
  url: string // base64 data URL
  name: string
}

export interface Todo {
  id: string // crypto.randomUUID()
  title: string
  completed: boolean
  createdAt: number // Date.now()
  attachments: Attachment[]
}
