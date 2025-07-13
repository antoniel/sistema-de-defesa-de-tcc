import * as bcrypt from "bcryptjs"
import { and, eq, gt, lt } from "drizzle-orm"
import { type Context } from "hono"
import { z } from "zod"
import { Users, teacherInvites } from "../../database/schema"
import { type AppResult, err, ok } from "../../result"
import { type AppVariables } from "../../types"
import { type CreateTeacherInviteInput, type AcceptTeacherInviteInput } from "./teacher-invite.schema"
import crypto from "crypto"

type CreateTeacherInviteError =
  | { type: "duplicate_email" }
  | { type: "database_error"; error: unknown }

type ValidateTeacherInviteError =
  | { type: "invite_not_found" }
  | { type: "invite_expired" }
  | { type: "invite_already_accepted" }
  | { type: "database_error"; error: unknown }

type AcceptTeacherInviteError =
  | { type: "invite_not_found" }
  | { type: "invite_expired" }
  | { type: "invite_already_accepted" }
  | { type: "duplicate_email" }
  | { type: "hashing_error"; error: unknown }
  | { type: "database_error"; error: unknown }

type GetAllTeacherInvitesError = { type: "database_error"; error: unknown }

export const createTeacherInvite = async (
  c: Context<{ Variables: AppVariables }>,
  inviteData: CreateTeacherInviteInput
): Promise<AppResult<{ id: number; email: string; inviteToken: string }, CreateTeacherInviteError>> => {
  const dbInstance = c.get("db")

  try {
    // Verificar se já existe um convite pendente para este email
    const existingInvite = await dbInstance
      .select({ id: teacherInvites.id })
      .from(teacherInvites)
      .where(
        and(
          eq(teacherInvites.email, inviteData.email),
          eq(teacherInvites.status, "pending"),
          gt(teacherInvites.expiresAt, new Date())
        )
      )
      .limit(1)

    if (existingInvite.length > 0) {
      return err({ type: "duplicate_email" })
    }

    // Verificar se já existe um usuário com este email
    const existingUser = await dbInstance
      .select({ id: Users.id })
      .from(Users)
      .where(eq(Users.email, inviteData.email))
      .limit(1)

    if (existingUser.length > 0) {
      return err({ type: "duplicate_email" })
    }

    // Gerar token único
    const inviteToken = crypto.randomBytes(32).toString("hex")
    
    // Definir expiração (7 dias)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const [newInvite] = await dbInstance
      .insert(teacherInvites)
      .values({
        email: inviteData.email.trim(),
        nome: inviteData.nome.trim(),
        school: inviteData.school.trim(),
        academicTitle: inviteData.academicTitle.trim(),
        inviteToken,
        expiresAt,
        status: "pending",
      })
      .returning({ id: teacherInvites.id, email: teacherInvites.email, inviteToken: teacherInvites.inviteToken })

    if (!newInvite) {
      return err({ type: "database_error", error: "Failed to create invite" })
    }

    return ok(newInvite)
  } catch (error) {
    console.error("Error creating teacher invite:", error)
    return err({ type: "database_error", error })
  }
}

export const validateTeacherInvite = async (
  c: Context<{ Variables: AppVariables }>,
  token: string
): Promise<AppResult<{ email: string; nome: string; school: string; academicTitle: string }, ValidateTeacherInviteError>> => {
  const dbInstance = c.get("db")

  try {
    const invite = await dbInstance
      .select({
        email: teacherInvites.email,
        nome: teacherInvites.nome,
        school: teacherInvites.school,
        academicTitle: teacherInvites.academicTitle,
        status: teacherInvites.status,
        expiresAt: teacherInvites.expiresAt,
      })
      .from(teacherInvites)
      .where(eq(teacherInvites.inviteToken, token))
      .limit(1)

    if (invite.length === 0) {
      return err({ type: "invite_not_found" })
    }

    const inviteData = invite[0]

    if (inviteData.status !== "pending") {
      return err({ type: "invite_already_accepted" })
    }

    if (inviteData.expiresAt < new Date()) {
      return err({ type: "invite_expired" })
    }

    return ok({
      email: inviteData.email,
      nome: inviteData.nome,
      school: inviteData.school,
      academicTitle: inviteData.academicTitle,
    })
  } catch (error) {
    console.error("Error validating teacher invite:", error)
    return err({ type: "database_error", error })
  }
}

export const acceptTeacherInvite = async (
  c: Context<{ Variables: AppVariables }>,
  acceptData: AcceptTeacherInviteInput
): Promise<AppResult<{ id: number; email: string; nome: string }, AcceptTeacherInviteError>> => {
  const dbInstance = c.get("db")

  try {
    // Validar o convite
    const invite = await dbInstance
      .select({
        id: teacherInvites.id,
        email: teacherInvites.email,
        nome: teacherInvites.nome,
        school: teacherInvites.school,
        academicTitle: teacherInvites.academicTitle,
        status: teacherInvites.status,
        expiresAt: teacherInvites.expiresAt,
      })
      .from(teacherInvites)
      .where(eq(teacherInvites.inviteToken, acceptData.token))
      .limit(1)

    if (invite.length === 0) {
      return err({ type: "invite_not_found" })
    }

    const inviteData = invite[0]

    if (inviteData.status !== "pending") {
      return err({ type: "invite_already_accepted" })
    }

    if (inviteData.expiresAt < new Date()) {
      return err({ type: "invite_expired" })
    }

    // Verificar se já existe um usuário com este email
    const existingUser = await dbInstance
      .select({ id: Users.id })
      .from(Users)
      .where(eq(Users.email, inviteData.email))
      .limit(1)

    if (existingUser.length > 0) {
      return err({ type: "duplicate_email" })
    }

    // Hash da senha
    let passwordHash: string
    try {
      passwordHash = await bcrypt.hash(acceptData.password, 10)
    } catch (hashError) {
      console.error("Password hashing failed:", hashError)
      return err({ type: "hashing_error", error: hashError })
    }

    // Criar o usuário
    const now = new Date()
    const [newUser] = await dbInstance
      .insert(Users)
      .values({
        nome: inviteData.nome,
        academicTitle: inviteData.academicTitle,
        email: inviteData.email,
        matricula: "", // Será preenchido pelo usuário depois
        passwordHash,
        role: "TEACHER",
        createdAt: now,
        updatedAt: now,
        school: inviteData.school,
      })
      .returning({ id: Users.id, email: Users.email, nome: Users.nome })

    if (!newUser) {
      return err({ type: "database_error", error: "Failed to create user" })
    }

    // Marcar o convite como aceito
    await dbInstance
      .update(teacherInvites)
      .set({
        status: "accepted",
        acceptedAt: now,
        acceptedByUserId: newUser.id,
      })
      .where(eq(teacherInvites.id, inviteData.id))

    return ok(newUser)
  } catch (error) {
    console.error("Error accepting teacher invite:", error)
    return err({ type: "database_error", error })
  }
}

export const getAllTeacherInvites = async (
  c: Context<{ Variables: AppVariables }>
): Promise<AppResult<any[], GetAllTeacherInvitesError>> => {
  const dbInstance = c.get("db")

  try {
    const invites = await dbInstance
      .select({
        id: teacherInvites.id,
        email: teacherInvites.email,
        nome: teacherInvites.nome,
        school: teacherInvites.school,
        academicTitle: teacherInvites.academicTitle,
        status: teacherInvites.status,
        createdAt: teacherInvites.createdAt,
        expiresAt: teacherInvites.expiresAt,
        acceptedAt: teacherInvites.acceptedAt,
      })
      .from(teacherInvites)
      .orderBy(teacherInvites.createdAt)

    return ok(invites)
  } catch (error) {
    console.error("Error fetching teacher invites:", error)
    return err({ type: "database_error", error })
  }
}