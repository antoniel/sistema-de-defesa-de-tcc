import { Hono, MiddlewareHandler } from "hono"
// import { basicAuth } from 'hono/basic-auth' // Removed example auth
// import { etag } from 'hono/etag' // Removed example etag
import { logger } from "hono/logger" // Added logger for visibility
import { poweredBy } from "hono/powered-by"
import { prettyJSON } from "hono/pretty-json"

// Import DB instance and type
import { db } from "./database" // Assuming index.ts inside ./database

// Import route modules
import { serve } from "@hono/node-server"
import { cors } from "hono/cors"
import { createMiddleware } from "hono/factory"
import { AppError } from "./error"
import { authRoutes } from "./modules/auth/auth.route"
import { bancaRoutes } from "./modules/banca/banca.route"
import { calendarRoutes } from "./modules/calendar/calendar.route"
import { cursoRoutes } from "./modules/curso/curso.route"
import { documentoRoutes } from "./modules/documento/documento.route"
import { usuarioRoutes } from "./modules/usuario/usuario.route"
import { AppVariables } from "./types"

const TrueDeps = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  c.set("db", db)
  await next()
})

export const app = (depsMiddleware: MiddlewareHandler<{ Variables: AppVariables }>) =>
  new Hono<{ Variables: AppVariables }>()
    .use(depsMiddleware)
    .use("*", poweredBy())
    .use("*", logger())
    .use("*", cors())
    .use("*", prettyJSON())
    .get("/", (c) => c.json({ message: "Server is running!" }))
    .route("/auth", authRoutes)
    .route("/banca", bancaRoutes)
    .route("/calendar", calendarRoutes)
    .route("/cursos", cursoRoutes)
    .route("/documentos", documentoRoutes)
    .route("/usuario", usuarioRoutes)
    .notFound((c) => {
      return c.json({ message: "Not Found", ok: false }, 404)
    })
    .onError((err, c) => {
      if (err instanceof AppError) {
        return c.json({ message: err.message }, err.status)
      }
      console.error(`Server Error: ${err}`)
      return c.json({ message: "Internal Server Error" }, 500)
    })

export type AppType = ReturnType<typeof app>

serve({ fetch: app(TrueDeps).fetch, port: 3000 })
console.log(" ✅ Server starting on port 3000...")
