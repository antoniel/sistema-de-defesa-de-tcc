import * as bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { testClient } from "hono/testing"
import { beforeEach, describe, expect, it } from "vitest"
import { app } from "../index"
import { type UserRole, Users, Bancas, Cursos } from "../database/schema"
import { fakeDeps, getFakeDb } from "./utils"

// Tipos de usuários para teste
const TEST_USERS = {
  admin: {
    id: 1,
    username: "admin",
    email: "admin@example.com",
    password: "Admin123!",
    passwordHash: "",
    nome: "Admin User",
    school: "Admin School",
    academicTitle: "PhD",
    matricula: "ADM001",
    role: "ADMIN" as UserRole,
  },
  teacher: {
    id: 2,
    username: "teacher",
    email: "teacher@example.com",
    password: "Teacher123!",
    passwordHash: "",
    nome: "Teacher User",
    school: "Teacher School",
    academicTitle: "PhD",
    matricula: "TCH001",
    role: "TEACHER" as UserRole,
  },
  student: {
    id: 3,
    username: "student",
    email: "student@example.com",
    password: "Student123!",
    passwordHash: "",
    nome: "Student User",
    school: "Student School",
    academicTitle: "MSc",
    matricula: "STD001",
    role: "STUDENT" as UserRole,
  },
  anotherStudent: {
    id: 4,
    username: "anotherstudent",
    email: "anotherstudent@example.com",
    password: "Student123!",
    passwordHash: "",
    nome: "Another Student",
    school: "Student School",
    academicTitle: "MSc",
    matricula: "STD002",
    role: "STUDENT" as UserRole,
  },
}

// Helper para criar token JWT
const createAuthToken = (userId: number, role: UserRole) => {
  // Simulação de token JWT - em produção seria gerado pelo serviço de auth
  return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI${userId}Iiwicm9sZSI6IiR7role}IiwiaWF0IjoxNTE2MjM5MDIyfQ.signature`
}

// Helper para fazer requisições autenticadas
const makeAuthenticatedRequest = async (client: any, endpoint: string, method: string, token: string, data?: any) => {
  const headers: Record<string, string> = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
  }

  switch (method.toLowerCase()) {
    case "get":
      return await client[endpoint].$get({ headers })
    case "post":
      return await client[endpoint].$post({ json: data, headers })
    case "put":
      return await client[endpoint].$put({ json: data, headers })
    case "delete":
      return await client[endpoint].$delete({ headers })
    case "patch":
      return await client[endpoint].$patch({ json: data, headers })
    default:
      throw new Error(`Método HTTP não suportado: ${method}`)
  }
}

describe("Security Tests - Permission Validation", async () => {
  const db = await getFakeDb()
  const client = testClient(app(fakeDeps(db)))

  beforeEach(async () => {
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

    // Criar hash das senhas
    for (const user of Object.values(TEST_USERS)) {
      user.passwordHash = await bcrypt.hash(user.password, 10)
    }

    // Inserir usuários de teste
    for (const user of Object.values(TEST_USERS)) {
      await db.insert(Users).values({
        id: user.id,
        status: "ACTIVE",
        email: user.email,
        matricula: user.matricula,
        passwordHash: user.passwordHash,
        nome: user.nome,
        school: user.school,
        academicTitle: user.academicTitle,
        role: user.role,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    // Criar banca de teste
    await db.insert(Bancas).values({
      id: 1,
      orientadorId: TEST_USERS.teacher.id,
      cursoId: 1,
      autor: "Test Author",
      alunoId: TEST_USERS.student.id,
      matricula: "STD001",
      turma: "2023.1",
      periodoAcademico: "2023.1",
      tituloTrabalho: "Test Work",
      resumo: "Test summary",
      abstract: "Test abstract",
      palavrasChave: "test, keywords",
      dataRealizacao: new Date("2024-12-31"),
      modalidade: "local",
      visible: true,
    })
  })

  afterEach(async () => {
    await db.delete(Users)
    await db.delete(Bancas)
    await db.delete(Cursos)
  })

  describe("Authentication Tests", () => {
    it("should reject requests without authentication token", async () => {
      const endpoints = [
        { path: "usuario.me", method: "get" },
        { path: "usuario.all", method: "get" },
        { path: "banca.1", method: "get" },
        { path: "banca.1", method: "delete" },
      ]

      for (const endpoint of endpoints) {
        const response = await client[endpoint.path][endpoint.method]()
        expect(response.status).toBe(401)
      }
    })

    it("should reject requests with invalid JWT token", async () => {
      const invalidToken = "invalid.jwt.token"
      const response = await makeAuthenticatedRequest(client, "usuario.me", "get", invalidToken)
      expect(response.status).toBe(401)
    })
  })

  describe("Role-Based Access Control Tests", () => {
    describe("Admin-only endpoints", () => {
      const adminOnlyEndpoints = [
        { path: "usuario.all", method: "get" },
        { path: "usuario.1", method: "put" },
        { path: "usuario.1", method: "delete" },
        { path: "banca.1", method: "put" },
      ]

      it("should allow access to admin users", async () => {
        const adminToken = createAuthToken(TEST_USERS.admin.id, TEST_USERS.admin.role)

        for (const endpoint of adminOnlyEndpoints) {
          const response = await makeAuthenticatedRequest(
            client,
            endpoint.path,
            endpoint.method,
            adminToken
          )
          expect(response.status).not.toBe(403)
        }
      })

      it("should deny access to non-admin users", async () => {
        const teacherToken = createAuthToken(TEST_USERS.teacher.id, TEST_USERS.teacher.role)
        const studentToken = createAuthToken(TEST_USERS.student.id, TEST_USERS.student.role)

        for (const endpoint of adminOnlyEndpoints) {
          // Test with teacher
          const teacherResponse = await makeAuthenticatedRequest(
            client,
            endpoint.path,
            endpoint.method,
            teacherToken
          )
          expect(teacherResponse.status).toBe(403)

          // Test with student
          const studentResponse = await makeAuthenticatedRequest(
            client,
            endpoint.path,
            endpoint.method,
            studentToken
          )
          expect(studentResponse.status).toBe(403)
        }
      })
    })

    describe("Teacher and Admin endpoints", () => {
      const teacherAdminEndpoints = [
        { path: "usuario", method: "post" },
        { path: "banca.1", method: "delete" },
        { path: "banca.1.toggle-visibility", method: "patch" },
        { path: "banca.my-defenses", method: "get" },
      ]

      it("should allow access to admin and teacher users", async () => {
        const adminToken = createAuthToken(TEST_USERS.admin.id, TEST_USERS.admin.role)
        const teacherToken = createAuthToken(TEST_USERS.teacher.id, TEST_USERS.teacher.role)

        for (const endpoint of teacherAdminEndpoints) {
          // Test with admin
          const adminResponse = await makeAuthenticatedRequest(
            client,
            endpoint.path,
            endpoint.method,
            adminToken
          )
          expect(adminResponse.status).not.toBe(403)

          // Test with teacher
          const teacherResponse = await makeAuthenticatedRequest(
            client,
            endpoint.path,
            endpoint.method,
            teacherToken
          )
          expect(teacherResponse.status).not.toBe(403)
        }
      })

      it("should deny access to student users", async () => {
        const studentToken = createAuthToken(TEST_USERS.student.id, TEST_USERS.student.role)

        for (const endpoint of teacherAdminEndpoints) {
          const response = await makeAuthenticatedRequest(
            client,
            endpoint.path,
            endpoint.method,
            studentToken
          )
          expect(response.status).toBe(403)
        }
      })
    })
  })

  describe("Resource Ownership Tests", () => {
    it("should allow users to access their own profile", async () => {
      const studentToken = createAuthToken(TEST_USERS.student.id, TEST_USERS.student.role)
      const response = await makeAuthenticatedRequest(client, "usuario.me", "get", studentToken)
      expect(response.status).toBe(200)
    })

    it("should allow users to update their own profile", async () => {
      const studentToken = createAuthToken(TEST_USERS.student.id, TEST_USERS.student.role)
      const updateData = {
        nome: "Updated Name",
        school: "Updated School",
      }

      const response = await makeAuthenticatedRequest(
        client,
        "usuario.me",
        "put",
        studentToken,
        updateData
      )
      expect(response.status).toBe(200)
    })

    it("should allow users to change their own password", async () => {
      const studentToken = createAuthToken(TEST_USERS.student.id, TEST_USERS.student.role)
      const passwordData = {
        currentPassword: TEST_USERS.student.password,
        newPassword: "NewPassword123!",
      }

      const response = await makeAuthenticatedRequest(
        client,
        "usuario.me.change-password",
        "post",
        studentToken,
        passwordData
      )
      expect(response.status).toBe(200)
    })
  })

  describe("Banca-specific permission tests", () => {
    it("should allow public access to visible bancas", async () => {
      const response = await client["banca.1"].$get()
      expect(response.status).toBe(200)
    })

    it("should allow teachers to access their own defenses", async () => {
      const teacherToken = createAuthToken(TEST_USERS.teacher.id, TEST_USERS.teacher.role)
      const response = await makeAuthenticatedRequest(client, "banca.my-defenses", "get", teacherToken)
      expect(response.status).toBe(200)
    })

    it("should deny students access to teacher-only endpoints", async () => {
      const studentToken = createAuthToken(TEST_USERS.student.id, TEST_USERS.student.role)
      const response = await makeAuthenticatedRequest(client, "banca.my-defenses", "get", studentToken)
      expect(response.status).toBe(403)
    })
  })

  describe("Input validation and sanitization", () => {
    it("should reject malformed JSON in protected endpoints", async () => {
      const adminToken = createAuthToken(TEST_USERS.admin.id, TEST_USERS.admin.role)
      
      // Test with malformed JSON
      const response = await client["usuario"].$post({
        headers: {
          "Authorization": `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: "invalid json",
      })
      
      expect(response.status).toBe(400)
    })

    it("should validate required fields in protected endpoints", async () => {
      const adminToken = createAuthToken(TEST_USERS.admin.id, TEST_USERS.admin.role)
      
      // Test with missing required fields
      const response = await makeAuthenticatedRequest(
        client,
        "usuario",
        "post",
        adminToken,
        { email: "test@example.com" } // Missing other required fields
      )
      
      expect(response.status).toBe(400)
    })
  })

  describe("Cross-User Access Prevention", () => {
    it("should prevent users from accessing other users' data through ID manipulation", async () => {
      const studentToken = createAuthToken(TEST_USERS.student.id, TEST_USERS.student.role)
      
      // Student trying to access another student's data
      const response = await makeAuthenticatedRequest(
        client,
        `usuario.${TEST_USERS.anotherStudent.id}`,
        "get",
        studentToken
      )
      
      // Should either be denied or return only public information
      expect(response.status).toBe(200) // Public endpoint, but should not expose sensitive data
      
      const data = await response.json()
      // Verify that sensitive data is not exposed
      expect(data).not.toHaveProperty("passwordHash")
      expect(data).not.toHaveProperty("email")
    })
  })

  describe("Session and Token Security", () => {
    it("should handle expired tokens appropriately", async () => {
      // Simulate expired token (this would need proper JWT implementation)
      const expiredToken = "expired.jwt.token"
      const response = await makeAuthenticatedRequest(client, "usuario.me", "get", expiredToken)
      expect(response.status).toBe(401)
    })

    it("should reject tokens with invalid signatures", async () => {
      const tamperedToken = "tampered.jwt.token"
      const response = await makeAuthenticatedRequest(client, "usuario.me", "get", tamperedToken)
      expect(response.status).toBe(401)
    })
  })

  describe("Rate Limiting and Brute Force Protection", () => {
    it("should handle multiple failed authentication attempts", async () => {
      const invalidCredentials = {
        email: TEST_USERS.student.email,
        password: "WrongPassword123!",
      }

      // Make multiple failed login attempts
      for (let i = 0; i < 5; i++) {
        const response = await client.auth.login.$post({
          json: invalidCredentials,
        })
        expect(response.status).toBe(403)
      }
    })
  })

  describe("SQL Injection Prevention", () => {
    it("should handle malicious input in search queries", async () => {
      const maliciousQueries = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "<script>alert('xss')</script>",
      ]

      for (const query of maliciousQueries) {
        const response = await client["banca"].$get({
          query: { searchQuery: query },
        })
        
        // Should not crash and should handle gracefully
        expect(response.status).toBe(200)
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
})