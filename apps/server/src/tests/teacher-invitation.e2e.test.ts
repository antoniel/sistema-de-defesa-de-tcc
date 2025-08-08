import { describe, it, expect, beforeAll } from "vitest"
import { app as createApp } from "../index"
import { fakeDeps, getFakeDb } from "./utils"
import { seedTestData } from "./seed-test-data"
import { sign } from "hono/jwt"
import { JWT_AUDIENCE, JWT_ISSUER, JWT_SECRET } from "../modules/auth/jwt"

const createAuthHeader = async (userId: number) => {
  const token = await sign(
    {
      iss: JWT_ISSUER,
      aud: JWT_AUDIENCE,
      sub: userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    },
    JWT_SECRET
  )
  return { Authorization: `Bearer ${token}` }
}

describe("Teacher Invitation Endpoints", () => {
  let testApp: ReturnType<typeof createApp>

  beforeAll(async () => {
    const db = await getFakeDb()
    await seedTestData(db)
    testApp = createApp(fakeDeps(db))
  })

  it("should create a teacher invitation and return invitation id", async () => {
    const headers = await createAuthHeader(1) // admin user from seed
    const res = await testApp.request("/teacher-invitation", {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: "newteacher@test.com", nome: "Novo Professor" }),
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.invitationId).toBeTruthy()
    expect(json.data.message).toBe("Convite enviado com sucesso")
  })

  it("should not allow duplicate invitation for same email if pending exists", async () => {
    const headers = await createAuthHeader(1)
    // first invite
    await testApp.request("/teacher-invitation", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ email: "dup@test.com", nome: "Professor Dup" }),
    })
    // second invite
    const res2 = await testApp.request("/teacher-invitation", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ email: "dup@test.com", nome: "Professor Dup" }),
    })

    expect(res2.status).toBe(400)
    const json2 = await res2.json()
    expect(json2.message).toBe("Já existe um convite pendente para este email")
  })
})