import * as bcrypt from "bcryptjs"
import crypto from "crypto"
import { and, eq } from "drizzle-orm"
import { type Context } from "hono"
import { env } from "../../config/env"
import {
  studentInvitations,
  Users,
  type SelectStudentInvitation,
} from "../../database/schema"
import { err, ok, type AppResult } from "../../result"
import { createStudentInvitationEmail, sendEmail } from "../../services/email.service"
import { type AppVariables } from "../../types"

interface CreateStudentInvitationInput {
  email: string
  nome: string
  matricula: string
}

interface CreateStudentInvitationResponse {
  invitationId: number
  invitationHash: string
  userId: number
}

type CreateStudentInvitationServiceError =
  | { type: "duplicate_email" }
  | { type: "existing_invitation" }
  | { type: "database_error" }
  | { type: "email_error" }

// Unguessable random hash that fails bcrypt.compare for any input — stub user can't log in.
const buildUnusablePasswordHash = () => `!unusable!${crypto.randomBytes(32).toString("hex")}`

export const createStudentInvitationService = async (
  c: Context<{ Variables: AppVariables }>,
  input: CreateStudentInvitationInput,
): Promise<AppResult<CreateStudentInvitationResponse, CreateStudentInvitationServiceError>> => {
  const dbInstance = c.get("db")
  const inviter = c.get("jwtPayload")

  if (!inviter) {
    return err({ type: "database_error" })
  }

  try {
    const existingUser = await dbInstance
      .select({ id: Users.id })
      .from(Users)
      .where(eq(Users.email, input.email))
      .limit(1)

    if (existingUser.length > 0) {
      return err({ type: "duplicate_email" })
    }

    const existingInvitation = await dbInstance
      .select({ id: studentInvitations.id })
      .from(studentInvitations)
      .where(and(eq(studentInvitations.email, input.email), eq(studentInvitations.status, "pending")))
      .limit(1)

    if (existingInvitation.length > 0) {
      return err({ type: "existing_invitation" })
    }

    const invitationHash = crypto.randomBytes(32).toString("hex")
    const now = new Date()

    const [stubUser] = await dbInstance
      .insert(Users)
      .values({
        email: input.email,
        nome: input.nome,
        matricula: input.matricula,
        passwordHash: buildUnusablePasswordHash(),
        school: "",
        academicTitle: "",
        role: "STUDENT",
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: Users.id })

    if (!stubUser) {
      return err({ type: "database_error" })
    }

    const [newInvitation] = await dbInstance
      .insert(studentInvitations)
      .values({
        email: input.email,
        nome: input.nome,
        matricula: input.matricula,
        invitationHash,
        invitedBy: Number(inviter.sub),
        userId: stubUser.id,
        status: "pending",
      })
      .returning({ id: studentInvitations.id })

    if (!newInvitation) {
      return err({ type: "database_error" })
    }

    const invitationUrl = `${env.FRONTEND_URL || "http://localhost:5173"}/student-invitation/${invitationHash}`
    const emailHtml = createStudentInvitationEmail(input.nome, invitationUrl)

    const emailResult = await sendEmail({
      to: input.email,
      subject: "Convite para Aluno - Sistema Banca",
      html: emailHtml,
    })

    if (!emailResult.ok) {
      console.error("Failed to send student invitation email:", emailResult.error)
    }

    return ok({
      invitationId: newInvitation.id,
      invitationHash,
      userId: stubUser.id,
    })
  } catch (dbError) {
    console.error("Database error during student invitation creation:", dbError)
    return err({ type: "database_error" })
  }
}

interface StudentInvitationDetails {
  email: string
  nome: string
  matricula: string
  status: string
}

type VerifyStudentInvitationServiceError =
  | { type: "invitation_not_found" }
  | { type: "invitation_already_used" }
  | { type: "database_error" }

export const verifyStudentInvitationService = async (
  c: Context<{ Variables: AppVariables }>,
  hash: string,
): Promise<AppResult<StudentInvitationDetails, VerifyStudentInvitationServiceError>> => {
  const dbInstance = c.get("db")

  try {
    const [invitation] = await dbInstance
      .select({
        email: studentInvitations.email,
        nome: studentInvitations.nome,
        matricula: studentInvitations.matricula,
        status: studentInvitations.status,
      })
      .from(studentInvitations)
      .where(eq(studentInvitations.invitationHash, hash))
      .limit(1)

    if (!invitation) {
      return err({ type: "invitation_not_found" })
    }

    if (invitation.status === "used") {
      return err({ type: "invitation_already_used" })
    }

    return ok(invitation)
  } catch (dbError) {
    console.error("Database error during student invitation verification:", dbError)
    return err({ type: "database_error" })
  }
}

interface AcceptStudentInvitationInput {
  invitationHash: string
  password: string
  school: string
  academicTitle?: string
}

interface AcceptStudentInvitationResponse {
  userId: number
}

type AcceptStudentInvitationServiceError =
  | { type: "invitation_not_found" }
  | { type: "invitation_already_used" }
  | { type: "hashing_error" }
  | { type: "database_error" }

export const acceptStudentInvitationService = async (
  c: Context<{ Variables: AppVariables }>,
  input: AcceptStudentInvitationInput,
): Promise<AppResult<AcceptStudentInvitationResponse, AcceptStudentInvitationServiceError>> => {
  const dbInstance = c.get("db")

  try {
    const [invitation] = await dbInstance
      .select()
      .from(studentInvitations)
      .where(eq(studentInvitations.invitationHash, input.invitationHash))
      .limit(1)

    if (!invitation) {
      return err({ type: "invitation_not_found" })
    }

    if (invitation.status === "used") {
      return err({ type: "invitation_already_used" })
    }

    let passwordHash: string
    try {
      passwordHash = await bcrypt.hash(input.password, 10)
    } catch (hashError) {
      console.error("Password hashing failed:", hashError)
      return err({ type: "hashing_error" })
    }

    const now = new Date()
    await dbInstance
      .update(Users)
      .set({
        passwordHash,
        school: input.school,
        academicTitle: input.academicTitle ?? "",
        updatedAt: now,
      })
      .where(eq(Users.id, invitation.userId))

    await dbInstance
      .update(studentInvitations)
      .set({ status: "used" })
      .where(eq(studentInvitations.id, invitation.id))

    return ok({ userId: invitation.userId })
  } catch (dbError) {
    console.error("Database error during student invitation acceptance:", dbError)
    return err({ type: "database_error" })
  }
}

export const listStudentInvitationsService = async (
  c: Context<{ Variables: AppVariables }>,
): Promise<AppResult<SelectStudentInvitation[], { type: "database_error" }>> => {
  const dbInstance = c.get("db")

  try {
    const invitations = await dbInstance
      .select()
      .from(studentInvitations)
      .orderBy(studentInvitations.createdAt)
    return ok(invitations)
  } catch (dbError) {
    console.error("Database error during student invitations listing:", dbError)
    return err({ type: "database_error" })
  }
}
