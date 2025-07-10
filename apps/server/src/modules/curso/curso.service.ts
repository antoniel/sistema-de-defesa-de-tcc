import { type Context } from "hono"
import { Cursos } from "../../database/schema"
import { type AppResult, err, ok } from "../../result"
import { type AppVariables } from "../../types"

type GetAllCursosError = { type: "database_error"; error: unknown }

export const getAllCursos = async (
  c: Context<{ Variables: AppVariables }>
): Promise<AppResult<(typeof Cursos.$inferSelect)[], GetAllCursosError>> => {
  const dbInstance = c.get("db")
  try {
    const result = await dbInstance.select().from(Cursos).orderBy(Cursos.nome)
    return ok(result)
  } catch (error) {
    console.error("Error fetching all cursos:", error)
    return err({ type: "database_error", error })
  }
}
