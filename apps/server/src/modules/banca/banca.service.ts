import { and, asc, desc, eq, ilike, or } from "drizzle-orm"
import { type Context } from "hono"
import type { InferResultType } from "../../database"
import {
  Bancas,
  type SelectUser,
  type UserRole,
  Users,
  bancasDocumentos,
  cursos,
  documentos,
  invites,
  usuariosBancas,
} from "../../database/schema"
import { type AppResult, err, ok } from "../../result"
import { type AppVariables } from "../../types"
import { getUserById } from "../usuario/usuario.service"
import { type CreateBancaInput, type UpdateBancaInput } from "./banca.schema"

type GetAllBancasError = { type: "database_error"; error: unknown }

type GetBancaByIdError = { type: "banca_not_found" } | { type: "database_error"; error: unknown }

type CreateBancaError =
  | { type: "database_error"; error: unknown }
  | { type: "curso_not_found" }
  | { type: "invalid_input" }

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

type SetBancaGradeError = { type: "banca_not_found" } | { type: "database_error"; error: unknown }

type GetBancasByOrientadorError = { type: "database_error"; error: unknown }

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
      data: InferResultType<"Bancas", { curso: true; orientador: true; membros: { with: { usuario: true } } }>[]
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

    // Build search condition
    const searchCondition = searchQuery
      ? or(
          ilike(Bancas.tituloTrabalho, `%${searchQuery}%`),
          ilike(Bancas.autor, `%${searchQuery}%`),
          ilike(Users.nome, `%${searchQuery}%`),
          ilike(cursos.nome, `%${searchQuery}%`)
        )
      : undefined

    // Build where condition
    const whereCondition = searchCondition ? and(eq(Bancas.visible, true), searchCondition) : eq(Bancas.visible, true)

    // First, get the total count with search
    const totalResult = await dbInstance
      .select({ count: Bancas.id })
      .from(Bancas)
      .leftJoin(Users, eq(Bancas.orientadorId, Users.id))
      .leftJoin(cursos, eq(Bancas.cursoId, cursos.id))
      .where(whereCondition)

    const total = totalResult.length
    const totalPages = Math.ceil(total / limit)

    // For simple fields, use the query API with orderBy
    const simpleFields = ["dataRealizacao", "tituloTrabalho", "autor", "local"]

    if (!orderBy || simpleFields.includes(orderBy)) {
      const fieldMap: Record<string, any> = {
        dataRealizacao: Bancas.dataRealizacao,
        tituloTrabalho: Bancas.tituloTrabalho,
        autor: Bancas.autor,
        local: Bancas.local,
      }

      let orderClause
      if (orderBy && fieldMap[orderBy]) {
        orderClause = order === "desc" ? desc(fieldMap[orderBy]) : asc(fieldMap[orderBy])
      } else {
        // Default order by dataRealizacao ascending
        orderClause = asc(Bancas.dataRealizacao)
      }

      // For search, we need to use leftJoin even for simple fields
      if (searchQuery) {
        const result = await dbInstance
          .select({
            banca: Bancas,
            orientador: Users,
            curso: cursos,
          })
          .from(Bancas)
          .leftJoin(Users, eq(Bancas.orientadorId, Users.id))
          .leftJoin(cursos, eq(Bancas.cursoId, cursos.id))
          .where(whereCondition)
          .orderBy(orderClause)
          .limit(limit)
          .offset(offset)

        // Fetch membros separately for each banca
        const bancasWithMembros = await Promise.all(
          result.map(async (row) => {
            const membros = await dbInstance.query.usuariosBancas.findMany({
              where: eq(usuariosBancas.bancaId, row.banca.id),
              with: {
                usuario: true,
              },
            })

            return {
              ...row.banca,
              orientador: row.orientador,
              curso: row.curso,
              membros,
            }
          })
        )

        return ok({
          data: bancasWithMembros as any,
          meta: {
            total,
            totalPages,
            currentPage: page,
            limit,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        })
      } else {
        const result = await dbInstance.query.Bancas.findMany({
          where: eq(Bancas.visible, true),
          with: {
            orientador: true,
            curso: true,
            membros: {
              with: {
                usuario: true,
              },
            },
          },
          orderBy: orderClause,
          limit: limit,
          offset: offset,
        })

        return ok({
          data: result,
          meta: {
            total,
            totalPages,
            currentPage: page,
            limit,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        })
      }
    }

    // For related fields, use leftJoin
    let orderClause
    if (orderBy === "orientador") {
      orderClause = order === "desc" ? desc(Users.nome) : asc(Users.nome)
    } else if (orderBy === "curso") {
      orderClause = order === "desc" ? desc(cursos.nome) : asc(cursos.nome)
    } else {
      orderClause = asc(Bancas.dataRealizacao)
    }

    const result = await dbInstance
      .select()
      .from(Bancas)
      .leftJoin(Users, eq(Bancas.orientadorId, Users.id))
      .leftJoin(cursos, eq(Bancas.cursoId, cursos.id))
      .where(whereCondition)
      .orderBy(orderClause)
      .limit(limit)
      .offset(offset)

    // Fetch membros separately for each banca (this is still needed due to the many-to-many relationship)
    const bancasWithMembros = await Promise.all(
      result.map(async (row) => {
        const membros = await dbInstance.query.usuariosBancas.findMany({
          where: eq(usuariosBancas.bancaId, row.banca.id),
          with: {
            usuario: true,
          },
        })

        return {
          ...row.banca,
          orientador: row.usuario,
          curso: row.cursos,
          membros,
        }
      })
    )

    return ok({
      data: bancasWithMembros as any,
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
      .select({ id: cursos.id })
      .from(cursos)
      .where(eq(cursos.id, bancaData.cursoId))
      .limit(1)

    if (cursoExists.length === 0) {
      return err({ type: "curso_not_found" })
    }

    const [newBanca] = await dbInstance.insert(Bancas).values(bancaData).returning()

    if (!newBanca) {
      return err({ type: "database_error", error: "Failed to create banca" })
    }

    return ok(newBanca)
  } catch (error) {
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

export const addUserToBanca = async (
  c: Context<{ Variables: AppVariables }>,
  inviteId: number
): Promise<AppResult<typeof usuariosBancas.$inferSelect, AddUserToBancaError>> => {
  const dbInstance = c.get("db")

  try {
    const inviteResult = await dbInstance.select().from(invites).where(eq(invites.id, inviteId)).limit(1)

    if (inviteResult.length === 0) {
      return err({ type: "invite_not_found" })
    }

    const invite = inviteResult[0]

    if (!invite.userId) {
      return err({ type: "user_not_found" })
    }

    const bancaExists = await dbInstance
      .select({ id: Bancas.id })
      .from(Bancas)
      .where(eq(Bancas.id, invite.bancaId))
      .limit(1)

    if (bancaExists.length === 0) {
      return err({ type: "banca_not_found" })
    }

    const existingRelation = await dbInstance
      .select({ id: usuariosBancas.id })
      .from(usuariosBancas)
      .where(and(eq(usuariosBancas.usuarioId, invite.userId), eq(usuariosBancas.bancaId, invite.bancaId)))
      .limit(1)

    if (existingRelation.length > 0) {
      return err({ type: "already_member" })
    }

    const [newRelation] = await dbInstance
      .insert(usuariosBancas)
      .values({
        usuarioId: invite.userId,
        bancaId: invite.bancaId,
        role: invite.roleConvidado,
      })
      .returning()

    await dbInstance.update(invites).set({ status: "accepted" }).where(eq(invites.id, inviteId))

    return ok(newRelation)
  } catch (error) {
    console.error(`Error adding user to banca with invite ID ${inviteId}:`, error)
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
  grade: string
): Promise<AppResult<typeof usuariosBancas.$inferSelect, RemoveUserFromBancaError>> => {
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
      data: InferResultType<"Bancas", { curso: true; orientador: true; membros: { with: { usuario: true } } }>[]
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
  const dbInstance = c.get("db")
  try {
    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build search condition
    const searchCondition = searchQuery
      ? or(
          ilike(Bancas.tituloTrabalho, `%${searchQuery}%`),
          ilike(Bancas.autor, `%${searchQuery}%`),
          ilike(Users.nome, `%${searchQuery}%`),
          ilike(cursos.nome, `%${searchQuery}%`)
        )
      : undefined

    // Build where condition
    const whereCondition = searchCondition
      ? and(eq(Bancas.orientadorId, orientadorId), searchCondition)
      : eq(Bancas.orientadorId, orientadorId)

    // First, get the total count with search
    const totalResult = await dbInstance
      .select({ count: Bancas.id })
      .from(Bancas)
      .leftJoin(Users, eq(Bancas.orientadorId, Users.id))
      .leftJoin(cursos, eq(Bancas.cursoId, cursos.id))
      .where(whereCondition)

    const total = totalResult.length
    const totalPages = Math.ceil(total / limit)

    // For simple fields, use the query API with orderBy
    const simpleFields = ["dataRealizacao", "tituloTrabalho", "autor", "local"]

    if (!orderBy || simpleFields.includes(orderBy)) {
      const fieldMap: Record<string, any> = {
        dataRealizacao: Bancas.dataRealizacao,
        tituloTrabalho: Bancas.tituloTrabalho,
        autor: Bancas.autor,
        local: Bancas.local,
      }

      let orderClause
      if (orderBy && fieldMap[orderBy]) {
        orderClause = order === "desc" ? desc(fieldMap[orderBy]) : asc(fieldMap[orderBy])
      } else {
        // Default order by dataRealizacao ascending
        orderClause = asc(Bancas.dataRealizacao)
      }

      // For search, we need to use leftJoin even for simple fields
      if (searchQuery) {
        const result = await dbInstance
          .select({
            banca: Bancas,
            orientador: Users,
            curso: cursos,
          })
          .from(Bancas)
          .leftJoin(Users, eq(Bancas.orientadorId, Users.id))
          .leftJoin(cursos, eq(Bancas.cursoId, cursos.id))
          .where(whereCondition)
          .orderBy(orderClause)
          .limit(limit)
          .offset(offset)

        // Fetch membros separately for each banca
        const bancasWithMembros = await Promise.all(
          result.map(async (row) => {
            const membros = await dbInstance.query.usuariosBancas.findMany({
              where: eq(usuariosBancas.bancaId, row.banca.id),
              with: {
                usuario: true,
              },
            })

            return {
              ...row.banca,
              orientador: row.orientador,
              curso: row.curso,
              membros,
            }
          })
        )

        return ok({
          data: bancasWithMembros as any,
          meta: {
            total,
            totalPages,
            currentPage: page,
            limit,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        })
      } else {
        const result = await dbInstance.query.Bancas.findMany({
          where: eq(Bancas.orientadorId, orientadorId),
          with: {
            orientador: true,
            curso: true,
            membros: {
              with: {
                usuario: true,
              },
            },
          },
          orderBy: orderClause,
          limit: limit,
          offset: offset,
        })

        return ok({
          data: result,
          meta: {
            total,
            totalPages,
            currentPage: page,
            limit,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        })
      }
    }

    // For related fields, use leftJoin
    let orderClause
    if (orderBy === "orientador") {
      orderClause = order === "desc" ? desc(Users.nome) : asc(Users.nome)
    } else if (orderBy === "curso") {
      orderClause = order === "desc" ? desc(cursos.nome) : asc(cursos.nome)
    } else {
      orderClause = asc(Bancas.dataRealizacao)
    }

    const result = await dbInstance
      .select()
      .from(Bancas)
      .leftJoin(Users, eq(Bancas.orientadorId, Users.id))
      .leftJoin(cursos, eq(Bancas.cursoId, cursos.id))
      .where(whereCondition)
      .orderBy(orderClause)
      .limit(limit)
      .offset(offset)

    // Fetch membros separately for each banca (this is still needed due to the many-to-many relationship)
    const bancasWithMembros = await Promise.all(
      result.map(async (row) => {
        const membros = await dbInstance.query.usuariosBancas.findMany({
          where: eq(usuariosBancas.bancaId, row.banca.id),
          with: {
            usuario: true,
          },
        })

        return {
          ...row.banca,
          orientador: row.usuario,
          curso: row.cursos,
          membros,
        }
      })
    )

    return ok({
      data: bancasWithMembros as any,
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
