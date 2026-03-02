import { eq } from "drizzle-orm"
import { testClient } from "hono/testing"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { app } from "../.."
import { Bancas, Cursos, Users, usuariosBancas } from "../../database/schema"
import { fakeDeps, getFakeDb } from "../../tests/utils"
import {
  TEST_ADMIN,
  TEST_STUDENT,
  TEST_TEACHER,
  createLoginHelper,
  createTestUserWithPasswordHash,
  getTestBancaData,
} from "@tcc/tests"

describe("Usuario Routes", async () => {
  const db = await getFakeDb()
  const client = testClient(app(fakeDeps(db)))

  let adminToken: string
  let testStudent: any

  beforeEach(async () => {
    // Create admin user for authentication
    const adminUser = await createTestUserWithPasswordHash(TEST_ADMIN)
    await db.insert(Users).values(adminUser)

    // Create test student to update
    testStudent = await createTestUserWithPasswordHash(TEST_STUDENT)
    await db.insert(Users).values(testStudent)

    // Login as admin to get token
    const loginResponse = await client.auth.login.$post({
      json: {
        email: TEST_ADMIN.email,
        password: TEST_ADMIN.password,
      },
    })
    const loginData = await loginResponse.json()
    adminToken = loginData.token
  })

  afterEach(async () => {
    await db.delete(Users)
  })

  it("should update user role from STUDENT to TEACHER", async () => {
    // First, verify the user is currently a STUDENT
    const userBefore = await db.select().from(Users).where(eq(Users.email, TEST_STUDENT.email)).limit(1)
    expect(userBefore[0].role).toBe("STUDENT")

    // Update the user's role to TEACHER
    const updateResponse = await client.usuario[":id"].$put({
      param: { id: userBefore[0].id.toString() },
      json: {
        nome: testStudent.nome,
        school: testStudent.school,
        academicTitle: testStudent.academicTitle,
        role: "TEACHER" as const,
      },
    }, { headers: { Authorization: `Bearer ${adminToken}` } })

    expect(updateResponse.status).toBe(200)
    
    const updatedData = await updateResponse.json()
    
    // Verify the response contains the updated role
    expect(updatedData.role).toBe("TEACHER")

    // Verify the database was actually updated
    const userAfter = await db.select().from(Users).where(eq(Users.id, userBefore[0].id)).limit(1)
    expect(userAfter[0].role).toBe("TEACHER")
  })

  it("should update user role from STUDENT to ADMIN", async () => {
    // First, verify the user is currently a STUDENT
    const userBefore = await db.select().from(Users).where(eq(Users.email, TEST_STUDENT.email)).limit(1)
    expect(userBefore[0].role).toBe("STUDENT")

    // Update the user's role to ADMIN
    const updateResponse = await client.usuario[":id"].$put({
      param: { id: userBefore[0].id.toString() },
      json: {
        nome: testStudent.nome,
        school: testStudent.school,
        academicTitle: testStudent.academicTitle,
        role: "ADMIN" as const,
      },
    }, { headers: { Authorization: `Bearer ${adminToken}` } })

    expect(updateResponse.status).toBe(200)
    
    const updatedData = await updateResponse.json()
    
    // Verify the response contains the updated role
    expect(updatedData.role).toBe("ADMIN")

    // Verify the database was actually updated
    const userAfter = await db.select().from(Users).where(eq(Users.id, userBefore[0].id)).limit(1)
    expect(userAfter[0].role).toBe("ADMIN")
  })

  it("should update other user fields without affecting role", async () => {
    const userBefore = await db.select().from(Users).where(eq(Users.email, TEST_STUDENT.email)).limit(1)
    const originalRole = userBefore[0].role

    // Update other fields but keep the same role
    const updateResponse = await client.usuario[":id"].$put({
      param: { id: userBefore[0].id.toString() },
      json: {
        nome: "Updated Name",
        school: "Updated School",
        academicTitle: "Updated Title",
        role: originalRole,
      },
    }, { headers: { Authorization: `Bearer ${adminToken}` } })

    expect(updateResponse.status).toBe(200)
    
    const updatedData = await updateResponse.json()
    
    // Verify the fields were updated
    expect(updatedData.nome).toBe("Updated Name")
    expect(updatedData.school).toBe("Updated School")
    expect(updatedData.academicTitle).toBe("Updated Title")
    expect(updatedData.role).toBe(originalRole)

    // Verify the database was actually updated
    const userAfter = await db.select().from(Users).where(eq(Users.id, userBefore[0].id)).limit(1)
    expect(userAfter[0].nome).toBe("Updated Name")
    expect(userAfter[0].school).toBe("Updated School")
    expect(userAfter[0].academicTitle).toBe("Updated Title")
    expect(userAfter[0].role).toBe(originalRole)
  })
})

describe("Usuario Routes - Authorization", async () => {
  const db = await getFakeDb()
  const client = testClient(app(fakeDeps(db)))

  let adminToken: string
  let teacherToken: string
  let studentToken: string
  let testStudentToUpdate: any

  beforeEach(async () => {
    // Create users for testing
    const adminUser = await createTestUserWithPasswordHash(TEST_ADMIN)
    const teacherUser = await createTestUserWithPasswordHash(TEST_TEACHER)
    const studentUser = await createTestUserWithPasswordHash(TEST_STUDENT)

    // Create a second student to be updated
    const studentToUpdate = await createTestUserWithPasswordHash({
      ...TEST_STUDENT,
      email: "student.to.update@test.com",
      matricula: "999",
    })

    await db.insert(Users).values([adminUser, teacherUser, studentUser, studentToUpdate])
    testStudentToUpdate = studentToUpdate

    // Create login helper and get tokens for each role
    const loginUser = createLoginHelper(client)
    adminToken = await loginUser(TEST_ADMIN)
    teacherToken = await loginUser(TEST_TEACHER)
    studentToken = await loginUser(TEST_STUDENT)
  })

  afterEach(async () => {
    await db.delete(Users)
  })

  it("should allow ADMIN to update user roles", async () => {
    const userBefore = await db.select().from(Users).where(eq(Users.email, testStudentToUpdate.email)).limit(1)
    expect(userBefore[0].role).toBe("STUDENT")

    const updateResponse = await client.usuario[":id"].$put({
      param: { id: userBefore[0].id.toString() },
      json: {
        nome: testStudentToUpdate.nome,
        school: testStudentToUpdate.school,
        academicTitle: testStudentToUpdate.academicTitle,
        role: "TEACHER" as const,
      },
    }, { headers: { Authorization: `Bearer ${adminToken}` } })

    expect(updateResponse.status).toBe(200)
    
    const updatedData = await updateResponse.json()
    expect(updatedData.role).toBe("TEACHER")

    // Verify database was updated
    const userAfter = await db.select().from(Users).where(eq(Users.id, userBefore[0].id)).limit(1)
    expect(userAfter[0].role).toBe("TEACHER")
  })

  it("should deny TEACHER from updating user roles", async () => {
    const userBefore = await db.select().from(Users).where(eq(Users.email, testStudentToUpdate.email)).limit(1)
    
    const updateResponse = await client.usuario[":id"].$put({
      param: { id: userBefore[0].id.toString() },
      json: {
        nome: testStudentToUpdate.nome,
        school: testStudentToUpdate.school,
        academicTitle: testStudentToUpdate.academicTitle,
        role: "TEACHER" as const,
      },
    }, { headers: { Authorization: `Bearer ${teacherToken}` } })

    expect(updateResponse.status).toBe(403)
    
    // Verify the role was NOT changed in the database
    const userAfter = await db.select().from(Users).where(eq(Users.id, userBefore[0].id)).limit(1)
    expect(userAfter[0].role).toBe("STUDENT") // Should remain unchanged
  })

  it("should deny STUDENT from updating user roles", async () => {
    const userBefore = await db.select().from(Users).where(eq(Users.email, testStudentToUpdate.email)).limit(1)
    
    const updateResponse = await client.usuario[":id"].$put({
      param: { id: userBefore[0].id.toString() },
      json: {
        nome: testStudentToUpdate.nome,
        school: testStudentToUpdate.school,
        academicTitle: testStudentToUpdate.academicTitle,
        role: "TEACHER" as const,
      },
    }, { headers: { Authorization: `Bearer ${studentToken}` } })

    expect(updateResponse.status).toBe(403)
    
    // Verify the role was NOT changed in the database
    const userAfter = await db.select().from(Users).where(eq(Users.id, userBefore[0].id)).limit(1)
    expect(userAfter[0].role).toBe("STUDENT") // Should remain unchanged
  })

  it("should deny unauthorized requests (no token)", async () => {
    const userBefore = await db.select().from(Users).where(eq(Users.email, testStudentToUpdate.email)).limit(1)
    
    const updateResponse = await client.usuario[":id"].$put({
      param: { id: userBefore[0].id.toString() },
      json: {
        nome: testStudentToUpdate.nome,
        school: testStudentToUpdate.school,
        academicTitle: testStudentToUpdate.academicTitle,
        role: "TEACHER" as const,
      },
    })

    expect(updateResponse.status).toBe(401)
    
    // Verify the role was NOT changed in the database
    const userAfter = await db.select().from(Users).where(eq(Users.id, userBefore[0].id)).limit(1)
    expect(userAfter[0].role).toBe("STUDENT") // Should remain unchanged
  })

  it("should deny requests with invalid token", async () => {
    const userBefore = await db.select().from(Users).where(eq(Users.email, testStudentToUpdate.email)).limit(1)
    
    const updateResponse = await client.usuario[":id"].$put({
      param: { id: userBefore[0].id.toString() },
      json: {
        nome: testStudentToUpdate.nome,
        school: testStudentToUpdate.school,
        academicTitle: testStudentToUpdate.academicTitle,
        role: "TEACHER" as const,
      },
    }, { headers: { Authorization: `Bearer invalid-token` } })

    expect(updateResponse.status).toBe(401)
    
    // Verify the role was NOT changed in the database
    const userAfter = await db.select().from(Users).where(eq(Users.id, userBefore[0].id)).limit(1)
    expect(userAfter[0].role).toBe("STUDENT") // Should remain unchanged
  })
})

describe("Admin Delete User [USR-001, USR-002, USR-003, USR-004]", async () => {
  const db = await getFakeDb()
  const client = testClient(app(fakeDeps(db)))

  let adminToken: string
  let teacherToken: string

  beforeEach(async () => {
    const adminUser = await createTestUserWithPasswordHash(TEST_ADMIN)
    const teacherUser = await createTestUserWithPasswordHash({
      ...TEST_TEACHER,
      email: "teacher@example.com",
    })
    const studentUser = await createTestUserWithPasswordHash({
      ...TEST_STUDENT,
      email: "student@example.com",
    })
    await db.insert(Users).values([adminUser, teacherUser, studentUser])

    const loginUser = createLoginHelper(client)
    adminToken = await loginUser(TEST_ADMIN)
    teacherToken = await loginUser({ ...TEST_TEACHER, email: "teacher@example.com" })
  })

  afterEach(async () => {
    await db.delete(usuariosBancas)
    await db.delete(Bancas)
    await db.delete(Cursos)
    await db.delete(Users)
  })

  it("[USR-001] Admin successfully deletes a user with no references", async () => {
    const [userToDelete] = await db
      .select()
      .from(Users)
      .where(eq(Users.email, "student@example.com"))
      .limit(1)
    expect(userToDelete).toBeDefined()

    const res = await client.usuario[":id"].$delete(
      { param: { id: userToDelete.id.toString() }, query: {} },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )

    expect(res.status).toBe(204)

    const userAfter = await db.select().from(Users).where(eq(Users.id, userToDelete.id)).limit(1)
    expect(userAfter).toHaveLength(0)
  })

  it("[USR-002] Admin delete of user with banca references returns 400", async () => {
    const [teacher] = await db.select().from(Users).where(eq(Users.email, "teacher@example.com")).limit(1)
    const [student] = await db.select().from(Users).where(eq(Users.email, "student@example.com")).limit(1)
    const [curso] = await db.insert(Cursos).values({ nome: "BCC", sigla: "BCC" }).returning()
    await db
      .insert(Bancas)
      .values(
        getTestBancaData(curso.id, teacher.id, student.id)

      )

    const res = await client.usuario[":id"].$delete(
      { param: { id: teacher.id.toString() }, query: {} },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )

    expect(res.status).toBe(400)
    const data = await res.json()
    expect((data as { message?: string }).message).toContain("Usuário referenciado")

    const userAfter = await db.select().from(Users).where(eq(Users.id, teacher.id)).limit(1)
    expect(userAfter).toHaveLength(1)
  })

  it("[USR-003] Delete fails when user not found", async () => {
    const res = await client.usuario[":id"].$delete(
      { param: { id: "99999" }, query: {} },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )

    expect(res.status).toBe(404)
    const data = await res.json()
    expect((data as { message?: string }).message).toContain("não encontrado")

    const userCount = await db.select().from(Users)
    expect(userCount.length).toBeGreaterThanOrEqual(3)
  })

  it("[USR-004] Non-admin cannot delete users", async () => {
    const [userToDelete] = await db
      .select()
      .from(Users)
      .where(eq(Users.email, "student@example.com"))
      .limit(1)

    const res = await client.usuario[":id"].$delete(
      { param: { id: userToDelete.id.toString() }, query: {} },
      { headers: { Authorization: `Bearer ${teacherToken}` } }
    )

    expect(res.status).toBe(403)

    const userAfter = await db.select().from(Users).where(eq(Users.id, userToDelete.id)).limit(1)
    expect(userAfter).toHaveLength(1)
  })

  it("Admin can fetch user associations", async () => {
    const [teacher] = await db.select().from(Users).where(eq(Users.email, "teacher@example.com")).limit(1)
    const res = await client.usuario[":id"].associations.$get(
      { param: { id: teacher.id.toString() } },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )
    expect(res.status).toBe(200)
    const data = (await res.json()) as { bancasAsOrientador: unknown[]; bancasAsAluno: unknown[]; membrosEmBancas: unknown[] }
    expect(data).toHaveProperty("bancasAsOrientador")
    expect(data).toHaveProperty("bancasAsAluno")
    expect(data).toHaveProperty("membrosEmBancas")
  })

  describe("[USR-006, USR-007, USR-009] Admin View User Detail", () => {
    it("[USR-006] Admin sees user associations (orientador and membro)", async () => {
      const [teacher] = await db.select().from(Users).where(eq(Users.email, "teacher@example.com")).limit(1)
      const [student] = await db.select().from(Users).where(eq(Users.email, "student@example.com")).limit(1)
      const [curso] = await db.insert(Cursos).values({ nome: "BCC", sigla: "BCC" }).returning()
      const [bancaAsOrientador] = await db
        .insert(Bancas)
        .values(getTestBancaData(curso.id, teacher.id, student.id, { tituloTrabalho: "TCC Orientador", autor: "Aluno A" }))
        .returning()
      const otherTeacherData = await createTestUserWithPasswordHash({
        ...TEST_TEACHER,
        email: "other@example.com",
        matricula: "444",
      })
      const otherStudentData = await createTestUserWithPasswordHash({
        ...TEST_STUDENT,
        email: "otherstudent@example.com",
        matricula: "555",
      })
      await db.insert(Users).values([otherTeacherData, otherStudentData])
      const [otherTeacher] = await db.select().from(Users).where(eq(Users.email, "other@example.com")).limit(1)
      const [otherStudent] = await db.select().from(Users).where(eq(Users.email, "otherstudent@example.com")).limit(1)
      const [bancaAsMembro] = await db
        .insert(Bancas)
        .values(getTestBancaData(curso.id, otherTeacher.id, otherStudent.id, { tituloTrabalho: "TCC Membro", autor: "Aluno B" }))
        .returning()
      await db.insert(usuariosBancas).values({
        usuarioId: teacher.id,
        bancaId: bancaAsMembro.id,
        role: "avaliador",
      })

      const res = await client.usuario[":id"].associations.$get(
        { param: { id: teacher.id.toString() } },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )

      expect(res.status).toBe(200)
      const data = (await res.json()) as {
        bancasAsOrientador: { id: number; tituloTrabalho: string; autor: string }[]
        bancasAsAluno: { id: number; tituloTrabalho: string; autor: string }[]
        membrosEmBancas: { bancaId: number; tituloTrabalho: string; role: string }[]
      }
      expect(data.bancasAsOrientador).toHaveLength(1)
      expect(data.bancasAsOrientador[0].tituloTrabalho).toBe("TCC Orientador")
      expect(data.bancasAsAluno).toHaveLength(0)
      expect(data.membrosEmBancas).toHaveLength(1)
      expect(data.membrosEmBancas[0].tituloTrabalho).toBe("TCC Membro")
      expect(data.membrosEmBancas[0].role).toBe("avaliador")
    })

    it("[USR-007] Admin sees empty associations when user has none", async () => {
      const [newUser] = await db
        .insert(Users)
        .values(await createTestUserWithPasswordHash({ ...TEST_STUDENT, email: "newuser@example.com", matricula: "666" }))
        .returning()

      const res = await client.usuario[":id"].associations.$get(
        { param: { id: newUser.id.toString() } },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )

      expect(res.status).toBe(200)
      const data = (await res.json()) as {
        bancasAsOrientador: unknown[]
        bancasAsAluno: unknown[]
        membrosEmBancas: unknown[]
      }
      expect(data.bancasAsOrientador).toHaveLength(0)
      expect(data.bancasAsAluno).toHaveLength(0)
      expect(data.membrosEmBancas).toHaveLength(0)
    })

    it("[USR-009] Non-admin cannot access user associations", async () => {
      const [teacher] = await db.select().from(Users).where(eq(Users.email, "teacher@example.com")).limit(1)

      const res = await client.usuario[":id"].associations.$get(
        { param: { id: teacher.id.toString() } },
        { headers: { Authorization: `Bearer ${teacherToken}` } }
      )

      expect(res.status).toBe(403)
    })
  })

  it("Admin can cascade delete user with banca references", async () => {
    const [teacher] = await db.select().from(Users).where(eq(Users.email, "teacher@example.com")).limit(1)
    const [student] = await db.select().from(Users).where(eq(Users.email, "student@example.com")).limit(1)
    const [curso] = await db.insert(Cursos).values({ nome: "CascadeTest", sigla: "CT" }).returning()
    const [banca] = await db
      .insert(Bancas)
      .values(getTestBancaData(curso.id, teacher.id, student.id))
      .returning()

    const res = await client.usuario[":id"].$delete(
      { param: { id: teacher.id.toString() }, query: { cascade: "true" } },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )
    expect(res.status).toBe(204)

    const userAfter = await db.select().from(Users).where(eq(Users.id, teacher.id)).limit(1)
    expect(userAfter).toHaveLength(0)

    const bancaAfter = await db.select().from(Bancas).where(eq(Bancas.id, banca.id)).limit(1)
    expect(bancaAfter).toHaveLength(0)
  })
})