import { and, eq } from "drizzle-orm"
import { Context } from "hono"
import {
  Bancas,
  SelectUser,
  UserRole,
  Users,
  bancasDocumentos,
  cursos,
  documentos,
  invites,
  usuariosBancas,
} from "../../database/schema"
import { AppResult, err, ok } from "../../result"
import { AppVariables } from "../../types"
import { CreateBancaInput, UpdateBancaInput } from "./banca.schema"

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

type ToggleVisibilityError = { type: "banca_not_found" } | { type: "database_error"; error: unknown }

type GetBancasByUserError = { type: "user_not_found" } | { type: "database_error"; error: unknown }

type AddUserToBancaError =
  | { type: "banca_not_found" }
  | { type: "user_not_found" }
  | { type: "invite_not_found" }
  | { type: "already_member" }
  | { type: "database_error"; error: unknown }

type RemoveUserFromBancaError = { type: "relation_not_found" } | { type: "database_error"; error: unknown }

type SetBancaGradeError = { type: "banca_not_found" } | { type: "database_error"; error: unknown }

export const getAllBancas = async (
  c: Context<{ Variables: AppVariables }>
): Promise<AppResult<(typeof Bancas.$inferSelect)[], GetAllBancasError>> => {
  const dbInstance = c.get("db")
  try {
    const allBancas = await dbInstance.select().from(Bancas)
    return ok(allBancas)
  } catch (error) {
    console.error("Error fetching all bancas:", error)
    return err({ type: "database_error", error })
  }
}

export const getBancaById = async (
  c: Context<{ Variables: AppVariables }>,
  id: number
): Promise<AppResult<typeof Bancas.$inferSelect, GetBancaByIdError>> => {
  const dbInstance = c.get("db")
  try {
    const result = await dbInstance.select().from(Bancas).where(eq(Bancas.id, id)).limit(1)

    const banca = result[0]
    if (!banca) {
      return err({ type: "banca_not_found" })
    }

    return ok(banca)
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
  updateData: UpdateBancaInput
): Promise<AppResult<typeof Bancas.$inferSelect, UpdateBancaError>> => {
  const dbInstance = c.get("db")

  try {
    const bancaExists = await dbInstance.select({ id: Bancas.id }).from(Bancas).where(eq(Bancas.id, id)).limit(1)

    if (bancaExists.length === 0) {
      return err({ type: "banca_not_found" })
    }

    const [updatedBanca] = await dbInstance.update(Bancas).set(updateData).where(eq(Bancas.id, id)).returning()

    if (!updatedBanca) {
      return err({ type: "database_error", error: "Failed to update banca" })
    }

    return ok(updatedBanca)
  } catch (error) {
    console.error(`Error updating banca with ID ${id}:`, error)
    return err({ type: "database_error", error })
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
  id: number
): Promise<AppResult<typeof Bancas.$inferSelect, ToggleVisibilityError>> => {
  const dbInstance = c.get("db")

  try {
    const result = await dbInstance.select({ visible: Bancas.visible }).from(Bancas).where(eq(Bancas.id, id)).limit(1)

    if (result.length === 0) {
      return err({ type: "banca_not_found" })
    }

    const currentVisible = result[0].visible

    const [updatedBanca] = await dbInstance
      .update(Bancas)
      .set({ visible: !currentVisible })
      .where(eq(Bancas.id, id))
      .returning()

    return ok(updatedBanca)
  } catch (error) {
    console.error(`Error toggling visibility for banca ID ${id}:`, error)
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
