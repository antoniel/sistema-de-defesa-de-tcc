import { Hono, type MiddlewareHandler } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { prettyJSON } from "hono/pretty-json"
import { AppError } from "./error"
import { appJwt } from "./modules/auth/auth.middleware"
import { authRoutes } from "./modules/auth/auth.route"
import { JWT_SECRET } from "./modules/auth/jwt"
import { bancaRoutes } from "./modules/banca/banca.route"
import { calendarRoutes } from "./modules/calendar/calendar.route"
import { cursoRoutes } from "./modules/curso/curso.route"
import { documentoRoutes } from "./modules/documento/documento.route"
import { feedbackRoutes } from "./modules/feedback/feedback.route"
import { featureRequestRoutes } from "./modules/feature-request/feature-request.route"
import { usuarioRoutes } from "./modules/usuario/usuario.route"
import studentInvitationRoutes from "./modules/student-invitation/student-invitation.route"
import teacherInvitationRoutes from "./modules/teacher-invitation/teacher-invitation.route"
import { type AppVariables } from "./types"

export const app = (depsMiddleware: MiddlewareHandler<{ Variables: AppVariables }>) =>
  new Hono<{ Variables: AppVariables }>()
    .use(depsMiddleware)
    .use("*", logger())
    .use("*", cors())
    // Anti-fingerprinting: JSON identado é assinatura de dev-config em produção.
    .use("*", process.env.NODE_ENV === "production" ? (_c, next) => next() : prettyJSON())
    .use("*", appJwt({ secret: JWT_SECRET }))
    .route("/auth", authRoutes)
    .route("/banca", bancaRoutes)
    .route("/calendar", calendarRoutes)
    .route("/cursos", cursoRoutes)
    .route("/documentos", documentoRoutes)
    .route("/feedback", feedbackRoutes)
    .route("/feature-request", featureRequestRoutes)
    .route("/usuario", usuarioRoutes)
    .route("/teacher-invitation", teacherInvitationRoutes)
    .route("/student-invitation", studentInvitationRoutes)
    .notFound((c) => {
      // Anti-fingerprinting: 404 sem corpo (shape de erro característico entrega o framework).
      return c.body(null, 404)
    })
    .onError((err, c) => {
      if (err instanceof AppError) {
        return c.json({ message: err.message }, err.status)
      }
      console.error(`Server Error: ${err}`)
      return c.json({ message: "Internal Server Error" }, 500)
    })

export type AppType = ReturnType<typeof app>
