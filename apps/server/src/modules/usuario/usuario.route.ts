import { validator } from "../../lib/validator"

import { Hono } from "hono"
import { match } from "ts-pattern"
import { AppError } from "../../error"
import { rateLimit } from "../../middleware/rate-limit"
import { type AppVariables } from "../../types"
import { checkRole, requireAuth } from "../auth/auth.middleware"
import * as schema from "./usuario.schema"
import * as service from "./usuario.service"

export const usuarioRoutes = new Hono<{ Variables: AppVariables }>()
  .get("/me", requireAuth, async (c) => {
    const result = await service.getUserById(c, Number(c.get("jwtPayload").sub))
    if (!result.ok) {
      throw match(result.error)
        .with({ type: "database_error" }, () => new AppError(500, "Erro ao buscar usuário"))
        .with({ type: "user_not_found" }, () => new AppError(404, "Usuário não encontrado"))
        .exhaustive()
    }
    return c.json(result.data)
  })
  .get("/all", checkRole(["ADMIN"]), async (c) => {
    const result = await service.getAllUsers(c)
    if (!result.ok) {
      throw match(result.error)
        .with({ type: "database_error" }, () => new AppError(500, "Erro ao buscar usuários"))
        .exhaustive()
    }
    return c.json(result.data)
  })
  .get("/teachers", requireAuth, async (c) => {
    const result = await service.getTeachers(c)
    if (!result.ok) {
      throw match(result.error)
        .with({ type: "database_error" }, () => new AppError(500, "Erro ao buscar professores"))
        .exhaustive()
    }
    return c.json(result.data)
  })
  .get("/students", requireAuth, async (c) => {
    const result = await service.getStudents(c)
    if (!result.ok) {
      throw match(result.error)
        .with({ type: "database_error" }, () => new AppError(500, "Erro ao buscar discentes"))
        .exhaustive()
    }
    return c.json(result.data)
  })
  .get("/students/available-for-banca", requireAuth, async (c) => {
    const result = await service.getStudentsAvailableForBanca(c)
    if (!result.ok) {
      throw match(result.error)
        .with({ type: "database_error" }, () => new AppError(500, "Erro ao buscar discentes"))
        .exhaustive()
    }
    return c.json(result.data)
  })
  .post("/", checkRole(["ADMIN", "TEACHER"]), validator("json", schema.createUserRequestSchema), async (c) => {
    const callerResult = await service.getUserById(c, Number(c.get("jwtPayload").sub))
    if (!callerResult.ok) {
      throw match(callerResult.error)
        .with({ type: "database_error" }, () => new AppError(500, "Erro ao buscar usuário"))
        .with({ type: "user_not_found" }, () => new AppError(404, "Usuário não encontrado"))
        .exhaustive()
    }

    const requestedUserData = c.req.valid("json")
    const isAdmin = callerResult.data.role === "ADMIN"

    // Somente ADMIN pode conceder o papel ADMIN (evita escalação TEACHER → ADMIN).
    if (!isAdmin && requestedUserData.role === "ADMIN") {
      throw new AppError(403, "Usuário não tem permissão para criar contas com este papel")
    }
    if (isAdmin && requestedUserData.role === undefined) {
      throw new AppError(400, "Papel é obrigatório")
    }

    const validatedUserData = {
      ...requestedUserData,
      role: requestedUserData.role ?? "TEACHER",
    }
    const result = await service.createUser(c, validatedUserData)
    if (!result.ok) {
      throw match(result.error)
        .with({ type: "database_error" }, () => new AppError(500, "Erro ao criar usuário"))
        .with({ type: "duplicate_email" }, () => new AppError(400, "Email já cadastrado"))
        .with({ type: "duplicate_username" }, () => new AppError(400, "Nome de usuário já cadastrado"))
        .with({ type: "hashing_error" }, () => new AppError(500, "Erro ao criar usuário"))
        .exhaustive()
    }
    return c.json(result.data, 201)
  })
  .get("/:id", requireAuth, validator("param", schema.idParamSchema.shape.param), async (c) => {
    const { id } = c.req.valid("param")
    const result = await service.getUserById(c, id)
    if (!result.ok) {
      throw match(result.error)
        .with({ type: "database_error" }, () => new AppError(500, "Erro ao buscar usuário"))
        .with({ type: "user_not_found" }, () => new AppError(404, "Usuário não encontrado"))
        .exhaustive()
    }
    return c.json(result.data)
  })
  .put("/me", validator("json", schema.updateUserSchema.shape.body.omit({ role: true })), async (c) => {
    const validatedUpdateData = c.req.valid("json")
    const result = await service.updateUser(c, Number(c.get("jwtPayload").sub), validatedUpdateData)
    if (!result.ok) {
      throw match(result.error)
        .with({ type: "database_error" }, () => new AppError(500, "Erro ao atualizar usuário"))
        .with({ type: "user_not_found" }, () => new AppError(404, "Usuário não encontrado"))
        .with({ type: "duplicate_username" }, () => new AppError(400, "Nome de usuário já cadastrado"))
        .exhaustive()
    }
    return c.json(result.data)
  })
  .post("/me/change-password", validator("json", schema.changePasswordSchema), async (c) => {
    const { currentPassword, newPassword } = c.req.valid("json")
    const userId = Number(c.get("jwtPayload").sub)

    const result = await service.changeUserPassword(c, userId, currentPassword, newPassword)
    if (!result.ok) {
      throw match(result.error)
        .with({ type: "user_not_found" }, () => new AppError(404, "Usuário não encontrado"))
        .with({ type: "invalid_current_password" }, () => new AppError(400, "Senha atual incorreta"))
        .with({ type: "hashing_error" }, () => new AppError(500, "Erro ao processar senha"))
        .with({ type: "database_error" }, () => new AppError(500, "Erro ao atualizar senha"))
        .exhaustive()
    }

    return c.json({ message: "Senha alterada com sucesso" })
  })
  .put(
    "/:id",
    checkRole(["ADMIN"]),
    validator("param", schema.updateUserSchema.shape.param),
    validator("json", schema.updateUserSchema.shape.body),
    async (c) => {
      const { id } = c.req.valid("param")
      const validatedUpdateData = c.req.valid("json")
      const result = await service.updateUser(c, id, validatedUpdateData)
      if (!result.ok) {
        throw match(result.error)
          .with({ type: "database_error" }, () => new AppError(500, "Erro ao atualizar usuário"))
          .with({ type: "user_not_found" }, () => new AppError(404, "Usuário não encontrado"))
          .with({ type: "duplicate_username" }, () => new AppError(400, "Nome de usuário já cadastrado"))
          .exhaustive()
      }
      return c.json(result.data)
    }
  )
  .delete(
    "/:id",
    checkRole(["ADMIN"]),
    validator("param", schema.idParamSchema.shape.param),
    validator("query", schema.deleteUserQuerySchema),
    async (c) => {
      const { id } = c.req.valid("param")
      const { cascade } = c.req.valid("query")
      const result = await service.deleteUser(c, id, cascade === "true")
      if (!result.ok) {
        throw match(result.error)
          .with({ type: "database_error" }, () => new AppError(500, "Erro ao deletar usuário"))
          .with({ type: "user_not_found" }, () => new AppError(404, "Usuário não encontrado"))
          .with({ type: "user_referenced_elsewhere" }, () => new AppError(400, "Usuário referenciado em outro lugar"))
          .exhaustive()
      }
      return c.body(null, 204)
    }
  )
  .get("/:id/bancas", validator("param", schema.idParamSchema.shape.param), async (c) => {
    const { id } = c.req.valid("param")
    const result = await service.getUserBancas(c, id)
    if (!result.ok) {
      throw match(result.error)
        .with({ type: "database_error" }, () => new AppError(500, "Erro ao buscar bancas"))
        .with({ type: "user_not_found" }, () => new AppError(404, "Usuário não encontrado"))
        .exhaustive()
    }
    return c.json(result.data)
  })
  .get("/:id/associations", checkRole(["ADMIN"]), validator("param", schema.idParamSchema.shape.param), async (c) => {
    const { id } = c.req.valid("param")
    const result = await service.getUserAssociations(c, id)
    if (!result.ok) {
      throw match(result.error)
        .with({ type: "database_error" }, () => new AppError(500, "Erro ao buscar associações"))
        .with({ type: "user_not_found" }, () => new AppError(404, "Usuário não encontrado"))
        .exhaustive()
    }
    return c.json(result.data)
  })
  .post("/request-password-reset", rateLimit({ name: "request-password-reset" }), validator("json", schema.requestPasswordResetSchema), async (c) => {
    const { email } = c.req.valid("json")
    const result = await service.requestPasswordReset(c, email)
    if (!result.ok) {
      throw match(result.error)
        .with({ type: "database_error" }, () => new AppError(500, "Erro interno do servidor"))
        .exhaustive()
    }
    return c.json({ message: "Se o email existir, um link de redefinição foi enviado." })
  })
  .post("/reset-password", validator("json", schema.resetPasswordSchema), async (c) => {
    const { token, newPassword } = c.req.valid("json")
    const result = await service.resetPassword(c, token, newPassword)
    if (!result.ok) {
      throw match(result.error)
        .with({ type: "invalid_token" }, () => new AppError(400, "Token inválido"))
        .with({ type: "token_expired" }, () => new AppError(400, "Token expirado"))
        .with({ type: "user_not_found" }, () => new AppError(400, "Token inválido"))
        .with({ type: "hashing_error" }, () => new AppError(500, "Erro ao processar senha"))
        .with({ type: "database_error" }, () => new AppError(500, "Erro interno do servidor"))
        .exhaustive()
    }
    return c.json({ message: "Senha redefinida com sucesso" })
  })
