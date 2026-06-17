import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { match } from "ts-pattern"
import { AppError } from "../../error"
import { type AppVariables } from "../../types"
import { checkRole } from "../auth/auth.middleware"
import { cursoIdParamSchema, updateCursoCoordenadorSchema } from "./curso.schema"
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
  .patch(
    "/:id",
    checkRole(["ADMIN"]),
    zValidator("param", cursoIdParamSchema),
    zValidator("json", updateCursoCoordenadorSchema),
    async (c) => {
      const { id } = c.req.valid("param")
      const body = c.req.valid("json")

      const result = await service.updateCursoCoordenador(c, id, body)

      if (!result.ok) {
        throw match(result.error)
          .with({ type: "curso_not_found" }, () => new AppError(404, "Curso não encontrado"))
          .with({ type: "database_error" }, () => new AppError(500, "Erro ao atualizar coordenador do curso"))
          .exhaustive()
      }

      return c.json(result.data)
    }
  )
