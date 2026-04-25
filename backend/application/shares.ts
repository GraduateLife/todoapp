import { eq, lt, and, isNotNull } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { sharesTable } from '../adapters/db/schema.js'
import type { AppDb } from './db.js'

export interface CreateShareInput {
  todoId: string
  title: string
  format: 'html' | 'md'
  content: string
  ttlMs?: number // if set, share expires after this many ms
}

export interface ShareRecord {
  id: string
  todoId: string
  title: string
  format: 'html' | 'md'
  content: string
  createdAt: number
  expiresAt: number | null
}

export class ShareAlreadyExistsError extends Error {
  constructor(readonly existing: ShareRecord) {
    super(`todo ${existing.todoId} already has an active share`)
    this.name = 'ShareAlreadyExistsError'
  }
}

const SLUG_LENGTH = 8

export async function createShare(
  db: AppDb,
  input: CreateShareInput,
): Promise<ShareRecord> {
  const now = Date.now()
  const existing = await getShareByTodoId(db, input.todoId)

  if (existing) {
    throw new ShareAlreadyExistsError(existing)
  }

  const record: ShareRecord = {
    id: nanoid(SLUG_LENGTH),
    todoId: input.todoId,
    title: input.title,
    format: input.format,
    content: input.content,
    createdAt: now,
    expiresAt: input.ttlMs ? now + input.ttlMs : null,
  }

  try {
    await db.insert(sharesTable).values({
      id: record.id,
      todoId: record.todoId,
      title: record.title,
      format: record.format,
      content: record.content,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
    })
  } catch (error) {
    if (isTodoShareUniqueViolation(error)) {
      const concurrent = await getShareByTodoId(db, input.todoId)
      if (concurrent) {
        throw new ShareAlreadyExistsError(concurrent)
      }
    }

    throw error
  }

  return record
}

function isTodoShareUniqueViolation(error: unknown): boolean {
  if (!(error instanceof Error)) return false

  const message = error.message.toLowerCase()
  return (
    message.includes('unique') &&
    (message.includes('shares.todo_id') ||
      message.includes('shares_todo_id_unique') ||
      message.includes('todo_id'))
  )
}

export async function getShare(
  db: AppDb,
  id: string,
): Promise<ShareRecord | null> {
  const rows = await db
    .select()
    .from(sharesTable)
    .where(eq(sharesTable.id, id))
    .limit(1)

  if (rows.length === 0) return null

  const row = rows[0]

  // Check expiry
  if (row.expiresAt && row.expiresAt < Date.now()) {
    // Expired — clean up and return null
    await db.delete(sharesTable).where(eq(sharesTable.id, id))
    return null
  }

  return {
    id: row.id,
    todoId: row.todoId,
    title: row.title,
    format: row.format as 'html' | 'md',
    content: row.content,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
  }
}

export async function getShareByTodoId(
  db: AppDb,
  todoId: string,
): Promise<ShareRecord | null> {
  const rows = await db
    .select()
    .from(sharesTable)
    .where(eq(sharesTable.todoId, todoId))
    .limit(1)

  if (rows.length === 0) return null

  return normalizeShareRow(db, rows[0])
}

export async function deleteShare(db: AppDb, id: string): Promise<void> {
  await db.delete(sharesTable).where(eq(sharesTable.id, id))
}

/** Remove all expired shares. Call on startup or periodically. */
export async function purgeExpired(db: AppDb): Promise<number> {
  const result = (await db
    .delete(sharesTable)
    .where(
      and(isNotNull(sharesTable.expiresAt), lt(sharesTable.expiresAt, Date.now())),
    )) as { changes?: number } | undefined

  return result?.changes ?? 0
}

async function normalizeShareRow(
  db: AppDb,
  row: typeof sharesTable.$inferSelect,
): Promise<ShareRecord | null> {
  if (row.expiresAt && row.expiresAt < Date.now()) {
    await db.delete(sharesTable).where(eq(sharesTable.id, row.id))
    return null
  }

  return {
    id: row.id,
    todoId: row.todoId,
    title: row.title,
    format: row.format as 'html' | 'md',
    content: row.content,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
  }
}
