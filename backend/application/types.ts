export type JsonRecord = Record<string, unknown>

export type TodoRecord = JsonRecord & {
  id: string
}

export type FolderRecord = JsonRecord & {
  id: string
}
