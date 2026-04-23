import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import type * as schema from '../adapters/db/schema.js'

export type AppDb = BaseSQLiteDatabase<'sync' | 'async', unknown, typeof schema>
