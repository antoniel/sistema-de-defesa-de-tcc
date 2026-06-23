import * as bcrypt from "bcryptjs"
import crypto from "crypto"
import { and, eq } from "drizzle-orm"
import { type Context } from "hono"
import { env } from "../../config/env"
import { teacherInvitations, Users, type SelectTeacherInvitation } from "../../database/schema"
import { err, ok, type AppResult } from "../../result"
import { createTeacherInvitationEmail, sendEmail } from "../../services/email.service"
import { type AppVariables } from "../../types"

interface CreateTeacherInvitationInput {
  email: string
  nome: string
}

interface CreateTeacherInvitationResponse {
  invitationId: number
  invitationHash: string
  userId: number
}

type CreateTeacherInvitationServiceError =
  | { type: "duplicate_email" }
  | { type: "existing_invitation" }
  | { type: "database_error" }
  | { type: "email_error" }

const buildUnusablePasswordHash = () => `!unusable!${crypto.randomBytes(32).toString("hex")}`

export const createTeacherInvitationService = async (
  c: Context<{ Variables: AppVariables }>,
  input: CreateTeacherInvitationInput
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
      .select({ id: teacherInvitations.id })
      .from(teacherInvitations)
      .where(and(eq(teacherInvitations.email, input.email), eq(teacherInvitations.status, "pending")))
      .limit(1)

    if (existingInvitation.length > 0) {
      return err({ type: "existing_invitation" })
    }

    // Generate invitation hash
    const invitationHash = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    const now = new Date()

    const [stubUser] = await dbInstance
      .insert(Users)
      .values({
        email: input.email,
        nome: input.nome,
        matricula: `EXT-${crypto.randomBytes(4).toString("hex")}`,
        passwordHash: buildUnusablePasswordHash(),
        school: "",
        academicTitle: "",
        role: "TEACHER",
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: Users.id })

    if (!stubUser) {
      return err({ type: "database_error" })
    }

    // Create invitation
    const newInvitation = await dbInstance
      .insert(teacherInvitations)
      .values({
        email: input.email,
        nome: input.nome,
        invitationHash,
        expiresAt,
        invitedBy: Number(adminUser.sub),
        status: "pending",
        userId: stubUser.id,
      })
      .returning({ insertedId: teacherInvitations.id })

    const insertedInvitation = newInvitation[0]
    if (!insertedInvitation || !insertedInvitation.insertedId) {
      return err({ type: "database_error" })
    }

    console.log(`Teacher invitation created: ${input.email}, ID: ${insertedInvitation.insertedId}`)

    // Send invitation email
    const invitationUrl = `${env.FRONTEND_URL || "http://localhost:5173"}/teacher-invitation/${invitationHash}`
    const emailHtml = createTeacherInvitationEmail(input.nome, invitationUrl)

    const emailResult = await sendEmail({
      to: input.email,
      subject: "Convite para Professor - Sistema Banca",
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
      userId: stubUser.id,
    })
  } catch (dbError) {
    console.error("Database error during teacher invitation creation:", dbError)
    return err({ type: "database_error" })
  }
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
        email: teacherInvitations.email,
        nome: teacherInvitations.nome,
        status: teacherInvitations.status,
        expiresAt: teacherInvitations.expiresAt,
      })
      .from(teacherInvitations)
      .where(eq(teacherInvitations.invitationHash, hash))
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
        .update(teacherInvitations)
        .set({ status: "expired" })
        .where(eq(teacherInvitations.invitationHash, hash))

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

export const acceptTeacherInvitationService = async (
  c: Context<{ Variables: AppVariables }>,
  input: AcceptTeacherInvitationInput
): Promise<AppResult<AcceptTeacherInvitationResponse, AcceptTeacherInvitationServiceError>> => {
  const dbInstance = c.get("db")

  try {
    const [invitation] = await dbInstance
      .select()
      .from(teacherInvitations)
      .where(eq(teacherInvitations.invitationHash, input.invitationHash))
      .limit(1)

    if (!invitation) {
      return err({ type: "invitation_not_found" })
    }

    if (invitation.status === "used") {
      return err({ type: "invitation_already_used" })
    }

    if (invitation.expiresAt < new Date()) {
      await dbInstance
        .update(teacherInvitations)
        .set({ status: "expired" })
        .where(eq(teacherInvitations.invitationHash, input.invitationHash))

      return err({ type: "invitation_expired" })
    }

    // Hash password
    let passwordHash: string
    try {
      passwordHash = await bcrypt.hash(input.password, 10)
    } catch (hashError) {
      console.error("Password hashing failed:", hashError)
      return err({ type: "hashing_error" })
    }

    const now = new Date()
    let userId: number

    if (invitation.userId) {
      await dbInstance
        .update(Users)
        .set({
          passwordHash,
          school: input.school,
          academicTitle: input.academicTitle,
          matricula: input.matricula,
          updatedAt: now,
        })
        .where(eq(Users.id, invitation.userId))

      userId = invitation.userId
    } else {
      const newUser = await dbInstance
        .insert(Users)
        .values({
          passwordHash,
          email: invitation.email,
          nome: invitation.nome,
          school: input.school,
          academicTitle: input.academicTitle,
          matricula: input.matricula,
          createdAt: now,
          updatedAt: now,
          role: "TEACHER",
        })
        .returning({ insertedId: Users.id })

      const insertedUser = newUser[0]
      if (!insertedUser?.insertedId) {
        return err({ type: "database_error" })
      }

      userId = insertedUser.insertedId
    }

    // Mark invitation as used and link to user
    await dbInstance
      .update(teacherInvitations)
      .set({
        status: "used",
        userId,
      })
      .where(eq(teacherInvitations.invitationHash, input.invitationHash))

    console.log(`Teacher account created: ${invitation.email}, ID: ${userId}`)

    return ok({ userId })
  } catch (dbError) {
    console.error("Database error during teacher invitation acceptance:", dbError)
    return err({ type: "database_error" })
  }
}

export const listTeacherInvitationsService = async (
  c: Context<{ Variables: AppVariables }>
): Promise<AppResult<SelectTeacherInvitation[], { type: "database_error" }>> => {
  const dbInstance = c.get("db")

  try {
    const invitations = await dbInstance.select().from(teacherInvitations).orderBy(teacherInvitations.createdAt)

    return ok(invitations)
  } catch (dbError) {
    console.error("Database error during teacher invitations listing:", dbError)
    return err({ type: "database_error" })
  }
}
