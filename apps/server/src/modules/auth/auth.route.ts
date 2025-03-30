import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { StatusCode } from "hono/utils/http-status"
import { match } from "ts-pattern"
import { z } from "zod"
import { AppError } from "../../error"
import { AppVariables } from "../../types"

import {
  loginUserService,
  requestPasswordResetService,
  resetPasswordService,
  verifyInviteHashService,
  verifyResetHashService,
} from "./auth.service"

const loginSchema = z.object({
  email: z.string().email({ message: "Email inválido." }),
  password: z.string().min(1, { message: "Senha é obrigatória." }),
})

const requestResetSchema = z.object({
  email: z.string().email({ message: "Email inválido." }),
})

const resetPasswordSchema = z.object({
  hash: z.string().min(1, { message: "Token de reset é obrigatório." }),
  newPassword: z.string().min(6, { message: "Nova senha deve ter pelo menos 6 caracteres." }),
})

export const authRoutes = new Hono<{ Variables: AppVariables }>()
  .post("/login", zValidator("json", loginSchema), async (c) => {
    const { email, password } = c.req.valid("json")
    const [error, loginData] = await loginUserService(c, email, password)
    if (error) {
      console.error("Login route error:", error.type)
      throw match(error)
        .with({ type: "database_error" }, () => new AppError(500, "Algo deu errado tente novamente mais tarde"))
        .with({ type: "inactive_user" }, () => new AppError(403, "Seu usuário está inativo."))
        .otherwise(() => new AppError(403, "Usuário ou senha inválidos."))
    }
    c.status(200)
    return c.json(loginData)
  })
  .get("/invites/:hash", async (c) => {
    const hash = c.req.param("hash")
    if (!hash) {
      return c.json({ message: "Hash do convite é obrigatório." }, 400)
    }
    const [error, inviteDetails] = await verifyInviteHashService(c, hash)
    if (error) {
      console.error("Verify invite route error:", error.message)
      c.status(error.status as StatusCode)
      return c.json({ message: error.message })
    }
    c.status(200)
    return c.json(inviteDetails)
  })
  .post("/reset-password", zValidator("json", requestResetSchema), async (c) => {
    const { email } = c.req.valid("json")
    const [error] = await requestPasswordResetService(c, email)

    if (error) {
      console.error("Internal error during request reset (though user sees success):", error.message)
    }

    c.status(200)
    return c.json({ message: "Se o email existir, um link de redefinição foi enviado." })
  })
  .get("/reset-password/:hash", async (c) => {
    const hash = c.req.param("hash")
    if (!hash) {
      return c.json({ message: "Hash de reset é obrigatório." }, 400)
    }
    const [error, result] = await verifyResetHashService(c, hash)
    if (error) {
      console.error("Verify reset hash route error:", error.message)
      c.status(error.status as StatusCode)
      return c.json({ message: error.message })
    }
    c.status(200)
    return c.json(result)
  })
  .post("/reset-password/reset", zValidator("json", resetPasswordSchema), async (c) => {
    const { hash, newPassword } = c.req.valid("json")
    const [error] = await resetPasswordService(c, hash, newPassword)
    if (error) {
      console.error("Reset password route error:", error.message)
      c.status(error.status as StatusCode)
      return c.json({ message: error.message })
    }
    c.status(200)
    return c.json({ message: "Senha redefinida com sucesso." })
  })
