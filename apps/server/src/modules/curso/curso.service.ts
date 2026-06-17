import { asc, eq } from "drizzle-orm"
import { type Context } from "hono"
import type { Database } from "../../database"
import { Bancas, Cursos, Users, type SelectCurso } from "../../database/schema"
import { type AppResult, err, ok } from "../../result"
import { type AppVariables } from "../../types"
import { type CreateCursoInput, type UpdateCursoInput } from "./curso.schema"

type GetAllCursosError = { type: "database_error"; error: unknown }

type CreateCursoError =
  | { type: "duplicate_sigla" }
  | { type: "coordenador_not_found" }
  | { type: "database_error"; error: unknown }

type UpdateCursoError =
  | { type: "curso_not_found" }
  | { type: "duplicate_sigla" }
  | { type: "coordenador_not_found" }
  | { type: "database_error"; error: unknown }

type DeleteCursoError =
  | { type: "curso_not_found" }
  | { type: "curso_in_use" }
  | { type: "database_error"; error: unknown }

type CursoWithCoordenador = SelectCurso & {
  coordenador: typeof Users.$inferSelect | null
}

const isDuplicateSiglaError = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code: string }).code === "23505"

const findCursoWithCoordenador = async (dbInstance: Database, id: number): Promise<CursoWithCoordenador | null> => {
  const curso = await dbInstance.query.Cursos.findFirst({
    where: eq(Cursos.id, id),
    with: {
      coordenador: true,
    },
  })

  return curso ?? null
}

const validateCoordenador = async (
  dbInstance: Database,
  coordenadorId: number | null | undefined
): Promise<AppResult<void, { type: "coordenador_not_found" }>> => {
  if (coordenadorId == null) {
    return ok(undefined)
  }

  const coordenador = await dbInstance.select({ id: Users.id }).from(Users).where(eq(Users.id, coordenadorId)).limit(1)
  if (coordenador.length === 0) {
    return err({ type: "coordenador_not_found" })
  }

  return ok(undefined)
}

export const getAllCursos = async (
  c: Context<{ Variables: AppVariables }>
): Promise<AppResult<CursoWithCoordenador[], GetAllCursosError>> => {
  const dbInstance = c.get("db")
  try {
    const result = await dbInstance.query.Cursos.findMany({
      with: {
        coordenador: true,
      },
      orderBy: [asc(Cursos.nome)],
    })
    return ok(result)
  } catch (error) {
    console.error("Error fetching all cursos:", error)
    return err({ type: "database_error", error })
  }
}

export const createCurso = async (
  c: Context<{ Variables: AppVariables }>,
  data: CreateCursoInput
): Promise<AppResult<CursoWithCoordenador, CreateCursoError>> => {
  const dbInstance = c.get("db")

  const coordenadorValidation = await validateCoordenador(dbInstance, data.coordenadorId)
  if (!coordenadorValidation.ok) {
    return err(coordenadorValidation.error)
  }

  try {
    const [createdCurso] = await dbInstance
      .insert(Cursos)
      .values({
        nome: data.nome,
        sigla: data.sigla,
        coordenadorId: data.coordenadorId ?? null,
      })
      .returning()

    const curso = await findCursoWithCoordenador(dbInstance, createdCurso.id)
    if (!curso) {
      return err({ type: "database_error", error: new Error("Failed to load created curso") })
    }

    return ok(curso)
  } catch (error) {
    if (isDuplicateSiglaError(error)) {
      return err({ type: "duplicate_sigla" })
    }
    console.error("Error creating curso:", error)
    return err({ type: "database_error", error })
  }
}

export const updateCurso = async (
  c: Context<{ Variables: AppVariables }>,
  id: number,
  data: UpdateCursoInput
): Promise<AppResult<CursoWithCoordenador, UpdateCursoError>> => {
  const dbInstance = c.get("db")

  const existingCurso = await dbInstance.select({ id: Cursos.id }).from(Cursos).where(eq(Cursos.id, id)).limit(1)
  if (existingCurso.length === 0) {
    return err({ type: "curso_not_found" })
  }

  if ("coordenadorId" in data) {
    const coordenadorValidation = await validateCoordenador(dbInstance, data.coordenadorId)
    if (!coordenadorValidation.ok) {
      return err(coordenadorValidation.error)
    }
  }

  try {
    const [updatedCurso] = await dbInstance
      .update(Cursos)
      .set({
        ...(data.nome !== undefined ? { nome: data.nome } : {}),
        ...(data.sigla !== undefined ? { sigla: data.sigla } : {}),
        ...(data.coordenadorId !== undefined ? { coordenadorId: data.coordenadorId } : {}),
      })
      .where(eq(Cursos.id, id))
      .returning()

    if (!updatedCurso) {
      return err({ type: "curso_not_found" })
    }

    const curso = await findCursoWithCoordenador(dbInstance, updatedCurso.id)
    if (!curso) {
      return err({ type: "curso_not_found" })
    }

    return ok(curso)
  } catch (error) {
    if (isDuplicateSiglaError(error)) {
      return err({ type: "duplicate_sigla" })
    }
    console.error(`Error updating curso with ID ${id}:`, error)
    return err({ type: "database_error", error })
  }
}

export const deleteCurso = async (
  c: Context<{ Variables: AppVariables }>,
  id: number
): Promise<AppResult<void, DeleteCursoError>> => {
  const dbInstance = c.get("db")

  const existingCurso = await dbInstance.select({ id: Cursos.id }).from(Cursos).where(eq(Cursos.id, id)).limit(1)
  if (existingCurso.length === 0) {
    return err({ type: "curso_not_found" })
  }

  const linkedBanca = await dbInstance.select({ id: Bancas.id }).from(Bancas).where(eq(Bancas.cursoId, id)).limit(1)
  if (linkedBanca.length > 0) {
    return err({ type: "curso_in_use" })
  }

  try {
    await dbInstance.delete(Cursos).where(eq(Cursos.id, id))
    return ok(undefined)
  } catch (error) {
    console.error(`Error deleting curso with ID ${id}:`, error)
    return err({ type: "database_error", error })
  }
}
