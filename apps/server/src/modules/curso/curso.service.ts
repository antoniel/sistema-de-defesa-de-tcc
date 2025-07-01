import { type Context } from "hono"
import { cursos } from "../../database/schema"
import { type AppResult, err, ok } from "../../result"
import { type AppVariables } from "../../types"

type GetAllCursosError = { type: "database_error"; error: unknown }

export const getAllCursos = async (
  c: Context<{ Variables: AppVariables }>
): Promise<AppResult<(typeof cursos.$inferSelect)[], GetAllCursosError>> => {
  const dbInstance = c.get("db")
  try {
    const result = await dbInstance.select().from(cursos).orderBy(cursos.nome)
    return ok(result)
  } catch (error) {
    console.error("Error fetching all cursos:", error)
    return err({ type: "database_error", error })
  }
}
