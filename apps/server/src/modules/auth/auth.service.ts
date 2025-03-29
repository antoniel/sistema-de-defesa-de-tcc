import * as bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { Context } from "hono"
import { HTTPException } from "hono/http-exception"
import { sign } from "hono/jwt"
import { usuarios } from "../../database/schema"
import { AppVariables } from "../../types"
import { JWT_AUDIENCE, JWT_EXPIRY_SECONDS, JWT_ISSUER, JWT_SECRET } from "./jwt"

interface LoginResponse {
  id: number
  token: string
  role: string
  name: string
}

/**
 * Logs in a user by verifying email and password, then generates JWT.
 * Refresh token logic has been removed based on user requirement.
 * @param c - Hono Context
 * @param email - User's email
 * @param password - User's plaintext password
 * @returns Promise<LoginResponse>
 * @throws HTTPException for various error conditions
 */
export const loginUserService = async (
  c: Context<{ Variables: AppVariables }>,
  email: string,
  password: string
): Promise<LoginResponse> => {
  const dbInstance = c.get("db") // Get DB instance from context

  const potentialUsers = await dbInstance.select().from(usuarios).where(eq(usuarios.email, email)).limit(1)

  const user = potentialUsers[0]

  if (!user) {
    console.log(`Login attempt failed: User not found for email ${email}`)
    throw new HTTPException(403, { message: "Credenciais inválidas." }) // Generic message for security
  }

  if (user.status !== "active") {
    console.log(`Login attempt failed: User ${email} is inactive.`)
    throw new HTTPException(403, { message: "Usuário inativo." })
  }

  if (!user.passwordHash) {
    console.error(`Login attempt failed: User ${email} has no password hash set.`)
    throw new HTTPException(403, { message: "Credenciais inválidas." }) // Or internal error?
  }

  const passwordIsValid = await bcrypt.compare(password, user.passwordHash)

  if (!passwordIsValid) {
    console.log(`Login attempt failed: Invalid password for user ${email}`)
    throw new HTTPException(403, { message: "Credenciais inválidas." })
  }

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: JWT_ISSUER,
    aud: JWT_AUDIENCE,
    sub: user.id.toString(), // Subject (user ID)
    // Add other claims like role if needed: role: user.role,
    iat: now,
    exp: now + JWT_EXPIRY_SECONDS,
  }

  let token: string
  try {
    token = await sign(payload, JWT_SECRET)
  } catch (jwtError) {
    console.error("JWT signing error:", jwtError)
    throw new HTTPException(500, { message: "Não foi possível gerar o token de autenticação." })
  }

  return {
    id: user.id,
    token: token,
    role: user.role,
    name: user.nome,
  }
}
