import * as bcrypt from "bcryptjs"
import crypto from "crypto"
import { and, eq, gte } from "drizzle-orm"
import { Context } from "hono"
import { sign } from "hono/jwt"
import { invites, resetPasswords, usuarios } from "../../database/schema"
import { AppResult, err, ok } from "../../result"
import { AppVariables } from "../../types"
import { JWT_AUDIENCE, JWT_EXPIRY_SECONDS, JWT_ISSUER, JWT_SECRET } from "./jwt"

interface LoginResponse {
  id: number
  token: string
  role: string
  name: string
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
    debugger
    const potentialUsers = await dbInstance.select().from(usuarios).where(eq(usuarios.email, email)).limit(1)
    const user = potentialUsers[0]

    if (!user) {
      console.log(`Login attempt failed: User not found for email ${email}`)
      return err({ type: "invalid_credentials" })
    }

    if (user.status !== "active") {
      console.log(`Login attempt failed: User ${email} is inactive.`)
      return err({ type: "inactive_user" })
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
  console.log(`Password reset requested for email: ${email}`)

  try {
    const potentialUsers = await dbInstance
      .select({ id: usuarios.id, status: usuarios.status })
      .from(usuarios)
      .where(eq(usuarios.email, email))
      .limit(1)
    const user = potentialUsers[0]

    if (!user || user.status !== "active") {
      console.log(`Password reset request failed: User not found or inactive for email ${email}`)

      return ok(undefined)
    }

    const resetToken = crypto.randomBytes(32).toString("hex")
    const expiryMinutes = 60
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000)

    try {
      await dbInstance.delete(resetPasswords).where(eq(resetPasswords.userId, user.id))

      await dbInstance.insert(resetPasswords).values({
        userId: user.id,
        resetPasswordHash: resetToken,
        expiresAt: expiresAt,
      })

      console.log(`Password reset token generated for user ID: ${user.id}`)

      const resetUrl = `https://your-frontend-url/reset-password/${resetToken}`
      console.log(`Reset URL (Email Placeholder): ${resetUrl}`)

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
  console.log(`Verifying reset hash: ${hash}`)

  try {
    const potentialResets = await dbInstance
      .select({ id: resetPasswords.id })
      .from(resetPasswords)
      .where(and(eq(resetPasswords.resetPasswordHash, hash), gte(resetPasswords.expiresAt, new Date())))
      .limit(1)

    const resetRecord = potentialResets[0]

    if (!resetRecord) {
      console.log(`Reset hash verification failed: Hash not found or expired.`)

      const expiredCheck = await dbInstance
        .select({ id: resetPasswords.id })
        .from(resetPasswords)
        .where(eq(resetPasswords.resetPasswordHash, hash))
        .limit(1)
      if (expiredCheck[0]) {
        try {
          await dbInstance.delete(resetPasswords).where(eq(resetPasswords.resetPasswordHash, hash))
          console.log(`Cleaned up expired reset token for hash: ${hash}`)
        } catch (cleanupError) {
          console.error("Error cleaning up expired reset token:", cleanupError)
        }
        return err({ type: "token_expired" })
      }
      return err({ type: "token_invalid" })
    }

    console.log(`Reset hash verification successful for hash: ${hash}`)
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
  console.log(`Attempting password reset with hash: ${hash}`)

  try {
    const potentialResets = await dbInstance
      .select({ userId: resetPasswords.userId })
      .from(resetPasswords)
      .where(and(eq(resetPasswords.resetPasswordHash, hash), gte(resetPasswords.expiresAt, new Date())))
      .limit(1)

    const resetRecord = potentialResets[0]

    if (!resetRecord) {
      console.log(`Password reset failed: Hash ${hash} not found or expired during reset attempt.`)

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
        .update(usuarios)
        .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
        .where(eq(usuarios.id, userId))

      if (updateResult.rowCount === 0) {
        console.error(`Password reset failed: User with ID ${userId} not found during update.`)

        return err({ type: "user_not_found" })
      }

      console.log(`Password successfully reset for user ID: ${userId}`)

      await dbInstance.delete(resetPasswords).where(eq(resetPasswords.resetPasswordHash, hash))
      console.log(`Reset token deleted for hash: ${hash}`)

      return ok(undefined)
    } catch (error) {
      console.error(`Error updating password or deleting reset token for hash ${hash}:`, error)
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

export const logoutUserService = async (_c: Context<{ Variables: AppVariables }>): Promise<AppResult<void, never>> => {
  console.log("Logout request received.")
  return ok(undefined)
}
