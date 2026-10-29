import * as bcrypt from "bcryptjs"
import { and, eq, gte } from "drizzle-orm"
import { type Context } from "hono"
import { sign } from "hono/jwt"
import { env } from "../../config/env"
import { invites, resetPasswords, Users, type SelectUser } from "../../database/schema"
import { generateResetToken, hashResetToken, resetTokenHashesMatch } from "../../lib/reset-token"
import { err, ok, type AppResult } from "../../result"
import { createPasswordResetEmail, sendEmail } from "../../services/email.service"
import { type AppVariables } from "../../types"
import { publicUserColumns, type PublicUser } from "../usuario/usuario.service"
import { type RegisterUserInput } from "./auth.schema"
import { JWT_AUDIENCE, JWT_EXPIRY_SECONDS, JWT_ISSUER, JWT_SECRET } from "./jwt"

export const getUserService = async (c: Context<{ Variables: AppVariables }>) => {
  const dbInstance = c.get("db")
  const user = await dbInstance
    .select(publicUserColumns)
    .from(Users)
    .where(eq(Users.id, Number(c.get("jwtPayload").sub)))
  return ok(user)
}

interface LoginResponse {
  id: number
  token: string
  role: string
  name: string
  user: PublicUser
}

type LoginUserServiceError =
  | { type: "invalid_credentials" }
  | { type: "inactive_user" }
  | { type: "no_password_hash" }
  | { type: "jwt_signing_error" }
  | { type: "database_error" }

export const loginUserService = async (
  c: Context<{ Variables: AppVariables }>,
  email: string,
  password: string
): Promise<AppResult<LoginResponse, LoginUserServiceError>> => {
  const dbInstance = c.get("db")

  try {
    const [user] = await dbInstance.select().from(Users).where(eq(Users.email, email)).limit(1)

    if (!user) {
      console.log(`Login attempt failed: User not found for email ${email}`)
      return err({ type: "invalid_credentials" })
    }

    if (!user.passwordHash) {
      console.error(`Login attempt failed: User ${email} has no password hash set.`)
      return err({ type: "no_password_hash" })
    }

    const passwordIsValid = await bcrypt.compare(password, user.passwordHash)

    if (!passwordIsValid) {
      console.log(`Login attempt failed: Invalid password for user ${email}`)
      return err({ type: "invalid_credentials" })
    }

    const now = Math.floor(Date.now() / 1000)
    const payload = {
      iss: JWT_ISSUER,
      aud: JWT_AUDIENCE,
      sub: user.id.toString(),
      iat: now,
      exp: now + JWT_EXPIRY_SECONDS,
    }

    let token: string
    try {
      token = await sign(payload, JWT_SECRET)
    } catch (jwtError) {
      console.error("JWT signing error:", jwtError)
      return err({ type: "jwt_signing_error" })
    }

    return ok({
      id: user.id,
      token: token,
      role: user.role,
      name: user.nome,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        school: user.school,
        matricula: user.matricula,
        academicTitle: user.academicTitle,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    })
  } catch (dbError) {
    console.error("Database error during login:", dbError)
    return err({ type: "database_error" })
  }
}

type RequestPasswordResetServiceError = { type: "database_error" }

export const requestPasswordResetService = async (
  c: Context<{ Variables: AppVariables }>,
  email: string
): Promise<AppResult<void, RequestPasswordResetServiceError>> => {
  const dbInstance = c.get("db")

  try {
    const potentialUsers = await dbInstance
      .select({ id: Users.id, nome: Users.nome })
      .from(Users)
      .where(eq(Users.email, email))
      .limit(1)
    const user = potentialUsers[0]

    if (!user) {
      return ok(undefined)
    }

    const resetToken = generateResetToken()
    const expiryMinutes = 60
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000)

    try {
      // Only one active token per user: invalidate previous requests.
      await dbInstance.delete(resetPasswords).where(eq(resetPasswords.userId, user.id))

      // Store only the derived hash of the token, never the token itself.
      await dbInstance.insert(resetPasswords).values({
        userId: user.id,
        resetPasswordHash: hashResetToken(resetToken),
        expiresAt: expiresAt,
      })

      const resetUrl = `${env.FRONTEND_URL || "http://localhost:5173"}/reset-password/${resetToken}`
      const emailResult = await sendEmail({
        to: email,
        subject: "Recuperação de Senha - Sistema Banca",
        html: createPasswordResetEmail(user.nome, resetUrl),
      })

      if (!emailResult.ok) {
        console.error(`Failed to send password reset email for ${email}:`, emailResult.error)
      }

      return ok(undefined)
    } catch (error) {
      console.error(`Error during password reset db operations for ${email}:`, error)

      return ok(undefined)
    }
  } catch (outerDbError) {
    console.error(`Outer DB error during password reset request for ${email}:`, outerDbError)
    return ok(undefined)
  }
}

type VerifyResetHashServiceError = { type: "token_expired" } | { type: "token_invalid" } | { type: "database_error" }

export const verifyResetHashService = async (
  c: Context<{ Variables: AppVariables }>,
  hash: string
): Promise<AppResult<{ valid: boolean }, VerifyResetHashServiceError>> => {
  const dbInstance = c.get("db")
  const tokenHash = hashResetToken(hash)

  try {
    const potentialResets = await dbInstance
      .select({ id: resetPasswords.id, resetPasswordHash: resetPasswords.resetPasswordHash })
      .from(resetPasswords)
      .where(and(eq(resetPasswords.resetPasswordHash, tokenHash), gte(resetPasswords.expiresAt, new Date())))
      .limit(1)

    const resetRecord = potentialResets[0]

    if (!resetRecord || !resetTokenHashesMatch(resetRecord.resetPasswordHash, tokenHash)) {
      const expiredCheck = await dbInstance
        .select({ id: resetPasswords.id })
        .from(resetPasswords)
        .where(eq(resetPasswords.resetPasswordHash, tokenHash))
        .limit(1)
      if (expiredCheck[0]) {
        try {
          await dbInstance.delete(resetPasswords).where(eq(resetPasswords.resetPasswordHash, tokenHash))
          console.log("Cleaned up expired reset token.")
        } catch (cleanupError) {
          console.error("Error cleaning up expired reset token:", cleanupError)
        }
        return err({ type: "token_expired" })
      }
      return err({ type: "token_invalid" })
    }

    return ok({ valid: true })
  } catch (dbError) {
    console.error("Database error during reset hash verification:", dbError)
    return err({ type: "database_error" })
  }
}

type ResetPasswordServiceError =
  | { type: "token_invalid_or_expired" }
  | { type: "hashing_error" }
  | { type: "user_not_found" }
  | { type: "update_error" }
  | { type: "database_error" }

export const resetPasswordService = async (
  c: Context<{ Variables: AppVariables }>,
  hash: string,
  newPassword: string
): Promise<AppResult<void, ResetPasswordServiceError>> => {
  const dbInstance = c.get("db")
  const tokenHash = hashResetToken(hash)

  try {
    const potentialResets = await dbInstance
      .select({ userId: resetPasswords.userId, resetPasswordHash: resetPasswords.resetPasswordHash })
      .from(resetPasswords)
      .where(and(eq(resetPasswords.resetPasswordHash, tokenHash), gte(resetPasswords.expiresAt, new Date())))
      .limit(1)

    const resetRecord = potentialResets[0]

    if (!resetRecord || !resetTokenHashesMatch(resetRecord.resetPasswordHash, tokenHash)) {
      console.log("Password reset failed: token not found or expired during reset attempt.")

      return err({ type: "token_invalid_or_expired" })
    }

    let newPasswordHash: string
    try {
      newPasswordHash = await bcrypt.hash(newPassword, 10)
    } catch (hashError) {
      console.error("Password hashing failed during reset:", hashError)
      return err({ type: "hashing_error" })
    }

    try {
      const userId = resetRecord.userId

      const updateResult = await dbInstance
        .update(Users)
        .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
        .where(eq(Users.id, userId))

      if (updateResult.rowCount === 0) {
        console.error(`Password reset failed: User with ID ${userId} not found during update.`)

        return err({ type: "user_not_found" })
      }

      console.log(`Password successfully reset for user ID: ${userId}`)

      await dbInstance.delete(resetPasswords).where(eq(resetPasswords.resetPasswordHash, tokenHash))

      return ok(undefined)
    } catch (error) {
      console.error(`Error updating password or deleting reset token for user ID ${resetRecord.userId}:`, error)
      return err({ type: "update_error" })
    }
  } catch (dbError) {
    console.error("Database error during password reset:", dbError)
    return err({ type: "database_error" })
  }
}

interface InviteDetails {
  emailConvidado: string | null
  roleConvidado: string | null
  bancaId: number | null
  status: string
}

type VerifyInviteHashServiceError =
  | { type: "invite_not_found" }
  | { type: "invite_not_pending"; status: string }
  | { type: "database_error" }

export const verifyInviteHashService = async (
  c: Context<{ Variables: AppVariables }>,
  hash: string
): Promise<AppResult<InviteDetails, VerifyInviteHashServiceError>> => {
  const dbInstance = c.get("db")
  console.log(`Verifying invite hash: ${hash}`)

  try {
    const potentialInvites = await dbInstance
      .select({
        emailConvidado: invites.emailConvidado,
        roleConvidado: invites.roleConvidado,
        bancaId: invites.bancaId,
        status: invites.status,
      })
      .from(invites)
      .where(eq(invites.inviteHash, hash))
      .limit(1)

    const inviteRecord = potentialInvites[0]

    if (!inviteRecord) {
      console.log(`Invite hash verification failed: Hash ${hash} not found.`)
      return err({ type: "invite_not_found" })
    }

    if (inviteRecord.status !== "pending") {
      console.log(`Invite hash verification failed: Invite ${hash} has status ${inviteRecord.status}.`)

      return err({ type: "invite_not_pending", status: inviteRecord.status ?? "unknown" })
    }

    console.log(`Invite hash verification successful for hash: ${hash}`)

    const details: InviteDetails = {
      emailConvidado: inviteRecord.emailConvidado,
      roleConvidado: inviteRecord.roleConvidado,
      bancaId: inviteRecord.bancaId,
      status: inviteRecord.status,
    }
    return ok(details)
  } catch (dbError) {
    console.error("Database error during invite hash verification:", dbError)
    return err({ type: "database_error" })
  }
}

interface RegisterUserResponse {
  userId: number
}

type RegisterUserServiceError =
  | { type: "duplicate_email" }
  | { type: "duplicate_username" }
  | { type: "hashing_error" }
  | { type: "database_error" }

// --- Register User Service ---
export const registerUserService = async (
  c: Context<{ Variables: AppVariables }>,
  userData: RegisterUserInput
): Promise<AppResult<RegisterUserResponse, RegisterUserServiceError>> => {
  const dbInstance = c.get("db")
  const { email, password, nome, school, academicTitle } = userData

  try {
    // Check for duplicate email
    const existingEmail = await dbInstance.select({ id: Users.id }).from(Users).where(eq(Users.email, email)).limit(1)
    console.log("existingEmail", existingEmail, email, existingEmail.length)

    if (existingEmail.length > 0) {
      console.log(`Registration failed: Email ${email} already exists.`)
      return err({ type: "duplicate_email" })
    }

    // Check for duplicate username
    const existingUsername = await dbInstance
      .select({ id: Users.id })
      .from(Users)
      .where(eq(Users.email, email))
      .limit(1)

    if (existingUsername.length > 0) {
      console.log(`Registration failed: Username ${email} already exists.`)
      return err({ type: "duplicate_username" })
    }

    // Hash password
    let passwordHash: string
    try {
      passwordHash = await bcrypt.hash(password, 10)
    } catch (hashError) {
      console.error("Password hashing failed during registration:", hashError)
      return err({ type: "hashing_error" })
    }

    // Insert new user
    const now = new Date()
    const newUserResult = await dbInstance
      .insert(Users)
      .values({
        passwordHash: passwordHash,
        email: email,
        nome: nome,
        school: school,
        academicTitle: academicTitle,
        matricula: userData.matricula,
        createdAt: now,
        updatedAt: now,
        role: "STUDENT",
      })
      .returning({ insertedId: Users.id })

    const insertedUser = newUserResult[0]
    if (!insertedUser || !insertedUser.insertedId) {
      console.error("Failed to insert user or retrieve ID after insert.")
      return err({ type: "database_error" })
    }

    console.log(`User registered successfully: ${email}, ID: ${insertedUser.insertedId}`)
    return ok({ userId: insertedUser.insertedId })
  } catch (dbError) {
    console.error("Database error during registration:", dbError)
    return err({ type: "database_error" })
  }
}
