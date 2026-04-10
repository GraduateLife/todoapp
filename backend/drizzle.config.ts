import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './adapters/node/db/schema.ts',
  out: './migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DB_PATH ?? './db.sqlite',
  },
})
