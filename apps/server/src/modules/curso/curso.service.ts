import { eq } from "drizzle-orm"
import { type Context } from "hono"
import { Cursos, type SelectCurso } from "../../database/schema"
import { type AppResult, err, ok } from "../../result"
import { type AppVariables } from "../../types"
import { type UpdateCursoCoordenadorInput } from "./curso.schema"

type GetAllCursosError = { type: "database_error"; error: unknown }

type UpdateCursoCoordenadorError =
  | { type: "curso_not_found" }
  | { type: "database_error"; error: unknown }

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

export const updateCursoCoordenador = async (
  c: Context<{ Variables: AppVariables }>,
  id: number,
  data: UpdateCursoCoordenadorInput
): Promise<AppResult<SelectCurso, UpdateCursoCoordenadorError>> => {
  const dbInstance = c.get("db")

  try {
    const cursoCheck = await dbInstance.select({ id: Cursos.id }).from(Cursos).where(eq(Cursos.id, id)).limit(1)
    if (cursoCheck.length === 0) {
      return err({ type: "curso_not_found" })
    }

    const [updatedCurso] = await dbInstance
      .update(Cursos)
      .set({ nomeCoordenador: data.nomeCoordenador })
      .where(eq(Cursos.id, id))
      .returning()

    if (!updatedCurso) {
      console.error(`Update failed unexpectedly for curso ID ${id} after existence check.`)
      return err({ type: "curso_not_found" })
    }

    return ok(updatedCurso)
  } catch (error) {
    console.error(`Error updating curso coordenador with ID ${id}:`, error)
    return err({ type: "database_error", error })
  }
}
