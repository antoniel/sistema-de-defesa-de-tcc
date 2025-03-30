import * as bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { testClient } from "hono/testing"
import { beforeEach, describe, expect, it } from "vitest"
import { app } from "../.."
import { usuarios } from "../../database/schema"
import { fakeDeps, getFakeDb } from "../../tests/utils"

const TEST_USER = {
  username: "testuser",
  email: "test@example.com",
  password: "Password123!",
  passwordHash: "",
  nome: "Test User",
  school: "Test School",
  academicTitle: "PhD",
  role: "professor",
}

describe("Auth Routes", async () => {
  const db = await getFakeDb()
  const client = testClient(app(fakeDeps(db)))

  beforeEach(async () => {
    TEST_USER.passwordHash = await bcrypt.hash(TEST_USER.password, 10)
    await db.insert(usuarios).values({
      username: TEST_USER.username,
      email: TEST_USER.email,
      passwordHash: TEST_USER.passwordHash,
      authKey: "test-auth-key-" + Date.now(),
      nome: TEST_USER.nome,
      school: TEST_USER.school,
      academicTitle: TEST_USER.academicTitle,
      role: TEST_USER.role,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  })
  afterEach(async () => {
    await db.delete(usuarios)
  })

  it("should allow login with valid credentials", async () => {
    const response = await client.auth.login.$post({
      json: {
        email: TEST_USER.email,
        password: TEST_USER.password,
      },
    })

    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data).toHaveProperty("token")
    expect(data).toHaveProperty("id")
    expect(data).toHaveProperty("role", TEST_USER.role)
    expect(data).toHaveProperty("name", TEST_USER.nome)
  })

  it("should reject login with invalid password", async () => {
    const response = await client.auth.login.$post({
      json: {
        email: TEST_USER.email,
        password: "WrongPassword123!",
      },
    })

    expect(response.status).toBe(403)
    const data = await response.json()
    expect(data).toHaveProperty("message", "Usuário ou senha inválidos.")
  })

  it("should reject login with non-existent email", async () => {
    const response = await client.auth.login.$post({
      json: {
        email: "nonexistent@example.com",
        password: TEST_USER.password,
      },
    })

    expect(response.status).toBe(403)
    const data = await response.json()
    expect(data).toHaveProperty("message", "Usuário ou senha inválidos.")
  })

  it("should validate login inputs", async () => {
    const response = await client.auth.login.$post({
      json: {
        email: "not-an-email",
        password: TEST_USER.password,
      },
    })

    expect(response.status).toBe(400)
  })

  it("should reject login for inactive user", async () => {
    await db.update(usuarios).set({ status: "inactive" }).where(eq(usuarios.email, TEST_USER.email))

    const response = await client.auth.login.$post({
      json: {
        email: TEST_USER.email,
        password: TEST_USER.password,
      },
    })

    expect(response.status).toBe(403)
    const data = await response.json()
    expect(data).toHaveProperty("message", "Seu usuário está inativo.")
  })
})
