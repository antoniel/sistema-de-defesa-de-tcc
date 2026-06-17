import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { match } from "ts-pattern"
import { AppError } from "../../error"
import { type AppVariables } from "../../types"
import { checkRole } from "../auth/auth.middleware"
import { createCursoSchema, cursoIdParamSchema, updateCursoSchema } from "./curso.schema"
import * as service from "./curso.service"

export const cursoRoutes = new Hono<{ Variables: AppVariables }>()
  .get("/", async (c) => {
    const result = await service.getAllCursos(c)
    if (!result.ok) {
      throw match(result.error)
        .with({ type: "database_error" }, () => new AppError(500, "Erro ao buscar cursos"))
        .exhaustive()
    }
    return c.json(result.data)
  })
  .post("/", checkRole(["ADMIN"]), zValidator("json", createCursoSchema), async (c) => {
    const body = c.req.valid("json")
    const result = await service.createCurso(c, body)

    if (!result.ok) {
      throw match(result.error)
        .with({ type: "duplicate_sigla" }, () => new AppError(400, "Já existe um curso com esta sigla"))
        .with({ type: "coordenador_not_found" }, () => new AppError(404, "Coordenador não encontrado"))
        .with({ type: "database_error" }, () => new AppError(500, "Erro ao criar curso"))
        .exhaustive()
    }

    return c.json(result.data, 201)
  })
  .patch(
    "/:id",
    checkRole(["ADMIN"]),
    zValidator("param", cursoIdParamSchema),
    zValidator("json", updateCursoSchema),
    async (c) => {
      const { id } = c.req.valid("param")
      const body = c.req.valid("json")

      const result = await service.updateCurso(c, id, body)

      if (!result.ok) {
        throw match(result.error)
          .with({ type: "curso_not_found" }, () => new AppError(404, "Curso não encontrado"))
          .with({ type: "duplicate_sigla" }, () => new AppError(400, "Já existe um curso com esta sigla"))
          .with({ type: "coordenador_not_found" }, () => new AppError(404, "Coordenador não encontrado"))
          .with({ type: "database_error" }, () => new AppError(500, "Erro ao atualizar curso"))
          .exhaustive()
      }

      return c.json(result.data)
    }
  )
  .delete(
    "/:id",
    checkRole(["ADMIN"]),
    zValidator("param", cursoIdParamSchema),
    async (c) => {
      const { id } = c.req.valid("param")
      const result = await service.deleteCurso(c, id)

      if (!result.ok) {
        throw match(result.error)
          .with({ type: "curso_not_found" }, () => new AppError(404, "Curso não encontrado"))
          .with({ type: "curso_in_use" }, () =>
            new AppError(400, "Não é possível excluir um curso com defesas cadastradas")
          )
          .with({ type: "database_error" }, () => new AppError(500, "Erro ao excluir curso"))
          .exhaustive()
      }

      return c.body(null, 204)
    }
  )
