import { eq } from 'drizzle-orm'
import { foldersTable } from '../adapters/node/db/schema.js'
import type { AppDb } from './db.js'
import type { FolderRecord } from './types.js'

export async function listFolders(db: AppDb): Promise<FolderRecord[]> {
  const rows = await db.select().from(foldersTable)
  return rows.map((row) => JSON.parse(row.data) as FolderRecord)
}

export async function saveFolder(db: AppDb, folder: FolderRecord): Promise<void> {
  await db
    .insert(foldersTable)
    .values({
      id: folder.id,
      data: JSON.stringify(folder),
    })
    .onConflictDoUpdate({
      target: foldersTable.id,
      set: { data: JSON.stringify(folder) },
    })
}

export async function deleteFolder(db: AppDb, id: string): Promise<void> {
  await db.delete(foldersTable).where(eq(foldersTable.id, id))
}
