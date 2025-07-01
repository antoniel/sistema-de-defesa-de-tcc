import { Hono } from "hono"
import { match } from "ts-pattern"
import { AppError } from "../../error"
import { type AppVariables } from "../../types"
import * as service from "./curso.service"

export const cursoRoutes = new Hono<{ Variables: AppVariables }>().get("/", async (c) => {
  const result = await service.getAllCursos(c)
  if (!result.ok) {
    throw match(result.error)
      .with({ type: "database_error" }, () => new AppError(500, "Erro ao buscar cursos"))
      .exhaustive()
  }
  return c.json(result.data)
})
