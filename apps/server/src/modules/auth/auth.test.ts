import * as bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { testClient } from "hono/testing"
import { beforeEach, describe, expect, it } from "vitest"
import { app } from "../.."
import { UserRole, Users } from "../../database/schema"
import { fakeDeps, getFakeDb } from "../../tests/utils"
import { RegisterUserInput } from "./auth.schema"

const TEST_USER = {
  username: "testuser",
  email: "test@example.com",
  password: "Password123!",
  passwordHash: "",
  nome: "Test User",
  school: "Test School",
  academicTitle: "PhD",
  role: "TEACHER" as UserRole,
}

describe("Auth Routes", async () => {
  const db = await getFakeDb()
  const client = testClient(app(fakeDeps(db)))

  beforeEach(async () => {
    TEST_USER.passwordHash = await bcrypt.hash(TEST_USER.password, 10)
    await db.insert(Users).values({
      status: "ACTIVE",
      email: TEST_USER.email,
      passwordHash: TEST_USER.passwordHash,
      nome: TEST_USER.nome,
      school: TEST_USER.school,
      academicTitle: TEST_USER.academicTitle,
      role: TEST_USER.role,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  })
  afterEach(async () => {
    await db.delete(Users)
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
    status: "ACTIVE",
    email: "newuser@example.com",
    password: "NewPassword123!",
    nome: "New User",
    school: "New School",
    academicTitle: "MSc",
    lattesUrl: "http://lattes.cnpq.br/123456",
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
    const isPasswordCorrect = await bcrypt.compare(newUser.password, dbUser.passwordHash ?? "")
    expect(isPasswordCorrect).toBe(true)
    expect(dbUser.lattesUrl).toBe(newUser.lattesUrl)
  })

  it("should register a user without optional lattesUrl", async () => {
    const { lattesUrl, ...userWithoutLattes } = newUser
    const response = await client.auth.register.$post({
      json: userWithoutLattes,
    })

    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data).toHaveProperty("userId")

    const [dbUser] = await db.select().from(Users).where(eq(Users.id, data.userId)).limit(1)
    expect(dbUser.lattesUrl).toBeNull()
  })

  it("should reject registration with duplicate email", async () => {
    // Insert a user first
    await client.auth.register.$post({ json: newUser })

    // Attempt to register again with the same email
    const response = await client.auth.register.$post({
      json: { ...newUser, email: "another@example.com" },
    })

    expect(response.status).toBe(409)
    const data = await response.json()
    expect(data).toHaveProperty("message", "Este email já está em uso.")
  })

  it("should reject registration with duplicate username", async () => {
    // Insert a user first
    await client.auth.register.$post({ json: newUser })

    // Attempt to register again with the same username
    const response = await client.auth.register.$post({
      json: { ...newUser, email: "another@example.com" },
    })

    expect(response.status).toBe(409)
    const data = await response.json()
    expect(data).toHaveProperty("message", "Este nome de usuário já está em uso.")
  })

  it("should validate registration inputs (e.g., short password)", async () => {
    const response = await client.auth.register.$post({
      json: { ...newUser, password: "short" },
    })

    expect(response.status).toBe(400) // Zod validation error
  })

  it("should validate registration inputs (e.g., invalid email)", async () => {
    const response = await client.auth.register.$post({
      json: { ...newUser, email: "not-an-email" },
    })

    expect(response.status).toBe(400) // Zod validation error
  })
})
