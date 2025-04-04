import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { match } from "ts-pattern"
import { z } from "zod"
import { AppError } from "../../error"
import { type AppVariables } from "../../types"

import { insertUserSchema } from "./auth.schema"
import {
  loginUserService,
  registerUserService,
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
      throw match(error)
        .with({ type: "database_error" }, () => new AppError(500, "Algo deu errado tente novamente mais tarde"))
        .with({ type: "inactive_user" }, () => new AppError(403, "Seu usuário está inativo."))
        .otherwise(() => new AppError(403, "Usuário ou senha inválidos."))
    }
    return c.json(loginData, 200)
  })
  .get("/invites/:hash", async (c) => {
    const hash = c.req.param("hash")
    if (!hash) {
      return c.json({ message: "Hash do convite é obrigatório." }, 400)
    }
    const [error, inviteDetails] = await verifyInviteHashService(c, hash)
    if (error) {
      throw match(error)
        .with({ type: "invite_not_found" }, () => new AppError(404, "Convite não encontrado."))
        .with({ type: "invite_not_pending" }, () => new AppError(410, "Convite não está mais pendente."))
        .otherwise(() => new AppError(500, "Erro interno ao verificar o convite."))
    }
    return c.json(inviteDetails, 200)
  })
  .post("/reset-password", zValidator("json", requestResetSchema), async (c) => {
    const { email } = c.req.valid("json")
    const [error] = await requestPasswordResetService(c, email)

    if (error) {
      throw match(error)
        .with({ type: "database_error" }, () => new AppError(500, "Erro interno ao solicitar redefinição de senha."))
        .otherwise(() => new AppError(500, "Erro interno ao solicitar redefinição de senha."))
    }

    return c.json({ message: "Se o email existir, um link de redefinição foi enviado." }, 200)
  })
  .get("/reset-password/:hash", async (c) => {
    const hash = c.req.param("hash")
    if (!hash) {
      return c.json({ message: "Hash de reset é obrigatório." }, 400)
    }
    const [error, result] = await verifyResetHashService(c, hash)
    if (error) {
      throw match(error)
        .with({ type: "token_expired" }, () => new AppError(400, "Token de redefinição expirado."))
        .with({ type: "token_invalid" }, () => new AppError(400, "Token de redefinição inválido."))
        .otherwise(() => new AppError(500, "Erro interno ao verificar o token de redefinição."))
    }
    return c.json(result, 200)
  })
  .post("/reset-password/reset", zValidator("json", resetPasswordSchema), async (c) => {
    const { hash, newPassword } = c.req.valid("json")
    const [error] = await resetPasswordService(c, hash, newPassword)
    if (error) {
      throw match(error)
        .with({ type: "update_error" }, () => new AppError(500, "Erro ao atualizar a senha."))
        .otherwise(() => new AppError(500, "Erro interno ao redefinir a senha."))
    }
    return c.json({ message: "Senha redefinida com sucesso." }, 200)
  })
  .post("/register", zValidator("json", insertUserSchema), async (c) => {
    const userData = c.req.valid("json")
    const [error, result] = await registerUserService(c, userData)

    if (error) {
      throw match(error)
        .with({ type: "duplicate_email" }, () => new AppError(409, "Este email já está em uso."))
        .with({ type: "duplicate_username" }, () => new AppError(409, "Este nome de usuário já está em uso."))
        .with(
          { type: "database_error" },
          () => new AppError(500, "Erro ao criar o usuário. Tente novamente mais tarde.")
        )
        .otherwise(() => new AppError(500, "Ocorreu um erro inesperado."))
    }

    return c.json({ userId: result.userId }, 201)
  })
