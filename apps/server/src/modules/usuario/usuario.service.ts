import * as bcrypt from "bcryptjs"
import { and, desc, eq, or } from "drizzle-orm"
import { type Context } from "hono"
import { z } from "zod"
import { Bancas, type SelectUser, Users } from "../../database/schema"
import { type AppResult, err, ok } from "../../result"
import { type AppVariables } from "../../types"
import { createUserSchema, updateUserSchema } from "./usuario.schema"

type GetUserByIdError = { type: "user_not_found" } | { type: "database_error"; error: unknown }
type UpdateUserError =
  | { type: "user_not_found" }
  | { type: "duplicate_username" }
  | { type: "database_error"; error: unknown }
type DeleteUserError =
  | { type: "user_not_found" }
  | { type: "user_referenced_elsewhere" }
  | { type: "database_error"; error: unknown }
type UpdateUserRoleError = { type: "user_not_found" } | { type: "database_error"; error: unknown }
type GetUserBancasError = { type: "user_not_found" } | { type: "database_error"; error: unknown }

type GetAllUsersError = { type: "database_error"; error: unknown }
export const getAllUsers = async (
  c: Context<{ Variables: AppVariables }>
): Promise<AppResult<SelectUser[], GetAllUsersError>> => {
  const dbInstance = c.get("db")
  try {
    const allUsers = await dbInstance.select().from(Users).orderBy(desc(Users.role))

    return ok(allUsers)
  } catch (error) {
    console.error("Error fetching all users:", error)
    return err({ type: "database_error", error })
  }
}

type GetTeachersError = { type: "database_error"; error: unknown }
export const getTeachers = async (
  c: Context<{ Variables: AppVariables }>
): Promise<AppResult<SelectUser[], GetTeachersError>> => {
  const dbInstance = c.get("db")
  try {
    const teachers = await dbInstance
      .select()
      .from(Users)
      .where(and(or(eq(Users.role, "TEACHER"), eq(Users.role, "ADMIN")), eq(Users.status, "ACTIVE")))
      .orderBy(Users.nome)

    return ok(teachers)
  } catch (error) {
    console.error("Error fetching teachers:", error)
    return err({ type: "database_error", error })
  }
}

type CreateUserError =
  | { type: "duplicate_email" }
  | { type: "duplicate_username" }
  | { type: "hashing_error"; error: unknown }
  | { type: "database_error"; error: unknown }
export const createUser = async (
  c: Context<{ Variables: AppVariables }>,
  userData: z.infer<typeof createUserSchema>
): Promise<AppResult<SelectUser, CreateUserError>> => {
  const dbInstance = c.get("db")

  try {
    const existingUser = await dbInstance
      .select({ id: Users.id })
      .from(Users)
      .where(eq(Users.email, userData.email))
      .limit(1)

    if (existingUser.length > 0) {
      const isEmailDuplicate = await dbInstance
        .select({ id: Users.id })
        .from(Users)
        .where(eq(Users.email, userData.email))
        .limit(1)
      return err({ type: isEmailDuplicate.length > 0 ? "duplicate_email" : "duplicate_username" })
    }

    let passwordHash: string | undefined = undefined
    try {
      passwordHash = await bcrypt.hash(userData.password, 10)
    } catch (hashError) {
      console.error("Password hashing failed during user creation:", hashError)
      return err({ type: "hashing_error", error: hashError })
    }

    const now = new Date()
    const [newUserResult] = await dbInstance
      .insert(Users)
      .values({
        nome: userData.nome.trim(),
        academicTitle: userData.academicTitle.trim(),
        email: userData.email.trim(),
        matricula: userData.matricula.trim(),
        passwordHash: passwordHash,
        role: userData.role,
        status: "ACTIVE",
        createdAt: now,
        updatedAt: now,
        school: userData.school,
      })
      .returning()

    if (!newUserResult) {
      console.error("Failed to insert user or retrieve data after insert.")
      return err({ type: "database_error", error: "Insert operation did not return expected data." })
    }

    return ok(newUserResult)
  } catch (error) {
    console.error("Database error during user creation:", error)
    return err({ type: "database_error", error })
  }
}

export const getUserById = async (
  c: Context<{ Variables: AppVariables }>,
  id: number
): Promise<AppResult<SelectUser, GetUserByIdError>> => {
  const dbInstance = c.get("db")
  try {
    const result = await dbInstance.select().from(Users).where(eq(Users.id, id)).limit(1)
    const user = result[0]

    if (!user) {
      return err({ type: "user_not_found" })
    }
    return ok(user)
  } catch (error) {
    console.error(`Error fetching user with ID ${id}:`, error)
    return err({ type: "database_error", error })
  }
}

type UpdateUserInput = z.infer<typeof updateUserSchema.shape.body>

export const updateUser = async (
  c: Context<{ Variables: AppVariables }>,
  id: number,
  updateData: UpdateUserInput
): Promise<AppResult<SelectUser, UpdateUserError>> => {
  const dbInstance = c.get("db")
  const { nome, school, academicTitle } = updateData

  try {
    const userCheck = await dbInstance.select({ id: Users.id }).from(Users).where(eq(Users.id, id)).limit(1)
    if (userCheck.length === 0) {
      return err({ type: "user_not_found" })
    }

    const [updatedUser] = await dbInstance
      .update(Users)
      .set({
        nome: nome,
        school: school,
        academicTitle: academicTitle,
        updatedAt: new Date(),
      })
      .where(eq(Users.id, id))
      .returning()

    if (!updatedUser) {
      console.error(`Update failed unexpectedly for user ID ${id} after existence check.`)
      return err({ type: "user_not_found" })
    }

    return ok(updatedUser)
  } catch (error) {
    console.error(`Error updating user with ID ${id}:`, error)

    if (error instanceof Error && error.message.includes("UNIQUE constraint failed: usuarios.username")) {
      return err({ type: "duplicate_username" })
    }
    return err({ type: "database_error", error })
  }
}

export const deleteUser = async (
  c: Context<{ Variables: AppVariables }>,
  id: number
): Promise<AppResult<void, DeleteUserError>> => {
  const dbInstance = c.get("db")
  try {
    const userCheck = await dbInstance.select({ id: Users.id }).from(Users).where(eq(Users.id, id)).limit(1)
    if (userCheck.length === 0) {
      return err({ type: "user_not_found" })
    }

    await dbInstance.delete(Users).where(eq(Users.id, id))

    return ok(undefined)
  } catch (error) {
    console.error(`Error deleting user with ID ${id}:`, error)

    if (error instanceof Error && error.message.includes("FOREIGN KEY constraint failed")) {
      return err({ type: "user_referenced_elsewhere" })
    }
    return err({ type: "database_error", error })
  }
}

export const updateUserRole = async (
  c: Context<{ Variables: AppVariables }>,
  id: number,
  newRole: "STUDENT" | "TEACHER" | "ADMIN"
): Promise<AppResult<{ id: number; role: string }, UpdateUserRoleError>> => {
  const dbInstance = c.get("db")
  try {
    const userCheck = await dbInstance.select({ id: Users.id }).from(Users).where(eq(Users.id, id)).limit(1)
    if (userCheck.length === 0) {
      return err({ type: "user_not_found" })
    }

    const updatedUserResult = await dbInstance
      .update(Users)
      .set({ role: newRole, updatedAt: new Date() })
      .where(eq(Users.id, id))
      .returning({ id: Users.id, role: Users.role })

    const updatedUser = updatedUserResult[0]
    if (!updatedUser) {
      console.error(`Update role failed unexpectedly for user ID ${id}.`)
      return err({ type: "user_not_found" })
    }

    return ok(updatedUser)
  } catch (error) {
    console.error(`Error updating role for user ID ${id}:`, error)
    return err({ type: "database_error", error })
  }
}

export const getUserBancas = async (
  c: Context<{ Variables: AppVariables }>,
  id: number
): Promise<AppResult<any[], GetUserBancasError>> => {
  const dbInstance = c.get("db")
  try {
    const userCheck = await dbInstance.select({ id: Users.id }).from(Users).where(eq(Users.id, id)).limit(1)
    if (userCheck.length === 0) {
      return err({ type: "user_not_found" })
    }

    const relatedBancas = await dbInstance.select().from(Bancas)

    return ok(relatedBancas)
  } catch (error) {
    console.error(`Error fetching bancas for user ID ${id}:`, error)
    return err({ type: "database_error", error })
  }
}
