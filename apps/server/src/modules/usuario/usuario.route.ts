import { zValidator } from "@hono/zod-validator"

import { Hono } from "hono"
import { match } from "ts-pattern"
import { AppError } from "../../error"
import { type AppVariables } from "../../types"
import { checkRole } from "../auth/auth.middleware"
import * as schema from "./usuario.schema"
import * as service from "./usuario.service"

export const usuarioRoutes = new Hono<{ Variables: AppVariables }>()
  .get("/me", async (c) => {
    const [error, user] = await service.getUserById(c, Number(c.get("jwtPayload").sub))
    if (error) {
      throw match(error)
        .with({ type: "database_error" }, () => new AppError(500, "Erro ao buscar usuário"))
        .with({ type: "user_not_found" }, () => new AppError(404, "Usuário não encontrado"))
        .exhaustive()
    }
    return c.json(user)
  })
  .get("/", checkRole(["ADMIN"]), async (c) => {
    const [error, users] = await service.getAllUsers(c)
    if (error) {
      throw match(error)
        .with({ type: "database_error" }, () => new AppError(500, "Erro ao buscar usuários"))
        .exhaustive()
    }
    return c.json(users)
  })
  .post("/", checkRole(["ADMIN", "TEACHER"]), zValidator("json", schema.createUserSchema), async (c) => {
    const validatedUserData = c.req.valid("json")
    const [error, newUser] = await service.createUser(c, validatedUserData)
    if (error) {
      throw match(error)
        .with({ type: "database_error" }, () => new AppError(500, "Erro ao criar usuário"))
        .with({ type: "duplicate_email" }, () => new AppError(400, "Email já cadastrado"))
        .with({ type: "duplicate_username" }, () => new AppError(400, "Nome de usuário já cadastrado"))
        .with({ type: "hashing_error" }, () => new AppError(500, "Erro ao criar usuário"))
        .exhaustive()
    }
    return c.json(newUser, 201)
  })
  .get("/:id", zValidator("param", schema.idParamSchema.shape.param), async (c) => {
    const { id } = c.req.valid("param")
    const [error, user] = await service.getUserById(c, id)
    if (error) {
      throw match(error)
        .with({ type: "database_error" }, () => new AppError(500, "Erro ao buscar usuário"))
        .with({ type: "user_not_found" }, () => new AppError(404, "Usuário não encontrado"))
        .exhaustive()
    }
    return c.json(user)
  })
  .put(
    "/:id",
    checkRole(["ADMIN"]),
    zValidator("param", schema.updateUserSchema.shape.param),
    zValidator("json", schema.updateUserSchema.shape.body),
    async (c) => {
      const { id } = c.req.valid("param")
      const validatedUpdateData = c.req.valid("json")
      const [error, updatedUser] = await service.updateUser(c, id, validatedUpdateData)
      if (error) {
        throw match(error)
          .with({ type: "database_error" }, () => new AppError(500, "Erro ao atualizar usuário"))
          .with({ type: "user_not_found" }, () => new AppError(404, "Usuário não encontrado"))
          .with({ type: "duplicate_username" }, () => new AppError(400, "Nome de usuário já cadastrado"))
          .exhaustive()
      }
      return c.json(updatedUser)
    }
  )
  .delete("/:id", checkRole(["ADMIN"]), zValidator("param", schema.idParamSchema.shape.param), async (c) => {
    const { id } = c.req.valid("param")
    const [error] = await service.deleteUser(c, id)
    if (error) {
      throw match(error)
        .with({ type: "database_error" }, () => new AppError(500, "Erro ao deletar usuário"))
        .with({ type: "user_not_found" }, () => new AppError(404, "Usuário não encontrado"))
        .with({ type: "user_referenced_elsewhere" }, () => new AppError(400, "Usuário referenciado em outro lugar"))
        .exhaustive()
    }
    return c.body(null, 204)
  })
  .get("/:id/bancas", zValidator("param", schema.idParamSchema.shape.param), async (c) => {
    const { id } = c.req.valid("param")
    const [error, bancas] = await service.getUserBancas(c, id)
    if (error) {
      throw match(error)
        .with({ type: "database_error" }, () => new AppError(500, "Erro ao buscar bancas"))
        .with({ type: "user_not_found" }, () => new AppError(404, "Usuário não encontrado"))
        .exhaustive()
    }
    return c.json(bancas)
  })
