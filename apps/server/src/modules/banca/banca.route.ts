import { zValidator } from "@hono/zod-validator"
import { and, eq } from "drizzle-orm"
import { Hono } from "hono"
import { match } from "ts-pattern"
import { z } from "zod"
import { usuariosBancas } from "../../database/schema"
import { AppError } from "../../error"
import { type AppVariables } from "../../types"
import { checkRole } from "../auth/auth.middleware"
import * as schema from "./banca.schema"
import * as service from "./banca.service"

export const bancaRoutes = new Hono<{ Variables: AppVariables }>()
  .post("/", zValidator("json", schema.createBancaSchema), async (c) => {
    const validatedBancaData = c.req.valid("json")
    const result = await service.createBanca(c, validatedBancaData)

    if (!result.ok) {
      throw match(result.error)
        .with({ type: "database_error" }, () => new AppError(500, "Erro ao criar banca"))
        .with({ type: "curso_not_found" }, () => new AppError(404, "Curso não encontrado"))
        .with({ type: "invalid_input" }, () => new AppError(400, "Dados inválidos"))
        .exhaustive()
    }

    return c.json(result.data, 201)
  })
  .get("/", async (c) => {
    const orderBy = c.req.query("orderBy")
    const order = c.req.query("order") as "asc" | "desc" | undefined

    const result = await service.getAllBancasVisible(c, orderBy, order)

    if (!result.ok) {
      throw match(result.error)
        .with({ type: "database_error" }, () => new AppError(500, "Erro ao buscar bancas"))
        .exhaustive()
    }

    const bancas = result.data

    return c.json({
      past: bancas.filter((banca) => banca.dataRealizacao < new Date()),
      upcoming: bancas.filter((banca) => banca.dataRealizacao > new Date()),
    })
  })
  .get("/my-defenses", checkRole(["TEACHER", "ADMIN"]), async (c) => {
    const userId = c.get("jwtPayload")?.sub
    if (!userId) {
      throw new AppError(400, "ID do usuário não fornecido")
    }

    const orderBy = c.req.query("orderBy")
    const order = c.req.query("order") as "asc" | "desc" | undefined

    const result = await service.getBancasByOrientador(c, Number(userId), orderBy, order)

    if (!result.ok) {
      throw match(result.error)
        .with({ type: "database_error" }, () => new AppError(500, "Erro ao buscar minhas defesas"))
        .exhaustive()
    }

    const bancas = result.data

    return c.json({
      past: bancas.filter((banca) => banca.dataRealizacao < new Date()),
      upcoming: bancas.filter((banca) => banca.dataRealizacao > new Date()),
    })
  })
  .get("/:id", async (c) => {
    const id = Number(c.req.param("id"))
    const result = await service.getBancaById(c, id)

    if (!result.ok) {
      throw match(result.error)
        .with({ type: "database_error" }, () => new AppError(500, "Erro ao buscar banca"))
        .with({ type: "banca_not_found" }, () => new AppError(404, "Banca não encontrada"))
        .exhaustive()
    }

    return c.json(result.data)
  })
  .get("/usuario/:userId", async (c) => {
    const userId = Number(c.req.param("userId"))
    const result = await service.getBancasByUser(c, userId)

    if (!result.ok) {
      throw match(result.error)
        .with({ type: "database_error" }, () => new AppError(500, "Erro ao buscar bancas"))
        .with({ type: "user_not_found" }, () => new AppError(404, "Usuário não encontrado"))
        .exhaustive()
    }

    return c.json(result.data)
  })
  .delete(
    "/:id",
    checkRole(["ADMIN", "TEACHER"]),
    zValidator("param", z.object({ id: z.coerce.number() })),
    async (c) => {
      const { id } = c.req.valid("param")
      const result = await service.deleteBanca(c, id)
      if (!result.ok) {
        throw match(result.error)
          .with({ type: "banca_not_found" }, () => new AppError(404, "Banca não encontrada"))
          .with({ type: "unauthorized" }, () => new AppError(403, "Não autorizado"))
          .with({ type: "database_error" }, () => new AppError(500, "Erro ao deletar banca"))
          .exhaustive()
      }
      return c.body(null, 204)
    }
  )
  .patch(
    "/:id/toggle-visibility",
    checkRole(["ADMIN", "TEACHER"]),
    zValidator("param", z.object({ id: z.coerce.number() })),
    async (c) => {
      const { id } = c.req.valid("param")
      const result = await service.toggleBancaVisibility(c, id)
      if (!result.ok) {
        throw match(result.error)
          .with({ type: "banca_not_found" }, () => new AppError(404, "Banca não encontrada"))
          .with({ type: "unauthorized" }, () => new AppError(403, "Não autorizado"))
          .with({ type: "database_error" }, () => new AppError(500, "Erro ao alterar visibilidade"))
          .exhaustive()
      }
      return c.json(result.data)
    }
  )
  .get("/:bancaId/usuarios", async (c) => {
    const bancaId = Number(c.req.param("bancaId"))
    const result = await service.getUsersByBanca(c, bancaId)

    if (!result.ok) {
      throw match(result.error)
        .with({ type: "database_error" }, () => new AppError(500, "Erro ao buscar usuários"))
        .with({ type: "banca_not_found" }, () => new AppError(404, "Banca não encontrada"))
        .exhaustive()
    }

    return c.json(result.data)
  })
  .post("/usuario-banca/:inviteId/accept", async (c) => {
    const inviteId = Number(c.req.param("inviteId"))
    const result = await service.addUserToBanca(c, inviteId)

    if (!result.ok) {
      throw match(result.error)
        .with({ type: "database_error" }, () => new AppError(500, "Erro ao adicionar usuário"))
        .with({ type: "banca_not_found" }, () => new AppError(404, "Banca não encontrada"))
        .with({ type: "user_not_found" }, () => new AppError(404, "Usuário não encontrado"))
        .with({ type: "invite_not_found" }, () => new AppError(404, "Convite não encontrado"))
        .with({ type: "already_member" }, () => new AppError(400, "Usuário já é membro desta banca"))
        .exhaustive()
    }

    return c.json(result.data, 201)
  })
  .post(
    "/convites/email",
    zValidator(
      "json",
      z.object({
        bancaId: z.number(),
        email: z.string().email(),
        role: z.string(),
      })
    ),
    async (c) => {
      const { bancaId, email, role } = c.req.valid("json")
      const result = await service.sendInviteEmail(c, bancaId, email, role)

      if (!result.ok) {
        throw match(result.error)
          .with({ type: "database_error" }, () => new AppError(500, "Erro ao enviar convite"))
          .with({ type: "banca_not_found" }, () => new AppError(404, "Banca não encontrada"))
          .exhaustive()
      }

      return c.json(result.data, 201)
    }
  )
  .delete("/:bancaId/usuarios/:userId", async (c) => {
    const bancaId = Number(c.req.param("bancaId"))
    const userId = Number(c.req.param("userId"))
    const result = await service.removeUserFromBanca(c, bancaId, userId)

    if (!result.ok) {
      throw match(result.error)
        .with({ type: "database_error" }, () => new AppError(500, "Erro ao remover usuário"))
        .with({ type: "relation_not_found" }, () => new AppError(404, "Relação usuário-banca não encontrada"))
        .exhaustive()
    }

    return c.body(null, 204)
  })
  .get("/usuario-banca/relacao/banca/:bancaId/usuario/:userId", async (c) => {
    const bancaId = Number(c.req.param("bancaId"))
    const userId = Number(c.req.param("userId"))

    const dbInstance = c.get("db")
    try {
      const relation = await dbInstance
        .select({ id: usuariosBancas.id })
        .from(usuariosBancas)
        .where(and(eq(usuariosBancas.bancaId, bancaId), eq(usuariosBancas.usuarioId, userId)))
        .limit(1)

      if (relation.length === 0) {
        throw new AppError(404, "Relação não encontrada")
      }

      return c.json({ id: relation[0].id })
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError(500, "Erro ao buscar relação")
    }
  })
  .post(
    "/:bancaId/usuarios/:userId/nota",
    zValidator(
      "json",
      z.object({
        nota: z.string(),
      })
    ),
    async (c) => {
      const bancaId = Number(c.req.param("bancaId"))
      const userId = Number(c.req.param("userId"))
      const { nota } = c.req.valid("json")

      const result = await service.setEvaluatorGrade(c, bancaId, userId, nota)

      if (!result.ok) {
        throw match(result.error)
          .with({ type: "database_error" }, () => new AppError(500, "Erro ao atribuir nota"))
          .with({ type: "relation_not_found" }, () => new AppError(404, "Relação usuário-banca não encontrada"))
          .exhaustive()
      }

      return c.json(result.data)
    }
  )
  .post(
    "/:bancaId/notas",
    zValidator(
      "json",
      z.object({
        notaFinal: z.string(),
      })
    ),
    async (c) => {
      const bancaId = Number(c.req.param("bancaId"))
      const { notaFinal } = c.req.valid("json")

      const result = await service.setBancaGrade(c, bancaId, notaFinal)

      if (!result.ok) {
        throw match(result.error)
          .with({ type: "database_error" }, () => new AppError(500, "Erro ao atribuir nota final"))
          .with({ type: "banca_not_found" }, () => new AppError(404, "Banca não encontrada"))
          .exhaustive()
      }

      return c.json(result.data)
    }
  )
  .get("/:bancaId/nota", async (c) => {
    const bancaId = Number(c.req.param("bancaId"))
    const result = await service.getBancaById(c, bancaId)

    if (!result.ok) {
      throw match(result.error)
        .with({ type: "database_error" }, () => new AppError(500, "Erro ao buscar nota"))
        .with({ type: "banca_not_found" }, () => new AppError(404, "Banca não encontrada"))
        .exhaustive()
    }

    return c.json({ nota: result.data.notaFinal })
  })
  .get("/:bancaId/documentos", async (c) => {
    const bancaId = Number(c.req.param("bancaId"))
    const result = await service.getBancaDocuments(c, bancaId)

    if (!result.ok) {
      throw match(result.error)
        .with({ type: "database_error" }, () => new AppError(500, "Erro ao buscar documentos"))
        .with({ type: "banca_not_found" }, () => new AppError(404, "Banca não encontrada"))
        .exhaustive()
    }

    return c.json(result.data)
  })
  .post("/:bancaId/documentos", async (c) => {
    throw new AppError(501, "Não implementado: upload de documentos")
  })
  .get("/:bancaId/documentos/:docId", async (c) => {
    throw new AppError(501, "Não implementado: detalhes do documento")
  })
  .get("/:bancaId/documentos/:docId/view", async (c) => {
    throw new AppError(501, "Não implementado: visualização de documentos")
  })
  .delete("/:bancaId/documentos/:docId", async (c) => {
    throw new AppError(501, "Não implementado: exclusão de documentos")
  })
  .put("/:id", checkRole(["ADMIN", "TEACHER"]), zValidator("json", schema.updateBancaSchema), async (c) => {
    const id = Number(c.req.param("id"))
    const validatedBancaData = c.req.valid("json")
    const result = await service.updateBanca(c, id, validatedBancaData)

    if (!result.ok) {
      throw match(result.error)
        .with({ type: "database_error" }, () => new AppError(500, "Erro ao atualizar banca"))
        .with({ type: "banca_not_found" }, () => new AppError(404, "Banca não encontrada"))
        .with({ type: "invalid_input" }, () => new AppError(403, "Dados inválidos"))
        .exhaustive()
    }

    return c.json(result.data)
  })
