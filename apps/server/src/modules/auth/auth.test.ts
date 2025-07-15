import { eq } from "drizzle-orm"
import { testClient } from "hono/testing"
import { beforeEach, describe, expect, it } from "vitest"
import { app } from "../.."
import { Users } from "../../database/schema"
import { fakeDeps, getFakeDb } from "../../tests/utils"
import { type RegisterUserInput } from "./auth.schema"
import { TEST_USER_BASIC, createTestUserWithPasswordHash } from "@tcc/tests"

describe("Auth Routes", async () => {
  const db = await getFakeDb()
  const client = testClient(app(fakeDeps(db)))

  beforeEach(async () => {
    const testUserWithHash = await createTestUserWithPasswordHash(TEST_USER_BASIC)
    await db.insert(Users).values(testUserWithHash)

  })
  afterEach(async () => {
    await db.delete(Users)
  })

  it("should allow login with valid credentials", async () => {
    const response = await client.auth.login.$post({
      json: {
        email: TEST_USER_BASIC.email,
        password: TEST_USER_BASIC.password,
      },
    })

    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data).toHaveProperty("token")
    expect(data).toHaveProperty("id")
    expect(data).toHaveProperty("role", TEST_USER_BASIC.role)
    expect(data).toHaveProperty("name", TEST_USER_BASIC.nome)
  })

  it("should reject login with invalid password", async () => {
    const response = await client.auth.login.$post({
      json: {
        email: TEST_USER_BASIC.email,
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
        password: TEST_USER_BASIC.password,
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
        password: TEST_USER_BASIC.password,
      },
    })

    expect(response.status).toBe(400)
  })
})

// Added registration tests
describe("Auth Register Routes", async () => {
  const db = await getFakeDb()
  const client = testClient(app(fakeDeps(db)))

  // Clean DB before each test in this suite
  beforeEach(async () => {
    await db.delete(Users)
  })

  const newUser: RegisterUserInput = {
    email: "newuser@example.com",
    password: "NewPassword123!",
    nome: "New User",
    school: "New School",
    academicTitle: "MSc",
    matricula: "123",
  }

  it("should register a new user with valid data", async () => {
    const response = await client.auth.register.$post({
      json: newUser,
    })

    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data).toHaveProperty("userId")
    const userId = data.userId

    // Verify in DB
    const [dbUser] = await db.select().from(Users).where(eq(Users.id, userId)).limit(1)
    expect(dbUser.email).toBe(newUser.email)
    expect(dbUser.nome).toBe(newUser.nome)
    expect(dbUser.role).toBe("STUDENT")
    expect(dbUser.passwordHash).not.toBe(newUser.password)
    // Password should be hashed (we'd need bcrypt to verify this, but for now just check it's not plaintext)
    expect(dbUser.passwordHash).toBeTruthy()
    expect(dbUser.passwordHash).not.toBe(newUser.password)
  })

  it("should reject registration with duplicate email", async () => {
    // Insert a user first
    await client.auth.register.$post({ json: newUser })

    // Attempt to register again with the same email
    const response = await client.auth.register.$post({
      json: newUser,
    })

    expect(response.status).toBe(409)
    const data = await response.json()
    expect(data).toHaveProperty("message", "Este email já está em uso.")
  })
})
