import { migrate } from "drizzle-orm/node-postgres/migrator"
import type { db } from "."

const runDatabaseMigrations = async (database: typeof db, migrationsFolder: string) => {
  await migrate(database, {
    migrationsFolder,
    migrationsTable: "migrations",
  })
}

export default runDatabaseMigrations
