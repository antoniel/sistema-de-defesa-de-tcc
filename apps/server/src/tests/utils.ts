import { drizzle, PgliteDatabase } from "drizzle-orm/pglite"
import { migrate } from "drizzle-orm/pglite/migrator"
import { createMiddleware } from "hono/factory"
import path from "path"
import * as schema from "../database/schema"
import { type AppVariables } from "../types"

export const getFakeDb = async () => {
  const db = drizzle({
    schema: schema,
  })
  const migrationsFolder = path.join(process.cwd(), "src", "database", "drizzle")
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
