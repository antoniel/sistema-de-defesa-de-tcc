import { zValidator } from "@hono/zod-validator"
import { and, eq } from "drizzle-orm"
import { Hono } from "hono"
import { match } from "ts-pattern"
import { z } from "zod"
import { usuariosBancas } from "../../database/schema"
import { AppError } from "../../error"
import { AppVariables } from "../../types"
import * as schema from "./banca.schema"
import * as service from "./banca.service"

export const bancaRoutes = new Hono<{ Variables: AppVariables }>()
  .post("/", zValidator("json", schema.createBancaSchema), async (c) => {
    const validatedBancaData = c.req.valid("json")
    const [error, newBanca] = await service.createBanca(c, validatedBancaData)

    if (error) {
      throw match(error)
        .with({ type: "database_error" }, () => new AppError(500, "Erro ao criar banca"))
        .with({ type: "curso_not_found" }, () => new AppError(404, "Curso não encontrado"))
        .with({ type: "invalid_input" }, () => new AppError(400, "Dados inválidos"))
        .exhaustive()
    }

    return c.json(newBanca, 201)
  })
  .get("/", async (c) => {
    const [error, bancas] = await service.getAllBancas(c)

    if (error) {
      throw match(error)
        .with({ type: "database_error" }, () => new AppError(500, "Erro ao buscar bancas"))
        .exhaustive()
    }

    return c.json(bancas)
  })
  .get("/:id", async (c) => {
    const id = Number(c.req.param("id"))
    const [error, banca] = await service.getBancaById(c, id)

    if (error) {
      throw match(error)
        .with({ type: "database_error" }, () => new AppError(500, "Erro ao buscar banca"))
        .with({ type: "banca_not_found" }, () => new AppError(404, "Banca não encontrada"))
        .exhaustive()
    }

    return c.json(banca)
  })
  .get("/usuario/:userId", async (c) => {
    const userId = Number(c.req.param("userId"))
    const [error, bancas] = await service.getBancasByUser(c, userId)

    if (error) {
      throw match(error)
        .with({ type: "database_error" }, () => new AppError(500, "Erro ao buscar bancas"))
        .with({ type: "user_not_found" }, () => new AppError(404, "Usuário não encontrado"))
        .exhaustive()
    }

    return c.json(bancas)
  })
  .delete("/:id", async (c) => {
    const id = Number(c.req.param("id"))
    const [error] = await service.deleteBanca(c, id)

    if (error) {
      throw match(error)
        .with({ type: "database_error" }, () => new AppError(500, "Erro ao excluir banca"))
        .with({ type: "banca_not_found" }, () => new AppError(404, "Banca não encontrada"))
        .with({ type: "unauthorized" }, () => new AppError(403, "Não autorizado a excluir esta banca"))
        .exhaustive()
    }

    return c.body(null, 204)
  })
  .put("/:id/visibilidade", async (c) => {
    const id = Number(c.req.param("id"))
    const [error, banca] = await service.toggleBancaVisibility(c, id)

    if (error) {
      throw match(error)
        .with({ type: "database_error" }, () => new AppError(500, "Erro ao atualizar visibilidade"))
        .with({ type: "banca_not_found" }, () => new AppError(404, "Banca não encontrada"))
        .exhaustive()
    }

    return c.json(banca)
  })
  .get("/:bancaId/usuarios", async (c) => {
    const bancaId = Number(c.req.param("bancaId"))
    const [error, usuarios] = await service.getUsersByBanca(c, bancaId)

    if (error) {
      throw match(error)
        .with({ type: "database_error" }, () => new AppError(500, "Erro ao buscar usuários"))
        .with({ type: "banca_not_found" }, () => new AppError(404, "Banca não encontrada"))
        .exhaustive()
    }

    return c.json(usuarios)
  })
  .post("/usuario-banca/:inviteId/accept", async (c) => {
    const inviteId = Number(c.req.param("inviteId"))
    const [error, usuarioBanca] = await service.addUserToBanca(c, inviteId)

    if (error) {
      throw match(error)
        .with({ type: "database_error" }, () => new AppError(500, "Erro ao adicionar usuário"))
        .with({ type: "banca_not_found" }, () => new AppError(404, "Banca não encontrada"))
        .with({ type: "user_not_found" }, () => new AppError(404, "Usuário não encontrado"))
        .with({ type: "invite_not_found" }, () => new AppError(404, "Convite não encontrado"))
        .with({ type: "already_member" }, () => new AppError(400, "Usuário já é membro desta banca"))
        .exhaustive()
    }

    return c.json(usuarioBanca, 201)
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
      const [error, invite] = await service.sendInviteEmail(c, bancaId, email, role)

      if (error) {
        throw match(error)
          .with({ type: "database_error" }, () => new AppError(500, "Erro ao enviar convite"))
          .with({ type: "banca_not_found" }, () => new AppError(404, "Banca não encontrada"))
          .exhaustive()
      }

      return c.json(invite, 201)
    }
  )
  .delete("/:bancaId/usuarios/:userId", async (c) => {
    const bancaId = Number(c.req.param("bancaId"))
    const userId = Number(c.req.param("userId"))
    const [error] = await service.removeUserFromBanca(c, bancaId, userId)

    if (error) {
      throw match(error)
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

      const [error, usuarioBanca] = await service.setEvaluatorGrade(c, bancaId, userId, nota)

      if (error) {
        throw match(error)
          .with({ type: "database_error" }, () => new AppError(500, "Erro ao atribuir nota"))
          .with({ type: "relation_not_found" }, () => new AppError(404, "Relação usuário-banca não encontrada"))
          .exhaustive()
      }

      return c.json(usuarioBanca)
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

      const [error, banca] = await service.setBancaGrade(c, bancaId, notaFinal)

      if (error) {
        throw match(error)
          .with({ type: "database_error" }, () => new AppError(500, "Erro ao atribuir nota final"))
          .with({ type: "banca_not_found" }, () => new AppError(404, "Banca não encontrada"))
          .exhaustive()
      }

      return c.json(banca)
    }
  )
  .get("/:bancaId/nota", async (c) => {
    const bancaId = Number(c.req.param("bancaId"))
    const [error, banca] = await service.getBancaById(c, bancaId)

    if (error) {
      throw match(error)
        .with({ type: "database_error" }, () => new AppError(500, "Erro ao buscar nota"))
        .with({ type: "banca_not_found" }, () => new AppError(404, "Banca não encontrada"))
        .exhaustive()
    }

    return c.json({ nota: banca.notaFinal })
  })
  .get("/:bancaId/documentos", async (c) => {
    const bancaId = Number(c.req.param("bancaId"))
    const [error, documentos] = await service.getBancaDocuments(c, bancaId)

    if (error) {
      throw match(error)
        .with({ type: "database_error" }, () => new AppError(500, "Erro ao buscar documentos"))
        .with({ type: "banca_not_found" }, () => new AppError(404, "Banca não encontrada"))
        .exhaustive()
    }

    return c.json(documentos)
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
