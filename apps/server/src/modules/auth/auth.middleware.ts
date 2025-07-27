import type { Context } from "hono"
import { createMiddleware } from "hono/factory"
import { type SignatureKey } from "hono/utils/jwt/jws"
import { match } from "ts-pattern"
import { type UserRole } from "../../database"
import { AppError } from "../../error"
import { getUserById } from "../usuario/usuario.service"

import { verify } from "hono/jwt"
import type { AppVariables } from "../../types"
export const checkRole = (roles: UserRole[]) =>
  createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
    const userId = c.get("jwtPayload")?.sub
    if (!userId) {
      throw new AppError(401, "Usuário não autenticado")
    }
    const result = await getUserById(c, Number(userId))
    if (!result.ok) {
      throw match(result.error)
        .with({ type: "user_not_found" }, () => new AppError(404, "Usuário não encontrado"))
        .with({ type: "database_error" }, () => new AppError(500, "Erro ao buscar usuário"))
        .exhaustive()
    }
    if (!roles.includes(result.data.role as UserRole)) {
      throw new AppError(403, "Usuário não tem permissão para acessar esta rota")
    }
    return next()
  })

export const appJwt = (options: { secret: SignatureKey }) => {
  return createMiddleware(async (ctx, next) => {
    const credentials = ctx.req.raw.headers.get("Authorization")
    if (!credentials) {
      return await next()
    }
    const [, token] = credentials.split(/\s+/)
    if (!token) {
      return await next()
    }

    let payload
    try {
      payload = await verify(token, options.secret)
    } catch (e) {
      return await next()
    }
    if (!payload) {
      return await next()
    }

    ctx.set("jwtPayload", payload)
    await next()
  })
}

function unauthorizedResponse(opts: { ctx: Context; error: string; errDescription: string; statusText?: string }) {
  return new Response("Unauthorized", {
    status: 401,
    statusText: opts.statusText,
    headers: {
      "WWW-Authenticate": `Bearer realm="${opts.ctx.req.url}",error="${opts.error}",error_description="${opts.errDescription}"`,
    },
  })
}
