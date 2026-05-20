import { eq } from "drizzle-orm"
import { testClient } from "hono/testing"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { app } from "../.."
import { studentInvitations, Users } from "../../database/schema"
import { fakeDeps, getFakeDb } from "../../tests/utils"

import {
  TEST_ADMIN,
  TEST_STUDENT,
  TEST_TEACHER,
  createLoginHelper,
  createTestUserWithPasswordHash,
} from "@tcc/tests"

describe("Rotas de Student Invitation", async () => {
  const db = await getFakeDb()
  const client = testClient(app(fakeDeps(db)))

  let teacherToken = ""
  let studentToken = ""
  let adminToken = ""

  beforeEach(async () => {
    await db.delete(studentInvitations)
    await db.delete(Users)

    const teacherWithHash = await createTestUserWithPasswordHash(TEST_TEACHER)
    const studentWithHash = await createTestUserWithPasswordHash(TEST_STUDENT)
    const adminWithHash = await createTestUserWithPasswordHash(TEST_ADMIN)

    await db.insert(Users).values(teacherWithHash).returning()
    await db.insert(Users).values(studentWithHash).returning()
    await db.insert(Users).values(adminWithHash).returning()

    const loginUser = createLoginHelper(client)
    teacherToken = await loginUser(TEST_TEACHER)
    studentToken = await loginUser(TEST_STUDENT)
    adminToken = await loginUser(TEST_ADMIN)
  })

  afterEach(async () => {
    await db.delete(studentInvitations)
    await db.delete(Users)
  })

  describe("POST /student-invitation", () => {
    it("professor cria convite de aluno e gera Users stub", async () => {
      const res = await client["student-invitation"].$post(
        { json: { email: "novo.aluno@test.com", nome: "Novo Aluno", matricula: "S001" } },
        { headers: { Authorization: `Bearer ${teacherToken}` } },
      )

      expect(res.status).toBe(200)
      const body = (await res.json()) as { success: boolean; data: { invitationId: number; userId: number } }
      expect(body.success).toBe(true)
      expect(body.data.invitationId).toBeGreaterThan(0)
      expect(body.data.userId).toBeGreaterThan(0)

      const [stub] = await db.select().from(Users).where(eq(Users.email, "novo.aluno@test.com")).limit(1)
      expect(stub).toBeDefined()
      expect(stub.role).toBe("STUDENT")
      expect(stub.nome).toBe("Novo Aluno")
      expect(stub.matricula).toBe("S001")
      // school/academicTitle empty until onboarding
      expect(stub.school).toBe("")
      expect(stub.academicTitle).toBe("")

      const [invite] = await db
        .select()
        .from(studentInvitations)
        .where(eq(studentInvitations.email, "novo.aluno@test.com"))
        .limit(1)
      expect(invite.status).toBe("pending")
      expect(invite.userId).toBe(stub.id)
      expect(invite.invitationHash).toBeTruthy()
    })

    it("admin também pode criar convite", async () => {
      const res = await client["student-invitation"].$post(
        { json: { email: "admin.invitou@test.com", nome: "Aluno Admin", matricula: "A001" } },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      )
      expect(res.status).toBe(200)
    })

    it("aluno NÃO pode convidar outro aluno", async () => {
      const res = await client["student-invitation"].$post(
        { json: { email: "colega@test.com", nome: "Colega", matricula: "C001" } },
        { headers: { Authorization: `Bearer ${studentToken}` } },
      )
      expect(res.status).toBe(403)
    })

    it("rejeita email duplicado de usuário existente", async () => {
      const res = await client["student-invitation"].$post(
        { json: { email: TEST_TEACHER.email, nome: "X", matricula: "X1" } },
        { headers: { Authorization: `Bearer ${teacherToken}` } },
      )
      expect(res.status).toBe(400)
    })

    it("rejeita segundo convite pendente para o mesmo email", async () => {
      await client["student-invitation"].$post(
        { json: { email: "dup@test.com", nome: "Dup", matricula: "D1" } },
        { headers: { Authorization: `Bearer ${teacherToken}` } },
      )
      const res = await client["student-invitation"].$post(
        { json: { email: "dup@test.com", nome: "Dup2", matricula: "D2" } },
        { headers: { Authorization: `Bearer ${teacherToken}` } },
      )
      expect(res.status).toBe(400)
    })
  })

  describe("GET /student-invitation/verify/:hash", () => {
    it("retorna dados do convite válido", async () => {
      const created = await client["student-invitation"].$post(
        { json: { email: "verify@test.com", nome: "Verify", matricula: "V1" } },
        { headers: { Authorization: `Bearer ${teacherToken}` } },
      )
      const createdBody = (await created.json()) as { data: { invitationId: number } }
      const [invite] = await db
        .select()
        .from(studentInvitations)
        .where(eq(studentInvitations.id, createdBody.data.invitationId))
        .limit(1)

      const res = await client["student-invitation"].verify[":hash"].$get({
        param: { hash: invite.invitationHash },
      })

      expect(res.status).toBe(200)
      const body = (await res.json()) as { data: { email: string; nome: string } }
      expect(body.data.email).toBe("verify@test.com")
      expect(body.data.nome).toBe("Verify")
    })

    it("retorna 404 para hash inexistente", async () => {
      const res = await client["student-invitation"].verify[":hash"].$get({ param: { hash: "nope" } })
      expect(res.status).toBe(404)
    })
  })

  describe("POST /student-invitation/accept", () => {
    it("aceita convite e popula Users com dados completos", async () => {
      await client["student-invitation"].$post(
        { json: { email: "accept@test.com", nome: "Accept", matricula: "AC1" } },
        { headers: { Authorization: `Bearer ${teacherToken}` } },
      )
      const [invite] = await db
        .select()
        .from(studentInvitations)
        .where(eq(studentInvitations.email, "accept@test.com"))
        .limit(1)

      const res = await client["student-invitation"].accept.$post({
        json: {
          invitationHash: invite.invitationHash,
          password: "senha-forte-123",
          school: "Instituto de Computação",
        },
      })

      expect(res.status).toBe(200)
      const [updated] = await db.select().from(Users).where(eq(Users.id, invite.userId)).limit(1)
      expect(updated.school).toBe("Instituto de Computação")
      // Should be able to login now
      const loginRes = await client.auth.login.$post({
        json: { email: "accept@test.com", password: "senha-forte-123" },
      })
      expect(loginRes.status).toBe(200)

      const [reFetched] = await db
        .select()
        .from(studentInvitations)
        .where(eq(studentInvitations.id, invite.id))
        .limit(1)
      expect(reFetched.status).toBe("used")
    })

    it("rejeita aceite duplicado do mesmo convite", async () => {
      await client["student-invitation"].$post(
        { json: { email: "twice@test.com", nome: "Twice", matricula: "T1" } },
        { headers: { Authorization: `Bearer ${teacherToken}` } },
      )
      const [invite] = await db
        .select()
        .from(studentInvitations)
        .where(eq(studentInvitations.email, "twice@test.com"))
        .limit(1)

      await client["student-invitation"].accept.$post({
        json: { invitationHash: invite.invitationHash, password: "abc12345", school: "X" },
      })
      const res = await client["student-invitation"].accept.$post({
        json: { invitationHash: invite.invitationHash, password: "abc12345", school: "X" },
      })
      expect(res.status).toBe(410)
    })
  })

  describe("convites não expiram (sem coluna expiresAt)", () => {
    it("verify funciona em convite antigo", async () => {
      await client["student-invitation"].$post(
        { json: { email: "old@test.com", nome: "Old", matricula: "O1" } },
        { headers: { Authorization: `Bearer ${teacherToken}` } },
      )
      const [invite] = await db
        .select()
        .from(studentInvitations)
        .where(eq(studentInvitations.email, "old@test.com"))
        .limit(1)

      // Force createdAt way in the past
      await db
        .update(studentInvitations)
        .set({ createdAt: new Date("2020-01-01") })
        .where(eq(studentInvitations.id, invite.id))

      const res = await client["student-invitation"].verify[":hash"].$get({
        param: { hash: invite.invitationHash },
      })
      expect(res.status).toBe(200)
    })
  })

  describe("resiliência: signup direto com email convidado", () => {
    it("usuário cria conta via POST /usuario reaproveitando o stub do convite pendente", async () => {
      // Teacher invites
      await client["student-invitation"].$post(
        { json: { email: "resilient@test.com", nome: "Resilient", matricula: "R1" } },
        { headers: { Authorization: `Bearer ${teacherToken}` } },
      )
      const [stubBefore] = await db
        .select()
        .from(Users)
        .where(eq(Users.email, "resilient@test.com"))
        .limit(1)
      const stubUserId = stubBefore.id

      // Student bypasses the invite link and tries to sign up directly
      // (Goes through createUser flow). Should NOT fail with "duplicate_email";
      // should claim the stub by updating it.
      const signupRes = await client.usuario.$post(
        {
          json: {
            email: "resilient@test.com",
            password: "senha-resiliente-1",
            nome: "Resilient Forrest",
            school: "ICOMP",
            academicTitle: "",
            matricula: "R1",
            role: "STUDENT",
          },
        },
        { headers: { Authorization: `Bearer ${teacherToken}` } },
      )
      expect(signupRes.status).toBe(201)

      // Stub claimed, NOT duplicated
      const rows = await db.select().from(Users).where(eq(Users.email, "resilient@test.com"))
      expect(rows).toHaveLength(1)
      expect(rows[0].id).toBe(stubUserId)
      expect(rows[0].school).toBe("ICOMP")

      // Invitation marked as used
      const [invite] = await db
        .select()
        .from(studentInvitations)
        .where(eq(studentInvitations.email, "resilient@test.com"))
        .limit(1)
      expect(invite.status).toBe("used")
    })
  })
})
