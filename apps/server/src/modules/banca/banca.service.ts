import { and, asc, desc, eq, gte, ilike, inArray, lt, or } from "drizzle-orm"
import { type Context } from "hono"
import type { InferResultType } from "../../database"
import {
  Bancas,
  bancasDocumentos,
  Cursos,
  documentos,
  invites,
  type SelectUser,
  type UserRole,
  Users,
  usuariosBancas,
} from "../../database/schema"
import { type AppResult, err, ok } from "../../result"
import { type AppVariables } from "../../types"
import { getUserById } from "../usuario/usuario.service"
import { type CreateBancaInput, type UpdateBancaInput } from "./banca.schema"
import { BancaDAO } from "./banca.dao"

type GetAllBancasError = { type: "database_error"; error: unknown }

type GetBancaByIdError = { type: "banca_not_found" } | { type: "database_error"; error: unknown }

type CreateBancaError =
  | { type: "database_error"; error: unknown }
  | { type: "curso_not_found" }
  | { type: "invalid_input" }
  | { type: "student_already_has_banca" }

type UpdateBancaError =
  | { type: "banca_not_found" }
  | { type: "database_error"; error: unknown }
  | { type: "invalid_input" }

type DeleteBancaError =
  | { type: "banca_not_found" }
  | { type: "unauthorized" }
  | { type: "database_error"; error: unknown }

type ToggleVisibilityError =
  | { type: "banca_not_found" }
  | { type: "unauthorized" }
  | { type: "database_error"; error: unknown }

type GetBancasByUserError = { type: "user_not_found" } | { type: "database_error"; error: unknown }

type AddUserToBancaError =
  | { type: "banca_not_found" }
  | { type: "user_not_found" }
  | { type: "invite_not_found" }
  | { type: "already_member" }
  | { type: "database_error"; error: unknown }

type RemoveUserFromBancaError = { type: "relation_not_found" } | { type: "database_error"; error: unknown }
type SetEvaluatorGradeError =
  | { type: "relation_not_found" }
  | { type: "unauthorized" }
  | { type: "database_error"; error: unknown }

type SetBancaGradeError = { type: "banca_not_found" } | { type: "database_error"; error: unknown }

type GetBancasByOrientadorError = { type: "database_error"; error: unknown }

export const getUpcomingBancasVisible = async (
  c: Context<{ Variables: AppVariables }>,
  orderBy?: string,
  order?: "asc" | "desc",
  page: number = 1,
  limit: number = 10,
  searchQuery?: string
): Promise<
  AppResult<
    {
      bancasWithMembros: InferResultType<
        "Bancas",
        { curso: true; orientador: true; membros: { with: { usuario: true } } }
      >[]
      meta: {
        total: number
        totalPages: number
        currentPage: number
        limit: number
        hasNext: boolean
        hasPrev: boolean
      }
    },
    GetAllBancasError
  >
> => {
  try {
    const dao = new BancaDAO(c.get)
    const { bancas, total } = await dao.getUpcomingBancas({
      page,
      limit,
      orderBy,
      order,
      searchQuery,
    })

    const totalPages = Math.ceil(total / limit)

    return ok({
      bancasWithMembros: bancas,
      meta: {
        total,
        totalPages,
        currentPage: page,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error("Error fetching upcoming bancas:", error)
    return err({ type: "database_error", error })
  }
}

export const getPastBancasVisible = async (
  c: Context<{ Variables: AppVariables }>,
  orderBy?: string,
  order?: "asc" | "desc",
  page: number = 1,
  limit: number = 10,
  searchQuery?: string
): Promise<
  AppResult<
    {
      bancasWithMembros: InferResultType<
        "Bancas",
        { curso: true; orientador: true; membros: { with: { usuario: true } } }
      >[]
      meta: {
        total: number
        totalPages: number
        currentPage: number
        limit: number
        hasNext: boolean
        hasPrev: boolean
      }
    },
    GetAllBancasError
  >
> => {
  try {
    const dao = new BancaDAO(c.get)
    const { bancas, total } = await dao.getPastBancas({
      page,
      limit,
      orderBy,
      order,
      searchQuery,
    })

    const totalPages = Math.ceil(total / limit)

    return ok({
      bancasWithMembros: bancas,
      meta: {
        total,
        totalPages,
        currentPage: page,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error("Error fetching past bancas:", error)
    return err({ type: "database_error", error })
  }
}

export const getAllBancasVisible = async (
  c: Context<{ Variables: AppVariables }>,
  orderBy?: string,
  order?: "asc" | "desc",
  page: number = 1,
  limit: number = 10,
  searchQuery?: string
): Promise<
  AppResult<
    {
      bancasWithMembrosPast: InferResultType<
        "Bancas",
        { curso: true; orientador: true; membros: { with: { usuario: true } } }
      >[]
      bancasWithMembrosUpcoming: InferResultType<
        "Bancas",
        { curso: true; orientador: true; membros: { with: { usuario: true } } }
      >[]
      meta: {
        total: number
        totalPages: number
        currentPage: number
        limit: number
        hasNext: boolean
        hasPrev: boolean
      }
    },
    GetAllBancasError
  >
> => {
  const dbInstance = c.get("db")
  try {
    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build search condition for count query (with joins - can reference related tables)
    const searchConditionWithJoins = searchQuery
      ? or(
          ilike(Bancas.tituloTrabalho, `%${searchQuery}%`),
          ilike(Bancas.autor, `%${searchQuery}%`),
          ilike(Users.nome, `%${searchQuery}%`),
          ilike(Cursos.nome, `%${searchQuery}%`)
        )
      : undefined

    // Build search condition for data queries (without joins - only main table fields)
    const searchConditionMainTable = searchQuery
      ? or(ilike(Bancas.tituloTrabalho, `%${searchQuery}%`), ilike(Bancas.autor, `%${searchQuery}%`))
      : undefined

    // Build where conditions
    const whereConditionWithJoins = searchConditionWithJoins
      ? and(eq(Bancas.visible, true), searchConditionWithJoins)
      : eq(Bancas.visible, true)

    const whereConditionMainTable = searchConditionMainTable
      ? and(eq(Bancas.visible, true), searchConditionMainTable)
      : eq(Bancas.visible, true)

    // First, get the total count with search (using joins)
    const totalResult = await dbInstance
      .select({ count: Bancas.id })
      .from(Bancas)
      .leftJoin(Users, eq(Bancas.orientadorId, Users.id))
      .leftJoin(Cursos, eq(Bancas.cursoId, Cursos.id))
      .where(whereConditionWithJoins)
      .orderBy(desc(Bancas.dataRealizacao))

    const total = totalResult.length
    const totalPages = Math.ceil(total / limit)

    const fieldMap: Record<string, any> = {
      dataRealizacao: Bancas.dataRealizacao,
      tituloTrabalho: Bancas.tituloTrabalho,
      autor: Bancas.autor,
      local: Bancas.local,
      orientador: Users.nome,
      curso: Cursos.nome,
    }
    const hasOrder = orderBy && fieldMap[orderBy]
    const needsJoins = hasOrder && (orderBy === "orientador" || orderBy === "curso")

    // For date field, always use natural ordering (past: desc, upcoming: asc)
    // For other fields, respect user's order preference
    const getPastOrderClause = () => {
      if (hasOrder) {
        if (orderBy === "dataRealizacao") {
          return desc(fieldMap[orderBy]) // Past defenses: always descending (most recent first)
        }
        return order === "desc" ? desc(fieldMap[orderBy]) : asc(fieldMap[orderBy])
      }
      return desc(Bancas.dataRealizacao)
    }

    const getUpcomingOrderClause = () => {
      if (hasOrder) {
        if (orderBy === "dataRealizacao") {
          return asc(fieldMap[orderBy]) // Upcoming defenses: always ascending (closest first)
        }
        return order === "desc" ? desc(fieldMap[orderBy]) : asc(fieldMap[orderBy])
      }
      return asc(Bancas.dataRealizacao)
    }

    let bancasWithMembrosPast: InferResultType<"Bancas", { curso: true; orientador: true; membros: { with: { usuario: true } } }>[]
    let bancasWithMembrosUpcoming: InferResultType<"Bancas", { curso: true; orientador: true; membros: { with: { usuario: true } } }>[]
    
    if (needsJoins) {
      // Use core Drizzle API with explicit joins for sorting by related fields
      // Past defenses
      const bancasResultPast = await dbInstance
        .select({
          banca: Bancas,
        })
        .from(Bancas)
        .leftJoin(Users, eq(Bancas.orientadorId, Users.id))
        .leftJoin(Cursos, eq(Bancas.cursoId, Cursos.id))
        .where(and(whereConditionWithJoins, lt(Bancas.dataRealizacao, new Date())))
        .orderBy(getPastOrderClause())
        .limit(limit)
        .offset(offset)
      
      // Upcoming defenses  
      const bancasResultUpcoming = await dbInstance
        .select({
          banca: Bancas,
        })
        .from(Bancas)
        .leftJoin(Users, eq(Bancas.orientadorId, Users.id))
        .leftJoin(Cursos, eq(Bancas.cursoId, Cursos.id))
        .where(and(whereConditionWithJoins, gte(Bancas.dataRealizacao, new Date())))
        .orderBy(getUpcomingOrderClause())
        .limit(limit)
        .offset(offset)
      
      // Fetch full data for past defenses
      const bancaIdsPast = bancasResultPast.map(row => row.banca.id)
      if (bancaIdsPast.length > 0) {
        bancasWithMembrosPast = await dbInstance.query.Bancas.findMany({
          where: inArray(Bancas.id, bancaIdsPast),
          with: {
            orientador: true,
            curso: true,
            membros: {
              with: {
                usuario: true,
              },
            },
          },
        })
        
        // Sort the results to match the original order from the join query
        const orderMapPast = new Map(bancasResultPast.map((row, index) => [row.banca.id, index]))
        bancasWithMembrosPast.sort((a, b) => (orderMapPast.get(a.id) || 0) - (orderMapPast.get(b.id) || 0))
      } else {
        bancasWithMembrosPast = []
      }
      
      // Fetch full data for upcoming defenses
      const bancaIdsUpcoming = bancasResultUpcoming.map(row => row.banca.id)
      if (bancaIdsUpcoming.length > 0) {
        bancasWithMembrosUpcoming = await dbInstance.query.Bancas.findMany({
          where: inArray(Bancas.id, bancaIdsUpcoming),
          with: {
            orientador: true,
            curso: true,
            membros: {
              with: {
                usuario: true,
              },
            },
          },
        })
        
        // Sort the results to match the original order from the join query
        const orderMapUpcoming = new Map(bancasResultUpcoming.map((row, index) => [row.banca.id, index]))
        bancasWithMembrosUpcoming.sort((a, b) => (orderMapUpcoming.get(a.id) || 0) - (orderMapUpcoming.get(b.id) || 0))
      } else {
        bancasWithMembrosUpcoming = []
      }
    } else {
      // Use query API for non-join sorting (faster)
      bancasWithMembrosPast = await dbInstance.query.Bancas.findMany({
        where: and(whereConditionMainTable, lt(Bancas.dataRealizacao, new Date())),
        orderBy: getPastOrderClause(),
        limit,
        offset,
        with: {
          orientador: true,
          curso: true,
          membros: {
            with: {
              usuario: true,
            },
          },
        },
      })
      bancasWithMembrosUpcoming = await dbInstance.query.Bancas.findMany({
        where: and(whereConditionMainTable, gte(Bancas.dataRealizacao, new Date())),
        orderBy: getUpcomingOrderClause(),
        limit,
        offset,
        with: {
          orientador: true,
          curso: true,
          membros: {
            with: {
              usuario: true,
            },
          },
        },
      })
    }

    return ok({
      bancasWithMembrosPast,
      bancasWithMembrosUpcoming,
      meta: {
        total,
        totalPages,
        currentPage: page,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error("Error fetching all bancas:", error)
    return err({ type: "database_error", error })
  }
}

export const getBancaById = async (
  c: Context<{ Variables: AppVariables }>,
  id: number
): Promise<
  AppResult<InferResultType<"Bancas", { curso: true; membros: { with: { usuario: true } } }>, GetBancaByIdError>
> => {
  const dbInstance = c.get("db")
  try {
    // Get current user from JWT if authenticated
    let currentUserId: number | null = null
    let isAdmin = false
    const payload = c.get("jwtPayload")
    if (payload) {
      const userResult = await getUserById(c, Number(payload.sub))
      if (userResult.ok) {
        currentUserId = userResult.data.id
        isAdmin = userResult.data.role === "ADMIN"
      }
    }

    // First, try to get the banca regardless of visibility
    const result = await dbInstance.query.Bancas.findFirst({
      where: eq(Bancas.id, id),
      with: {
        curso: true,
        membros: {
          with: {
            usuario: true,
          },
        },
      },
    })

    if (!result) {
      return err({ type: "banca_not_found" })
    }

    // Check visibility rules
    const canAccess =
      result.visible || // Always show visible bancas
      (!currentUserId
        ? false // If not authenticated, hide non-visible bancas
        : isAdmin || // Show non-visible bancas to admins
          result.orientadorId === currentUserId || // Show non-visible bancas to the advisor
          result.membros.some((membro) => membro.usuario.id === currentUserId)) // Show to members

    if (!canAccess) {
      return err({ type: "banca_not_found" })
    }

    return ok(result)
  } catch (error) {
    console.error(`Error fetching banca with ID ${id}:`, error)
    return err({ type: "database_error", error })
  }
}

export const createBanca = async (
  c: Context<{ Variables: AppVariables }>,
  bancaData: CreateBancaInput
): Promise<AppResult<typeof Bancas.$inferSelect, CreateBancaError>> => {
  const dbInstance = c.get("db")

  try {
    const cursoExists = await dbInstance
      .select({ id: Cursos.id })
      .from(Cursos)
      .where(eq(Cursos.id, bancaData.cursoId))
      .limit(1)

    if (cursoExists.length === 0) {
      return err({ type: "curso_not_found" })
    }

    const [newBanca] = await dbInstance.insert(Bancas).values(bancaData).returning()

    if (!newBanca) {
      return err({ type: "database_error", error: "Failed to create banca" })
    }

    // Add the advisor as orientador
    await dbInstance.insert(usuariosBancas).values({
      bancaId: newBanca.id,
      usuarioId: bancaData.orientadorId,
      role: "orientador",
    })
    
    // Add the student as aluno
    await dbInstance.insert(usuariosBancas).values({
      bancaId: newBanca.id,
      usuarioId: bancaData.alunoId,
      role: "aluno",
    })
    
    // Add evaluators if provided
    if (bancaData.membros && bancaData.membros.length > 0) {
      // Filter out the orientador from membros to avoid duplication
      // The orientador is already added as "orientador" role above
      const avaliadoresData = bancaData.membros
        .filter((membro) => Number(membro.id) !== bancaData.orientadorId)
        .map((membro) => ({
          bancaId: newBanca.id,
          usuarioId: Number(membro.id),
          role: "avaliador" as const,
        }))
      
      if (avaliadoresData.length > 0) {
        await dbInstance.insert(usuariosBancas).values(avaliadoresData)
      }
    }

    return ok(newBanca)
  } catch (error: any) {
    if (error?.code === "23505" && error?.constraint === "aluno_curso_unique") {
      return err({ type: "student_already_has_banca" })
    }
    console.error("Error creating banca:", error)
    return err({ type: "database_error", error })
  }
}

export const updateBanca = async (
  c: Context<{ Variables: AppVariables }>,
  id: number,
  data: UpdateBancaInput
): Promise<AppResult<typeof Bancas.$inferSelect, UpdateBancaError>> => {
  const dbInstance = c.get("db")
  try {
    // Convert the data format from frontend to database format
    const bancaUpdateData = {
      tituloTrabalho: data.tituloTrabalho,
      palavrasChave: data.palavrasChave,
      resumo: data.resumo,
      abstract: data.abstract,
      dataRealizacao: data.dataRealizacao,
      local: data.local,
      turma: data.turma || "",
      periodoAcademico: data.periodoAcademico || "",
      orientadorId: Number(data.orientadorId),
      cursoId: Number(data.cursoId),
    }

    const [updatedBanca] = await dbInstance.update(Bancas).set(bancaUpdateData).where(eq(Bancas.id, id)).returning()

    if (!updatedBanca) {
      return err({ type: "banca_not_found" })
    }

    // Update the banca members (orientador, aluno, and avaliadores)
    await dbInstance.delete(usuariosBancas).where(eq(usuariosBancas.bancaId, id))

    // Add orientador
    await dbInstance.insert(usuariosBancas).values({
      bancaId: updatedBanca.id,
      usuarioId: Number(data.orientadorId),
      role: "orientador",
    })

    // Add aluno (student) if provided
    if (data.alunoId) {
      await dbInstance.insert(usuariosBancas).values({
        bancaId: updatedBanca.id,
        usuarioId: Number(data.alunoId),
        role: "aluno",
      })
    }

    // Add avaliadores
    if (data.membros && data.membros.length > 0) {
      const avaliadoresData = data.membros.map((membro) => ({
        bancaId: updatedBanca.id,
        usuarioId: Number(membro.id),
        role: "avaliador" as const,
      }))
      await dbInstance.insert(usuariosBancas).values(avaliadoresData)
    }

    return ok(updatedBanca)
  } catch (error) {
    console.error("Error updating banca:", error)
    return err({ type: "database_error", error: "Failed to update banca" })
  }
}

export const deleteBanca = async (
  c: Context<{ Variables: AppVariables }>,
  id: number
): Promise<AppResult<void, DeleteBancaError>> => {
  const dbInstance = c.get("db")

  try {
    const bancaExists = await dbInstance.select({ id: Bancas.id }).from(Bancas).where(eq(Bancas.id, id)).limit(1)

    if (bancaExists.length === 0) {
      return err({ type: "banca_not_found" })
    }

    await dbInstance.delete(usuariosBancas).where(eq(usuariosBancas.bancaId, id))
    await dbInstance.delete(Bancas).where(eq(Bancas.id, id))

    return ok(undefined)
  } catch (error) {
    console.error(`Error deleting banca with ID ${id}:`, error)
    return err({ type: "database_error", error })
  }
}

export const toggleBancaVisibility = async (
  c: Context<{ Variables: AppVariables }>,
  bancaId: number
): Promise<AppResult<typeof Bancas.$inferSelect, ToggleVisibilityError>> => {
  const db = c.get("db")
  const payload = c.get("jwtPayload")

  try {
    const [banca] = await db.select().from(Bancas).where(eq(Bancas.id, bancaId))
    if (!banca) {
      return err({ type: "banca_not_found" })
    }

    const userResult = await getUserById(c, Number(payload.sub))
    if (!userResult.ok) {
      return err({ type: "unauthorized" })
    }
    const user = userResult.data

    if (user.role !== "ADMIN" && banca.orientadorId !== user.id) {
      return err({ type: "unauthorized" })
    }

    const newVisibility = !banca.visible

    const [updatedBanca] = await db
      .update(Bancas)
      .set({ visible: newVisibility })
      .where(eq(Bancas.id, bancaId))
      .returning()

    return ok(updatedBanca)
  } catch (error) {
    console.error(`Error toggling visibility for banca ID ${bancaId}:`, error)
    return err({ type: "database_error", error })
  }
}

export const getBancasByUser = async (
  c: Context<{ Variables: AppVariables }>,
  userId: number
): Promise<AppResult<(typeof Bancas.$inferSelect)[], GetBancasByUserError>> => {
  const dbInstance = c.get("db")

  try {
    const userExists = await dbInstance.select({ id: Users.id }).from(Users).where(eq(Users.id, userId)).limit(1)

    if (userExists.length === 0) {
      return err({ type: "user_not_found" })
    }

    const bancas = await dbInstance
      .select({
        banca: Bancas,
      })
      .from(usuariosBancas)
      .innerJoin(Bancas, eq(usuariosBancas.bancaId, Bancas.id))
      .where(eq(usuariosBancas.usuarioId, userId))
      .orderBy(desc(Bancas.dataRealizacao))

    return ok(bancas.map((row) => row.banca))
  } catch (error) {
    console.error(`Error fetching bancas for user ID ${userId}:`, error)
    return err({ type: "database_error", error })
  }
}

export const getUsersByBanca = async (
  c: Context<{ Variables: AppVariables }>,
  bancaId: number
): Promise<AppResult<(SelectUser & { role: string })[], GetBancaByIdError>> => {
  const dbInstance = c.get("db")

  try {
    const bancaExists = await dbInstance.select({ id: Bancas.id }).from(Bancas).where(eq(Bancas.id, bancaId)).limit(1)

    if (bancaExists.length === 0) {
      return err({ type: "banca_not_found" })
    }

    const usersWithRole = await dbInstance
      .select({
        user: Users,
        role: usuariosBancas.role,
      })
      .from(usuariosBancas)
      .innerJoin(Users, eq(usuariosBancas.usuarioId, Users.id))
      .where(eq(usuariosBancas.bancaId, bancaId))

    const users = usersWithRole.map((row) => ({
      ...row.user,
      role: row.role as UserRole,
    }))

    return ok(users)
  } catch (error) {
    console.error(`Error fetching users for banca ID ${bancaId}:`, error)
    return err({ type: "database_error", error })
  }
}

export const removeUserFromBanca = async (
  c: Context<{ Variables: AppVariables }>,
  bancaId: number,
  userId: number
): Promise<AppResult<void, RemoveUserFromBancaError>> => {
  const dbInstance = c.get("db")

  try {
    const relationExists = await dbInstance
      .select({ id: usuariosBancas.id })
      .from(usuariosBancas)
      .where(and(eq(usuariosBancas.usuarioId, userId), eq(usuariosBancas.bancaId, bancaId)))
      .limit(1)

    if (relationExists.length === 0) {
      return err({ type: "relation_not_found" })
    }

    await dbInstance
      .delete(usuariosBancas)
      .where(and(eq(usuariosBancas.usuarioId, userId), eq(usuariosBancas.bancaId, bancaId)))

    return ok(undefined)
  } catch (error) {
    console.error(`Error removing user ${userId} from banca ${bancaId}:`, error)
    return err({ type: "database_error", error })
  }
}

export const setBancaGrade = async (
  c: Context<{ Variables: AppVariables }>,
  bancaId: number,
  grade: string
): Promise<AppResult<typeof Bancas.$inferSelect, SetBancaGradeError>> => {
  const dbInstance = c.get("db")

  try {
    const bancaExists = await dbInstance.select({ id: Bancas.id }).from(Bancas).where(eq(Bancas.id, bancaId)).limit(1)

    if (bancaExists.length === 0) {
      return err({ type: "banca_not_found" })
    }

    const [updatedBanca] = await dbInstance
      .update(Bancas)
      .set({ notaFinal: grade })
      .where(eq(Bancas.id, bancaId))
      .returning()

    return ok(updatedBanca)
  } catch (error) {
    console.error(`Error setting grade for banca ID ${bancaId}:`, error)
    return err({ type: "database_error", error })
  }
}

export const setEvaluatorGrade = async (
  c: Context<{ Variables: AppVariables }>,
  bancaId: number,
  userId: number,
  grade: string,
  currentUserId: number
): Promise<AppResult<typeof usuariosBancas.$inferSelect, SetEvaluatorGradeError>> => {
  const dbInstance = c.get("db")

  try {
    // Check if the relation exists
    const relationExists = await dbInstance
      .select({ id: usuariosBancas.id })
      .from(usuariosBancas)
      .where(and(eq(usuariosBancas.usuarioId, userId), eq(usuariosBancas.bancaId, bancaId)))
      .limit(1)

    if (relationExists.length === 0) {
      return err({ type: "relation_not_found" })
    }

    // Check if current user is authorized to set this grade
    // Only the user themselves can set their own grade (unless they're admin)
    const currentUserResult = await getUserById(c, currentUserId)
    if (!currentUserResult.ok) {
      return err({ type: "database_error", error: "User not found" })
    }

    const isAdmin = currentUserResult.data.role === "ADMIN"
    if (!isAdmin && currentUserId !== userId) {
      return err({ type: "unauthorized" })
    }

    const [updatedRelation] = await dbInstance
      .update(usuariosBancas)
      .set({ nota: grade })
      .where(and(eq(usuariosBancas.usuarioId, userId), eq(usuariosBancas.bancaId, bancaId)))
      .returning()

    return ok(updatedRelation)
  } catch (error) {
    console.error(`Error setting grade for user ${userId} in banca ${bancaId}:`, error)
    return err({ type: "database_error", error })
  }
}

export const getBancaDocuments = async (
  c: Context<{ Variables: AppVariables }>,
  bancaId: number
): Promise<AppResult<(typeof documentos.$inferSelect)[], GetBancaByIdError>> => {
  const dbInstance = c.get("db")

  try {
    const bancaExists = await dbInstance.select({ id: Bancas.id }).from(Bancas).where(eq(Bancas.id, bancaId)).limit(1)

    if (bancaExists.length === 0) {
      return err({ type: "banca_not_found" })
    }

    const documents = await dbInstance
      .select({
        document: documentos,
      })
      .from(bancasDocumentos)
      .innerJoin(documentos, eq(bancasDocumentos.documentoId, documentos.id))
      .where(eq(bancasDocumentos.bancaId, bancaId))

    return ok(documents.map((row) => row.document))
  } catch (error) {
    console.error(`Error fetching documents for banca ID ${bancaId}:`, error)
    return err({ type: "database_error", error })
  }
}

export const sendInviteEmail = async (
  c: Context<{ Variables: AppVariables }>,
  bancaId: number,
  email: string,
  role: string
): Promise<AppResult<typeof invites.$inferSelect, GetBancaByIdError>> => {
  const dbInstance = c.get("db")

  try {
    const bancaExists = await dbInstance.select({ id: Bancas.id }).from(Bancas).where(eq(Bancas.id, bancaId)).limit(1)

    if (bancaExists.length === 0) {
      return err({ type: "banca_not_found" })
    }

    const [newInvite] = await dbInstance
      .insert(invites)
      .values({
        bancaId,
        emailConvidado: email,
        roleConvidado: role,
        inviteHash: crypto.randomUUID(),
        status: "pending",
        createdAt: new Date(),
      })
      .returning()

    return ok(newInvite)
  } catch (error) {
    console.error(`Error creating invite for banca ID ${bancaId}:`, error)
    return err({ type: "database_error", error })
  }
}

export const getBancasByOrientador = async (
  c: Context<{ Variables: AppVariables }>,
  orientadorId: number,
  orderBy?: string,
  order?: "asc" | "desc",
  page: number = 1,
  limit: number = 10,
  searchQuery?: string
): Promise<
  AppResult<
    {
      past: InferResultType<"Bancas", { curso: true; orientador: true; membros: { with: { usuario: true } } }>[]
      upcoming: InferResultType<"Bancas", { curso: true; orientador: true; membros: { with: { usuario: true } } }>[]
      meta: {
        total: number
        totalPages: number
        currentPage: number
        limit: number
        hasNext: boolean
        hasPrev: boolean
      }
    },
    GetBancasByOrientadorError
  >
> => {
  try {
    const dao = new BancaDAO(c.get)
    const { past, upcoming, total } = await dao.getBancasByOrientador({
      orientadorId,
      page,
      limit,
      orderBy,
      order,
      searchQuery,
    })

    const totalPages = Math.ceil(total / limit)

    return ok({
      past,
      upcoming,
      meta: {
        total,
        totalPages,
        currentPage: page,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error("Error fetching bancas by orientador:", error)
    return err({ type: "database_error", error })
  }
}
