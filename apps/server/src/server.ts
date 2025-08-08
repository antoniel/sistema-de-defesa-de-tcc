import { serve } from "@hono/node-server"
import { createMiddleware } from "hono/factory"
import path from "path"
import { db, runDatabaseMigrations } from "./database"
import { app } from "./index"
import { type AppVariables } from "./types"
import { createEmailService } from "./services/email.service"

const TrueDeps = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  c.set("db", db)
  c.set("emailService", createEmailService())
  await next()
})

const MIGRATIONS_FOLDER = path.join(import.meta.dirname, "./database/drizzle/")
runDatabaseMigrations(db, MIGRATIONS_FOLDER)

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 9000
serve({ fetch: app(TrueDeps).fetch, port: PORT })
console.log(` ✅ Server starting on port ${process.env.PORT}...`)
