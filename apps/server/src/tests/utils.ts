import { drizzle, PgliteDatabase } from "drizzle-orm/pglite"
import { migrate } from "drizzle-orm/pglite/migrator"
import { createMiddleware } from "hono/factory"
import path, { dirname } from "path"
import { fileURLToPath } from "url"
import * as schema from "../database/schema"
import { type AppVariables } from "../types"

const runDatabaseMigrations = async (database: PgliteDatabase, migrationsFolder: string) => {}

export default runDatabaseMigrations

export const getFakeDb = async () => {
  const db = drizzle({
    schema: schema,
  })
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  const migrationsFolder = path.join(__dirname, "..", "database", "drizzle")
  await migrate(db, {
    migrationsFolder,
    migrationsTable: "migrations",
  })
  return db
}

export const fakeDeps = (db: Awaited<ReturnType<typeof getFakeDb>>) => {
  return createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
    c.set("db", db as any)
    await next()
  })
}
