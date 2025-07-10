import { describe, expect, it, beforeEach } from "vitest"
import { testClient } from "hono/testing"
import { app } from "../index"
import { fakeDeps, getFakeDb } from "./utils"
import { Users, Bancas, Cursos } from "../database/schema"
import * as bcrypt from "bcryptjs"

describe("Endpoint Security Tests", () => {
  let db: any
  let client: any

  beforeEach(async () => {
    db = await getFakeDb()
    client = testClient(app(fakeDeps(db)))

    // Limpar banco de dados
    await db.delete(Users)
    await db.delete(Bancas)
    await db.delete(Cursos)

    // Criar curso de teste
    await db.insert(Cursos).values({
      id: 1,
      nome: "Ciência da Computação",
      sigla: "BCC",
    })
  })

  describe("Authentication Requirements", () => {
    it("should require authentication for protected endpoints", async () => {
      const protectedEndpoints = [
        { path: "usuario.me", method: "get" },
        { path: "usuario.all", method: "get" },
        { path: "banca.my-defenses", method: "get" },
      ]

      for (const endpoint of protectedEndpoints) {
        const response = await client[endpoint.path][endpoint.method]()
        expect(response.status).toBe(401)
      }
    })

    it("should allow public access to unprotected endpoints", async () => {
      const publicEndpoints = [
        { path: "banca", method: "get" },
        { path: "banca.1", method: "get" },
        { path: "auth.login", method: "post" },
      ]

      for (const endpoint of publicEndpoints) {
        const response = await client[endpoint.path][endpoint.method]()
        // Should not return 401 (Unauthorized)
        expect(response.status).not.toBe(401)
      }
    })
  })

  describe("Role-Based Access Control", () => {
    let adminUser: any
    let teacherUser: any
    let studentUser: any

    beforeEach(async () => {
      // Criar usuários de teste
      const adminPasswordHash = await bcrypt.hash("Admin123!", 10)
      const teacherPasswordHash = await bcrypt.hash("Teacher123!", 10)
      const studentPasswordHash = await bcrypt.hash("Student123!", 10)

      // Inserir admin
      const [adminResult] = await db.insert(Users).values({
        status: "ACTIVE",
        email: "admin@example.com",
        matricula: "ADM001",
        passwordHash: adminPasswordHash,
        nome: "Admin User",
        school: "Admin School",
        academicTitle: "PhD",
        role: "ADMIN",
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning()

      // Inserir teacher
      const [teacherResult] = await db.insert(Users).values({
        status: "ACTIVE",
        email: "teacher@example.com",
        matricula: "TCH001",
        passwordHash: teacherPasswordHash,
        nome: "Teacher User",
        school: "Teacher School",
        academicTitle: "PhD",
        role: "TEACHER",
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning()

      // Inserir student
      const [studentResult] = await db.insert(Users).values({
        status: "ACTIVE",
        email: "student@example.com",
        matricula: "STD001",
        passwordHash: studentPasswordHash,
        nome: "Student User",
        school: "Student School",
        academicTitle: "MSc",
        role: "STUDENT",
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning()

      adminUser = adminResult
      teacherUser = teacherResult
      studentUser = studentResult
    })

    it("should allow admin to access admin-only endpoints", async () => {
      // Login como admin
      const loginResponse = await client.auth.login.$post({
        json: {
          email: "admin@example.com",
          password: "Admin123!",
        },
      })

      expect(loginResponse.status).toBe(200)
      const loginData = await loginResponse.json()
      const adminToken = loginData.token

      // Testar endpoints admin-only
      const adminEndpoints = [
        { path: "usuario.all", method: "get" },
      ]

      for (const endpoint of adminEndpoints) {
        const response = await client[endpoint.path][endpoint.method]({
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        })
        expect(response.status).not.toBe(403)
      }
    })

    it("should deny non-admin users access to admin-only endpoints", async () => {
      // Login como teacher
      const teacherLoginResponse = await client.auth.login.$post({
        json: {
          email: "teacher@example.com",
          password: "Teacher123!",
        },
      })

      expect(teacherLoginResponse.status).toBe(200)
      const teacherLoginData = await teacherLoginResponse.json()
      const teacherToken = teacherLoginData.token

      // Testar endpoints admin-only com teacher
      const adminEndpoints = [
        { path: "usuario.all", method: "get" },
      ]

      for (const endpoint of adminEndpoints) {
        const response = await client[endpoint.path][endpoint.method]({
          headers: {
            Authorization: `Bearer ${teacherToken}`,
          },
        })
        expect(response.status).toBe(403)
      }
    })

    it("should allow teachers to access teacher endpoints", async () => {
      // Login como teacher
      const teacherLoginResponse = await client.auth.login.$post({
        json: {
          email: "teacher@example.com",
          password: "Teacher123!",
        },
      })

      expect(teacherLoginResponse.status).toBe(200)
      const teacherLoginData = await teacherLoginResponse.json()
      const teacherToken = teacherLoginData.token

      // Testar endpoints de teacher
      const teacherEndpoints = [
        { path: "usuario", method: "post" },
      ]

      for (const endpoint of teacherEndpoints) {
        const response = await client[endpoint.path][endpoint.method]({
          headers: {
            Authorization: `Bearer ${teacherToken}`,
          },
          json: {
            email: "newuser@example.com",
            password: "NewUser123!",
            nome: "New User",
            school: "New School",
            academicTitle: "MSc",
            matricula: "NEW001",
          },
        })
        expect(response.status).not.toBe(403)
      }
    })

    it("should deny students access to teacher endpoints", async () => {
      // Login como student
      const studentLoginResponse = await client.auth.login.$post({
        json: {
          email: "student@example.com",
          password: "Student123!",
        },
      })

      expect(studentLoginResponse.status).toBe(200)
      const studentLoginData = await studentLoginResponse.json()
      const studentToken = studentLoginData.token

      // Testar endpoints de teacher com student
      const teacherEndpoints = [
        { path: "usuario", method: "post" },
      ]

      for (const endpoint of teacherEndpoints) {
        const response = await client[endpoint.path][endpoint.method]({
          headers: {
            Authorization: `Bearer ${studentToken}`,
          },
          json: {
            email: "newuser@example.com",
            password: "NewUser123!",
            nome: "New User",
            school: "New School",
            academicTitle: "MSc",
            matricula: "NEW001",
          },
        })
        expect(response.status).toBe(403)
      }
    })
  })

  describe("Input Validation Security", () => {
    it("should reject malformed JSON", async () => {
      const response = await client.auth.login.$post({
        headers: {
          "Content-Type": "application/json",
        },
        body: "invalid json",
      })

      expect(response.status).toBe(400)
    })

    it("should validate required fields", async () => {
      const response = await client.auth.login.$post({
        json: {
          email: "test@example.com",
          // password missing
        },
      })

      expect(response.status).toBe(400)
    })

    it("should validate email format", async () => {
      const response = await client.auth.login.$post({
        json: {
          email: "not-an-email",
          password: "Password123!",
        },
      })

      expect(response.status).toBe(400)
    })

    it("should validate password requirements", async () => {
      const response = await client.auth.register.$post({
        json: {
          email: "test@example.com",
          password: "123", // too short
          nome: "Test User",
          school: "Test School",
          academicTitle: "MSc",
          matricula: "TEST001",
        },
      })

      expect(response.status).toBe(400)
    })
  })

  describe("SQL Injection Prevention", () => {
    it("should handle malicious search queries", async () => {
      const maliciousQueries = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "<script>alert('xss')</script>",
      ]

      for (const query of maliciousQueries) {
        const response = await client.banca.$get({
          query: { searchQuery: query },
        })

        // Should not crash and should handle gracefully
        expect(response.status).toBe(200)
      }
    })
  })

  describe("Cross-Site Scripting (XSS) Prevention", () => {
    it("should sanitize user input in responses", async () => {
      // Criar usuário com dados potencialmente maliciosos
      const maliciousUser = {
        email: "test@example.com",
        password: "Password123!",
        nome: "<script>alert('xss')</script>",
        school: "Test School",
        academicTitle: "MSc",
        matricula: "TEST001",
      }

      const response = await client.auth.register.$post({
        json: maliciousUser,
      })

      expect(response.status).toBe(201)

      // Se o endpoint retornar os dados do usuário, verificar que não há scripts
      if (response.status === 201) {
        const data = await response.json()
        if (data.nome) {
          expect(data.nome).not.toContain("<script>")
        }
      }
    })
  })

  describe("Rate Limiting", () => {
    it("should handle multiple failed login attempts", async () => {
      const invalidCredentials = {
        email: "nonexistent@example.com",
        password: "WrongPassword123!",
      }

      // Fazer múltiplas tentativas de login
      for (let i = 0; i < 5; i++) {
        const response = await client.auth.login.$post({
          json: invalidCredentials,
        })
        expect(response.status).toBe(403)
      }
    })
  })

  describe("Authorization Header Validation", () => {
    it("should reject malformed authorization headers", async () => {
      const malformedHeaders = [
        "Bearer",
        "Bearer ",
        "Basic token",
        "InvalidScheme token",
      ]

      for (const header of malformedHeaders) {
        const response = await client["usuario.me"].$get({
          headers: { Authorization: header },
        })
        expect(response.status).toBe(401)
      }
    })
  })

  describe("Resource Access Control", () => {
    let studentUser: any
    let anotherStudentUser: any

    beforeEach(async () => {
      // Criar dois usuários estudantes
      const studentPasswordHash = await bcrypt.hash("Student123!", 10)
      const anotherStudentPasswordHash = await bcrypt.hash("Student123!", 10)

      const [studentResult] = await db.insert(Users).values({
        status: "ACTIVE",
        email: "student@example.com",
        matricula: "STD001",
        passwordHash: studentPasswordHash,
        nome: "Student User",
        school: "Student School",
        academicTitle: "MSc",
        role: "STUDENT",
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning()

      const [anotherStudentResult] = await db.insert(Users).values({
        status: "ACTIVE",
        email: "anotherstudent@example.com",
        matricula: "STD002",
        passwordHash: anotherStudentPasswordHash,
        nome: "Another Student",
        school: "Student School",
        academicTitle: "MSc",
        role: "STUDENT",
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning()

      studentUser = studentResult
      anotherStudentUser = anotherStudentResult
    })

    it("should allow users to access their own profile", async () => {
      // Login como student
      const loginResponse = await client.auth.login.$post({
        json: {
          email: "student@example.com",
          password: "Student123!",
        },
      })

      expect(loginResponse.status).toBe(200)
      const loginData = await loginResponse.json()
      const studentToken = loginData.token

      // Acessar próprio perfil
      const response = await client["usuario.me"].$get({
        headers: {
          Authorization: `Bearer ${studentToken}`,
        },
      })

      expect(response.status).toBe(200)
      const profileData = await response.json()
      expect(profileData.id).toBe(studentUser.id)
    })

    it("should allow users to update their own profile", async () => {
      // Login como student
      const loginResponse = await client.auth.login.$post({
        json: {
          email: "student@example.com",
          password: "Student123!",
        },
      })

      expect(loginResponse.status).toBe(200)
      const loginData = await loginResponse.json()
      const studentToken = loginData.token

      // Atualizar próprio perfil
      const updateData = {
        nome: "Updated Name",
        school: "Updated School",
      }

      const response = await client["usuario.me"].$put({
        headers: {
          Authorization: `Bearer ${studentToken}`,
        },
        json: updateData,
      })

      expect(response.status).toBe(200)
    })
  })
})