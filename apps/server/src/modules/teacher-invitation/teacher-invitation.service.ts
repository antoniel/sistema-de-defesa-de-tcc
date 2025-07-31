import * as bcrypt from "bcryptjs"
import crypto from "crypto"
import { and, eq } from "drizzle-orm"
import { type Context } from "hono"
import { env } from "../../config/env"
import { invitations, teacherInvitations, Users, type SelectInvitation, type SelectTeacherInvitation, type UserRole } from "../../database/schema"
import { err, ok, type AppResult } from "../../result"
import { createTeacherInvitationEmail, createStudentInvitationEmail, sendEmail } from "../../services/email.service"
import { type AppVariables } from "../../types"

interface CreateInvitationInput {
  email: string
  nome: string
  role: UserRole
}

interface CreateTeacherInvitationInput {
  email: string
  nome: string
}

interface CreateTeacherInvitationResponse {
  invitationId: number
  invitationHash: string
}

type CreateTeacherInvitationServiceError =
  | { type: "duplicate_email" }
  | { type: "existing_invitation" }
  | { type: "database_error" }
  | { type: "email_error" }

const createInvitationService = async (
  c: Context<{ Variables: AppVariables }>,
  input: CreateInvitationInput
): Promise<AppResult<CreateTeacherInvitationResponse, CreateTeacherInvitationServiceError>> => {
  const dbInstance = c.get("db")
  const adminUser = c.get("jwtPayload")

  if (!adminUser) {
    return err({ type: "database_error" })
  }

  try {
    // Check if user already exists
    const existingUser = await dbInstance
      .select({ id: Users.id })
      .from(Users)
      .where(eq(Users.email, input.email))
      .limit(1)

    if (existingUser.length > 0) {
      return err({ type: "duplicate_email" })
    }

    // Check if there's already a pending invitation
    const existingInvitation = await dbInstance
      .select({ id: invitations.id })
      .from(invitations)
      .where(and(eq(invitations.email, input.email), eq(invitations.status, "pending")))
      .limit(1)

    if (existingInvitation.length > 0) {
      return err({ type: "existing_invitation" })
    }

    // Generate invitation hash
    const invitationHash = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Create invitation
    const newInvitation = await dbInstance
      .insert(invitations)
      .values({
        email: input.email,
        nome: input.nome,
        role: input.role,
        invitationHash,
        expiresAt,
        invitedBy: Number(adminUser.sub),
        status: "pending",
      })
      .returning({ insertedId: invitations.id })

    const insertedInvitation = newInvitation[0]
    if (!insertedInvitation || !insertedInvitation.insertedId) {
      return err({ type: "database_error" })
    }

    console.log(`Teacher invitation created: ${input.email}, ID: ${insertedInvitation.insertedId}`)

    // Send invitation email
    const invitationUrl = `${env.FRONTEND_URL || "http://localhost:5173"}/${input.role === "TEACHER" ? "teacher" : "student"}-invitation/${invitationHash}`
    const emailHtml = input.role === "TEACHER" 
      ? createTeacherInvitationEmail(input.nome, invitationUrl)
      : createStudentInvitationEmail(input.nome, invitationUrl)

    const emailResult = await sendEmail({
      to: input.email,
      subject: input.role === "TEACHER" ? "Convite para Professor - Sistema Banca" : "Convite para Aluno - Sistema Banca",
      html: emailHtml,
    })

    if (!emailResult.ok) {
      // Log error but don't fail the invitation creation
      console.error("Failed to send invitation email:", emailResult.error)
      // In a production system, you might want to queue this for retry
    }

    return ok({
      invitationId: insertedInvitation.insertedId,
      invitationHash,
    })
  } catch (dbError) {
    console.error("Database error during invitation creation:", dbError)
    return err({ type: "database_error" })
  }
}

export const createTeacherInvitationService = async (
  c: Context<{ Variables: AppVariables }>,
  input: CreateTeacherInvitationInput
): Promise<AppResult<CreateTeacherInvitationResponse, CreateTeacherInvitationServiceError>> => {
  return createInvitationService(c, { ...input, role: "TEACHER" })
}

export const createStudentInvitationService = async (
  c: Context<{ Variables: AppVariables }>,
  input: CreateTeacherInvitationInput // Same interface for now
): Promise<AppResult<CreateTeacherInvitationResponse, CreateTeacherInvitationServiceError>> => {
  return createInvitationService(c, { ...input, role: "STUDENT" })
}

interface TeacherInvitationDetails {
  email: string
  nome: string
  status: string
  expiresAt: Date
}

type VerifyTeacherInvitationServiceError =
  | { type: "invitation_not_found" }
  | { type: "invitation_expired" }
  | { type: "invitation_already_used" }
  | { type: "database_error" }

export const verifyTeacherInvitationService = async (
  c: Context<{ Variables: AppVariables }>,
  hash: string
): Promise<AppResult<TeacherInvitationDetails, VerifyTeacherInvitationServiceError>> => {
  const dbInstance = c.get("db")

  try {
    const invitation = await dbInstance
      .select({
        email: invitations.email,
        nome: invitations.nome,
        status: invitations.status,
        expiresAt: invitations.expiresAt,
      })
      .from(invitations)
      .where(eq(invitations.invitationHash, hash))
      .limit(1)

    if (invitation.length === 0) {
      return err({ type: "invitation_not_found" })
    }

    const invitationData = invitation[0]

    if (invitationData.status === "used") {
      return err({ type: "invitation_already_used" })
    }

    if (invitationData.expiresAt < new Date()) {
      // Mark as expired
      await dbInstance
        .update(invitations)
        .set({ status: "expired" })
        .where(eq(invitations.invitationHash, hash))

      return err({ type: "invitation_expired" })
    }

    return ok({
      email: invitationData.email,
      nome: invitationData.nome,
      status: invitationData.status,
      expiresAt: invitationData.expiresAt,
    })
  } catch (dbError) {
    console.error("Database error during teacher invitation verification:", dbError)
    return err({ type: "database_error" })
  }
}

interface AcceptTeacherInvitationInput {
  invitationHash: string
  password: string
  school: string
  academicTitle: string
  matricula: string
}

interface AcceptTeacherInvitationResponse {
  userId: number
}

type AcceptTeacherInvitationServiceError =
  | { type: "invitation_not_found" }
  | { type: "invitation_expired" }
  | { type: "invitation_already_used" }
  | { type: "hashing_error" }
  | { type: "database_error" }

const acceptInvitationService = async (
  c: Context<{ Variables: AppVariables }>,
  input: AcceptTeacherInvitationInput,
  role: UserRole
): Promise<AppResult<AcceptTeacherInvitationResponse, AcceptTeacherInvitationServiceError>> => {
  const dbInstance = c.get("db")

  try {
    // First verify the invitation
    const verificationResult = await verifyTeacherInvitationService(c, input.invitationHash)
    if (!verificationResult.ok) {
      return err(verificationResult.error)
    }

    const invitationDetails = verificationResult.data

    // Hash password
    let passwordHash: string
    try {
      passwordHash = await bcrypt.hash(input.password, 10)
    } catch (hashError) {
      console.error("Password hashing failed:", hashError)
      return err({ type: "hashing_error" })
    }

    // Create teacher user
    const now = new Date()
    const newUser = await dbInstance
      .insert(Users)
      .values({
        passwordHash,
        email: invitationDetails.email,
        nome: invitationDetails.nome,
        school: input.school,
        academicTitle: input.academicTitle,
        matricula: input.matricula,
        createdAt: now,
        updatedAt: now,
        role: role,
      })
      .returning({ insertedId: Users.id })

    const insertedUser = newUser[0]
    if (!insertedUser || !insertedUser.insertedId) {
      return err({ type: "database_error" })
    }

    // Mark invitation as used and link to user
    await dbInstance
      .update(invitations)
      .set({
        status: "used",
        userId: insertedUser.insertedId,
      })
      .where(eq(invitations.invitationHash, input.invitationHash))

    console.log(`${role} account created: ${invitationDetails.email}, ID: ${insertedUser.insertedId}`)

    return ok({ userId: insertedUser.insertedId })
  } catch (dbError) {
    console.error(`Database error during ${role.toLowerCase()} invitation acceptance:`, dbError)
    return err({ type: "database_error" })
  }
}

export const acceptTeacherInvitationService = async (
  c: Context<{ Variables: AppVariables }>,
  input: AcceptTeacherInvitationInput
): Promise<AppResult<AcceptTeacherInvitationResponse, AcceptTeacherInvitationServiceError>> => {
  return acceptInvitationService(c, input, "TEACHER")
}

export const acceptStudentInvitationService = async (
  c: Context<{ Variables: AppVariables }>,
  input: AcceptTeacherInvitationInput // Same interface for now
): Promise<AppResult<AcceptTeacherInvitationResponse, AcceptTeacherInvitationServiceError>> => {
  return acceptInvitationService(c, input, "STUDENT")
}

export const listTeacherInvitationsService = async (
  c: Context<{ Variables: AppVariables }>
): Promise<AppResult<SelectTeacherInvitation[], { type: "database_error" }>> => {
  const dbInstance = c.get("db")

  try {
    const teacherInvitationsList = await dbInstance
      .select()
      .from(invitations)
      .where(eq(invitations.role, "TEACHER"))
      .orderBy(invitations.createdAt)

    return ok(teacherInvitationsList)
  } catch (dbError) {
    console.error("Database error during teacher invitations listing:", dbError)
    return err({ type: "database_error" })
  }
}

export const listStudentInvitationsService = async (
  c: Context<{ Variables: AppVariables }>
): Promise<AppResult<SelectInvitation[], { type: "database_error" }>> => {
  const dbInstance = c.get("db")

  try {
    const studentInvitationsList = await dbInstance
      .select()
      .from(invitations)
      .where(eq(invitations.role, "STUDENT"))
      .orderBy(invitations.createdAt)

    return ok(studentInvitationsList)
  } catch (dbError) {
    console.error("Database error during student invitations listing:", dbError)
    return err({ type: "database_error" })
  }
}

export const listAllInvitationsService = async (
  c: Context<{ Variables: AppVariables }>
): Promise<AppResult<SelectInvitation[], { type: "database_error" }>> => {
  const dbInstance = c.get("db")

  try {
    const allInvitations = await dbInstance
      .select()
      .from(invitations)
      .orderBy(invitations.createdAt)

    return ok(allInvitations)
  } catch (dbError) {
    console.error("Database error during invitations listing:", dbError)
    return err({ type: "database_error" })
  }
}
