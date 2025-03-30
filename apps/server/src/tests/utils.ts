import { drizzle, PgliteDatabase } from "drizzle-orm/pglite"
import { migrate } from "drizzle-orm/pglite/migrator"
import { createMiddleware } from "hono/factory"
import path from "path"
import * as schema from "../database/schema"
import { AppVariables } from "../types"

const runDatabaseMigrations = async (database: PgliteDatabase, migrationsFolder: string) => {}

export default runDatabaseMigrations

export const getFakeDb = async () => {
  const db = drizzle({
    schema: schema,
  })
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
