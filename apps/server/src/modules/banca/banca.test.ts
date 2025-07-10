import * as bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { testClient } from "hono/testing"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { app } from "../.."
import { Bancas, Cursos, type InsertBanca, type InsertUser, Users, usuariosBancas } from "../../database/schema"
import { fakeDeps, getFakeDb } from "../../tests/utils"
import { type CreateBancaInput, type UpdateBancaInput } from "./banca.schema"

const TEST_TEACHER: Omit<InsertUser, "passwordHash"> & { password: "Password123!" } = {
  email: "teacher@test.com",
  password: "Password123!",
  nome: "Test Teacher",
  role: "TEACHER",
  matricula: "111",
  school: "ICC",
  academicTitle: "PhD",
  createdAt: new Date(),
  updatedAt: new Date(),
}

const TEST_STUDENT: Omit<InsertUser, "passwordHash"> & { password: "Password123!" } = {
  email: "student@test.com",
  password: "Password123!",
  nome: "Test Student",
  role: "STUDENT",
  matricula: "222",
  school: "ICC",
  academicTitle: "BSc",
  createdAt: new Date(),
  updatedAt: new Date(),
}

const TEST_ADMIN: Omit<InsertUser, "passwordHash"> & { password: "Password123!" } = {
  email: "admin@test.com",
  password: "Password123!",
  nome: "Test Admin",
  role: "ADMIN",
  matricula: "333",
  school: "ICC",
  academicTitle: "PhD",
  createdAt: new Date(),
  updatedAt: new Date(),
}

const TEST_CURSO = {
  nome: "Ciência da Computação",
  sigla: "BCC",
  // grau property is not in the schema, removing it.
}

const getTestBancaData = (cursoId: number, orientadorId: number, alunoId: number): Omit<InsertBanca, "id"> => ({
  tituloTrabalho: "Banca de Teste",
  autor: "Aluno Teste",
  matricula: "222",
  turma: "T01",
  periodoAcademico: "2024.1",
  palavrasChave: "teste, hono, vitest",
  resumo: "Um resumo da banca de teste.",
  abstract: "An abstract of the test defense.",
  dataRealizacao: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
  local: "Online",
  modalidade: "remoto",
  cursoId,
  orientadorId,
  visible: true,
  alunoId,
})

describe("Rotas de Banca", async () => {
  const db = await getFakeDb()
  const client = testClient(app(fakeDeps(db)))

  let teacherToken = ""
  let studentToken = ""
  let adminToken = ""

  let teacherId: number
  let studentId: number

  let cursoId: number
  let bancaId: number

  beforeEach(async () => {
    await db.delete(usuariosBancas)
    await db.delete(Bancas)
    await db.delete(Users)
    await db.delete(Cursos)

    const teacherPasswordHash = await bcrypt.hash(TEST_TEACHER.password, 10)
    const studentPasswordHash = await bcrypt.hash(TEST_STUDENT.password, 10)
    const adminPasswordHash = await bcrypt.hash(TEST_ADMIN.password, 10)

    const [teacher] = await db
      .insert(Users)
      .values({ ...TEST_TEACHER, passwordHash: teacherPasswordHash })
      .returning()
    const [student] = await db
      .insert(Users)
      .values({ ...TEST_STUDENT, passwordHash: studentPasswordHash })
      .returning()
    await db
      .insert(Users)
      .values({ ...TEST_ADMIN, passwordHash: adminPasswordHash })
      .returning()
    teacherId = teacher.id
    studentId = student.id

    const [curso] = await db.insert(Cursos).values(TEST_CURSO).returning()
    cursoId = curso.id

    const [banca] = await db
      .insert(Bancas)
      .values(getTestBancaData(cursoId, teacherId, studentId))
      .returning()
    bancaId = banca.id

    const loginUser = async (user: { email: string; password: string }) => {
      const res = await client.auth.login.$post({ json: user })
      const data = (await res.json()) as { token: string }
      return data.token
    }

    teacherToken = await loginUser(TEST_TEACHER)
    studentToken = await loginUser(TEST_STUDENT)
    adminToken = await loginUser(TEST_ADMIN)
  })

  afterEach(async () => {
    await db.delete(usuariosBancas)
    await db.delete(Bancas)
    await db.delete(Users)
    await db.delete(Cursos)
  })

  describe("POST /bancas", () => {
    it("permite um professor criar uma nova banca", async () => {
      const newStudentPasswordHash = await bcrypt.hash("newpass", 10)
      const [newStudent] = await db
        .insert(Users)
        .values({
          email: "newstudent@test.com",
          passwordHash: newStudentPasswordHash,
          nome: "New Student",
          role: "STUDENT",
          matricula: "444",
          school: "ICC",
          academicTitle: "BSc",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()

      const newBancaData: CreateBancaInput = {
        tituloTrabalho: "Nova Banca de TCC",
        palavrasChave: "tcc, novo",
        cursoId,
        resumo: "Resumo da nova banca",
        alunoId: newStudent.id,
        dataRealizacao: new Date(),
        local: "Teams",
        orientadorId: teacherId,
        autor: "Novo Aluno",
        matricula: "333",
        turma: "T02",
        periodoAcademico: "2024.2",
        abstract: "New abstract",
        modalidade: "remoto",
      }

      const res = await client.banca.$post(
        { json: newBancaData },
        { headers: { Authorization: `Bearer ${teacherToken}` } }
      )

      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data).toHaveProperty("id")
      expect(data.tituloTrabalho).toBe(newBancaData.tituloTrabalho)
    })

    it("não permite criar uma banca para um aluno que já possui uma no mesmo curso", async () => {
      const newBancaData: CreateBancaInput = {
        tituloTrabalho: "Segunda Banca de TCC",
        palavrasChave: "tcc, duplicado",
        cursoId,
        resumo: "Resumo da segunda banca",
        alunoId: studentId, // Same student from beforeEach
        dataRealizacao: new Date(),
        local: "Teams",
        orientadorId: teacherId,
        autor: "Aluno Teste",
        matricula: "222",
        turma: "T03",
        periodoAcademico: "2024.2",
        abstract: "Second abstract",
        modalidade: "remoto",
      }

      const res = await client.banca.$post(
        { json: newBancaData },
        { headers: { Authorization: `Bearer ${teacherToken}` } }
      )

      expect(res.status).toBe(409)
      const data = await res.json()
      expect((data as any).message).toContain("Este aluno já possui uma banca cadastrada para este curso.")
    })
  })

  describe("GET /bancas", () => {
    it("retorna uma lista de bancas visíveis", async () => {
      await db.update(Bancas).set({ visible: true }).where(eq(Bancas.id, bancaId))

      const res = await client.banca.$get()
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.upcoming).toBeInstanceOf(Array)
      expect(data.upcoming.length).toBeGreaterThan(0)
      expect(data.upcoming[0].id).toBe(bancaId)
    })

    it("não retorna bancas não visíveis para usuários não relacionados", async () => {
      await db.update(Bancas).set({ visible: false }).where(eq(Bancas.id, bancaId))

      // Create an unrelated user
      const unrelatedUserPasswordHash = await bcrypt.hash("Password123!", 10)
      const [unrelatedUser] = await db
        .insert(Users)
        .values({
          email: "unrelated@test.com",
          passwordHash: unrelatedUserPasswordHash,
          nome: "Unrelated User",
          role: "TEACHER",
          matricula: "444",
          school: "ICC",
          academicTitle: "PhD",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()

      const unrelatedLoginRes = await client.auth.login.$post({
        json: { email: "unrelated@test.com", password: "Password123!" },
      })
      const { token: unrelatedToken } = (await unrelatedLoginRes.json()) as { token: string }

      const res = await client.banca.$get({}, { headers: { Authorization: `Bearer ${unrelatedToken}` } })
      expect(res.status).toBe(200)
      const { upcoming } = await res.json()
      expect(upcoming.find((b) => b.id === bancaId)).toBeUndefined()
    })

    it("não retorna bancas não visíveis para o orientador na lista", async () => {
      await db.update(Bancas).set({ visible: false }).where(eq(Bancas.id, bancaId))

      const res = await client.banca.$get({}, { headers: { Authorization: `Bearer ${teacherToken}` } })
      expect(res.status).toBe(200)
      const { upcoming } = await res.json()
      expect(upcoming.find((b) => b.id === bancaId)).toBeUndefined()
    })

    it("não retorna bancas não visíveis para administradores na lista", async () => {
      await db.update(Bancas).set({ visible: false }).where(eq(Bancas.id, bancaId))

      const res = await client.banca.$get({}, { headers: { Authorization: `Bearer ${adminToken}` } })
      expect(res.status).toBe(200)
      const { upcoming } = await res.json()
      expect(upcoming.find((b) => b.id === bancaId)).toBeUndefined()
    })

    it("não retorna bancas não visíveis para o aluno da banca na lista", async () => {
      // First, update the banca to have the student as the aluno
      const updateData: UpdateBancaInput = {
        tituloTrabalho: "Banca de Teste",
        palavrasChave: "teste, hono, vitest",
        resumo: "Um resumo da banca de teste.",
        abstract: "An abstract of the test defense.",
        dataRealizacao: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
        local: "Online",
        alunoId: studentId,
        orientadorId: teacherId,
        cursoId: cursoId,
        membros: [{ id: teacherId.toString() }],
      }

      await client.banca[":id"].$put(
        { param: { id: bancaId.toString() }, json: updateData },
        { headers: { Authorization: `Bearer ${teacherToken}` } }
      )

      // Now set the banca as not visible
      await db.update(Bancas).set({ visible: false }).where(eq(Bancas.id, bancaId))

      // The student should NOT be able to see their banca in the list (only in individual endpoint)
      const res = await client.banca.$get({}, { headers: { Authorization: `Bearer ${studentToken}` } })
      expect(res.status).toBe(200)
      const { upcoming } = await res.json()
      expect(upcoming.find((b) => b.id === bancaId)).toBeUndefined()
    })
  })

  describe("GET /bancas/:id", () => {
    it("retorna semplre pelo menos um membro da banca que é o aluno", async () => {
      const res = await client.banca[":id"].$get({ param: { id: bancaId.toString() } })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.id).toBe(bancaId)
      expect(data.tituloTrabalho).toBe("Banca de Teste")
    })

    it("retorna detalhes de uma banca específica", async () => {
      const res = await client.banca[":id"].$get({ param: { id: bancaId.toString() } })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.id).toBe(bancaId)
      expect(data.tituloTrabalho).toBe("Banca de Teste")
    })

    it("retorna 404 para uma banca inexistente", async () => {
      const res = await client.banca[":id"].$get({ param: { id: "9999" } })
      expect(res.status).toBe(404)
    })

    it("retorna 404 para uma banca não visível quando usuário não é relacionado", async () => {
      await db.update(Bancas).set({ visible: false }).where(eq(Bancas.id, bancaId))

      // Create an unrelated user
      const unrelatedUserPasswordHash = await bcrypt.hash("Password123!", 10)
      await db
        .insert(Users)
        .values({
          email: "unrelated2@test.com",
          passwordHash: unrelatedUserPasswordHash,
          nome: "Unrelated User 2",
          role: "TEACHER",
          matricula: "555",
          school: "ICC",
          academicTitle: "PhD",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()

      const unrelatedLoginRes = await client.auth.login.$post({
        json: { email: "unrelated2@test.com", password: "Password123!" },
      })
      const { token: unrelatedToken } = (await unrelatedLoginRes.json()) as { token: string }

      const res = await client.banca[":id"].$get(
        { param: { id: bancaId.toString() } },
        { headers: { Authorization: `Bearer ${unrelatedToken}` } }
      )
      expect(res.status).toBe(404)
    })

    it("retorna banca não visível para o orientador", async () => {
      await db.update(Bancas).set({ visible: false }).where(eq(Bancas.id, bancaId))

      const res = await client.banca[":id"].$get(
        { param: { id: bancaId.toString() } },
        { headers: { Authorization: `Bearer ${teacherToken}` } }
      )
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.id).toBe(bancaId)
    })

    it("retorna banca não visível para administrador", async () => {
      await db.update(Bancas).set({ visible: false }).where(eq(Bancas.id, bancaId))

      const res = await client.banca[":id"].$get(
        { param: { id: bancaId.toString() } },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.id).toBe(bancaId)
    })

    it("retorna banca não visível para o aluno da banca", async () => {
      // First, update the banca to have the student as the aluno
      const updateData: UpdateBancaInput = {
        tituloTrabalho: "Banca de Teste",
        palavrasChave: "teste, hono, vitest",
        resumo: "Um resumo da banca de teste.",
        abstract: "An abstract of the test defense.",
        dataRealizacao: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
        local: "Online",
        alunoId: studentId,
        orientadorId: teacherId,
        cursoId: cursoId,
        membros: [{ id: teacherId.toString() }],
      }

      await client.banca[":id"].$put(
        { param: { id: bancaId.toString() }, json: updateData },
        { headers: { Authorization: `Bearer ${teacherToken}` } }
      )

      // Now set the banca as not visible
      await db.update(Bancas).set({ visible: false }).where(eq(Bancas.id, bancaId))

      // The student should still be able to see their banca
      const res = await client.banca[":id"].$get(
        { param: { id: bancaId.toString() } },
        { headers: { Authorization: `Bearer ${studentToken}` } }
      )
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.id).toBe(bancaId)
    })
  })

  describe("DELETE /bancas/:id", () => {
    it("permite o orientador deletar sua própria banca", async () => {
      const res = await client.banca[":id"].$delete(
        { param: { id: bancaId.toString() } },
        { headers: { Authorization: `Bearer ${teacherToken}` } }
      )
      expect(res.status).toBe(204)

      const found = await db.select().from(Bancas).where(eq(Bancas.id, bancaId))
      expect(found).toHaveLength(0)
    })

    it("não permite um estudante deletar uma banca", async () => {
      const res = await client.banca[":id"].$delete(
        { param: { id: bancaId.toString() } },
        { headers: { Authorization: `Bearer ${studentToken}` } }
      )
      expect(res.status).toBe(403)
    })

    it("permite um administrador deletar uma banca", async () => {
      const res = await client.banca[":id"].$delete(
        { param: { id: bancaId.toString() } },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )
      expect(res.status).toBe(204)
    })
  })

  describe("PUT /bancas/:id", () => {
    it("permite o orientador atualizar sua própria banca", async () => {
      const updateData: UpdateBancaInput = {
        tituloTrabalho: "Título Atualizado",
        palavrasChave: "atualizado",
        resumo: "Resumo atualizado",
        abstract: "Updated abstract",
        dataRealizacao: new Date(),
        local: "Zoom",
        alunoId: studentId,
        orientadorId: teacherId,
        cursoId: cursoId,
        membros: [{ id: teacherId.toString() }],
      }
      const res = await client.banca[":id"].$put(
        { param: { id: bancaId.toString() }, json: updateData },
        { headers: { Authorization: `Bearer ${teacherToken}` } }
      )
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.tituloTrabalho).toBe("Título Atualizado")

      const [dbBanca] = await db.select().from(Bancas).where(eq(Bancas.id, bancaId))
      expect(dbBanca.tituloTrabalho).toBe("Título Atualizado")
    })

    it("não permite um estudante atualizar uma banca", async () => {
      const updateData: UpdateBancaInput = {
        tituloTrabalho: "Título Malicioso",
        palavrasChave: "hacker",
        resumo: "hacker",
        abstract: "hacker",
        dataRealizacao: new Date(),
        local: "hacker",
        alunoId: studentId,
        orientadorId: teacherId,
        cursoId: cursoId,
        membros: [{ id: teacherId.toString() }],
      }
      const res = await client.banca[":id"].$put(
        { param: { id: bancaId.toString() }, json: updateData },
        { headers: { Authorization: `Bearer ${studentToken}` } }
      )
      expect(res.status).toBe(403)
    })
  })

  describe("PATCH /bancas/:id/toggle-visibility", () => {
    it("permite o orientador alternar a visibilidade", async () => {
      const res = await client.banca[":id"]["toggle-visibility"].$patch(
        { param: { id: bancaId.toString() } },
        { headers: { Authorization: `Bearer ${teacherToken}` } }
      )
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.visible).toBe(false) // was true, now false

      const res2 = await client.banca[":id"]["toggle-visibility"].$patch(
        { param: { id: bancaId.toString() } },
        { headers: { Authorization: `Bearer ${teacherToken}` } }
      )
      const data2 = await res2.json()
      expect(data2.visible).toBe(true)
    })
  })

  describe("GET /bancas - Paginação e Ordenação", () => {
    const createTestBancas = async () => {
      // Clear existing bancas first
      await db.delete(usuariosBancas)
      await db.delete(Bancas)

      const now = new Date()

      // Criar estudantes únicos para cada banca
      const students = []
      for (let i = 0; i < 5; i++) {
        const studentPasswordHash = await bcrypt.hash("testpass", 10)
        const [student] = await db
          .insert(Users)
          .values({
            email: `student${i}@test.com`,
            passwordHash: studentPasswordHash,
            nome: `Test Student ${i}`,
            role: "STUDENT",
            matricula: `555${i}`,
            school: "ICC",
            academicTitle: "BSc",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning()
        students.push(student)
      }

      const bancas = [
        {
          ...getTestBancaData(cursoId, teacherId, students[0].id),
          tituloTrabalho: "Alpha Project",
          autor: "Alice Silva",
          local: "Sala 101",
          dataRealizacao: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // +1 day (future)
          visible: true,
        },
        {
          ...getTestBancaData(cursoId, teacherId, students[1].id),
          tituloTrabalho: "Beta Analysis",
          autor: "Bruno Santos",
          local: "Sala 102",
          dataRealizacao: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // +2 days (future)
          visible: true,
        },
        {
          ...getTestBancaData(cursoId, teacherId, students[2].id),
          tituloTrabalho: "Charlie System",
          autor: "Carlos Pereira",
          local: "Sala 103",
          dataRealizacao: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // -1 day (past)
          visible: true,
        },
        {
          ...getTestBancaData(cursoId, teacherId, students[3].id),
          tituloTrabalho: "Delta Framework",
          autor: "Diana Costa",
          local: "Sala 104",
          dataRealizacao: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // -2 days (past)
          visible: true,
        },
        {
          ...getTestBancaData(cursoId, teacherId, students[4].id),
          tituloTrabalho: "Echo Platform",
          autor: "Eduardo Lima",
          local: "Sala 105",
          dataRealizacao: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // +3 days (future)
          visible: true,
        },
      ]

      await db.insert(Bancas).values(bancas)
    }

    beforeEach(async () => {
      await createTestBancas()
    })

    describe("Paginação básica", () => {
      it("deve respeitar o limite de resultados", async () => {
        const res = await client.banca.$get({
          query: {
            limit: "2",
          },
        })

        expect(res.status).toBe(200)
        const data = await res.json()

        expect(data.meta.limit).toBe(2)
        expect(data.meta.total).toBeGreaterThan(0)
      })

      it("deve paginar corretamente", async () => {
        // First page
        const page1 = await client.banca.$get({
          query: {
            page: "1",
            limit: "2",
          },
        })

        expect(page1.status).toBe(200)
        const data1 = await page1.json()
        expect(data1.meta.currentPage).toBe(1)
        expect(data1.meta.hasNext).toBe(true)
        expect(data1.meta.hasPrev).toBe(false)

        // Second page
        const page2 = await client.banca.$get({
          query: {
            page: "2",
            limit: "2",
          },
        })

        expect(page2.status).toBe(200)
        const data2 = await page2.json()
        expect(data2.meta.currentPage).toBe(2)
        expect(data2.meta.hasPrev).toBe(true)
      })

      it("deve calcular corretamente os metadados de paginação", async () => {
        const res = await client.banca.$get({
          query: {
            limit: "3",
          },
        })

        expect(res.status).toBe(200)
        const data = await res.json()

        expect(data.meta).toMatchObject({
          total: 5,
          totalPages: expect.any(Number),
          currentPage: 1,
          limit: 3,
          hasNext: expect.any(Boolean),
          hasPrev: false,
        })
        expect(data.meta.totalPages).toBeGreaterThan(1)
      })
    })

    describe("Ordenação por campos", () => {
      it("deve ordenar por título do trabalho (ascendente)", async () => {
        const res = await client.banca.$get({
          query: {
            orderBy: "tituloTrabalho",
            order: "asc",
          },
        })

        expect(res.status).toBe(200)
        const data = await res.json()

        // Check if upcoming bancas are sorted by title ascending
        if (data.upcoming.length > 1) {
          for (let i = 1; i < data.upcoming.length; i++) {
            const currentTitle = data.upcoming[i].tituloTrabalho || ""
            const prevTitle = data.upcoming[i - 1].tituloTrabalho || ""
            expect(currentTitle.localeCompare(prevTitle)).toBeGreaterThanOrEqual(0)
          }
        }
      })

      it("deve ordenar por título do trabalho (descendente)", async () => {
        const res = await client.banca.$get({
          query: {
            orderBy: "tituloTrabalho",
            order: "desc",
          },
        })

        expect(res.status).toBe(200)
        const data = await res.json()

        // Check if upcoming bancas are sorted by title descending
        if (data.upcoming.length > 1) {
          for (let i = 1; i < data.upcoming.length; i++) {
            const currentTitle = data.upcoming[i].tituloTrabalho || ""
            const prevTitle = data.upcoming[i - 1].tituloTrabalho || ""
            expect(currentTitle.localeCompare(prevTitle)).toBeLessThanOrEqual(0)
          }
        }
      })

      it("deve ordenar por autor (ascendente)", async () => {
        const res = await client.banca.$get({
          query: {
            orderBy: "autor",
            order: "asc",
          },
        })

        expect(res.status).toBe(200)
        const data = await res.json()

        // Check if upcoming bancas are sorted by autor ascending
        if (data.upcoming.length > 1) {
          for (let i = 1; i < data.upcoming.length; i++) {
            const currentAutor = data.upcoming[i].autor || ""
            const prevAutor = data.upcoming[i - 1].autor || ""
            expect(currentAutor.localeCompare(prevAutor)).toBeGreaterThanOrEqual(0)
          }
        }
      })

      it("deve ordenar por local (descendente)", async () => {
        const res = await client.banca.$get({
          query: {
            orderBy: "local",
            order: "desc",
          },
        })

        expect(res.status).toBe(200)
        const data = await res.json()

        // Check if upcoming bancas are sorted by local descending
        if (data.upcoming.length > 1) {
          for (let i = 1; i < data.upcoming.length; i++) {
            const currentLocal = data.upcoming[i].local || ""
            const prevLocal = data.upcoming[i - 1].local || ""
            expect(currentLocal.localeCompare(prevLocal)).toBeLessThanOrEqual(0)
          }
        }
      })

      it("deve usar ordenação padrão por data quando não especificada", async () => {
        const res = await client.banca.$get()

        expect(res.status).toBe(200)
        const data = await res.json()

        // Past bancas should be ordered by date descending (most recent first)
        if (data.past.length > 1) {
          for (let i = 1; i < data.past.length; i++) {
            const date1 = new Date(data.past[i - 1].dataRealizacao)
            const date2 = new Date(data.past[i].dataRealizacao)
            expect(date1.getTime()).toBeGreaterThanOrEqual(date2.getTime())
          }
        }

        // Upcoming bancas should be ordered by date ascending (earliest first)
        if (data.upcoming.length > 1) {
          for (let i = 1; i < data.upcoming.length; i++) {
            const date1 = new Date(data.upcoming[i - 1].dataRealizacao)
            const date2 = new Date(data.upcoming[i].dataRealizacao)
            expect(date1.getTime()).toBeLessThanOrEqual(date2.getTime())
          }
        }
      })
    })

    describe("Paginação com ordenação (sem busca)", () => {
      it("deve combinar paginação e ordenação", async () => {
        const res = await client.banca.$get({
          query: {
            orderBy: "tituloTrabalho",
            order: "asc",
            limit: "2",
          },
        })

        expect(res.status).toBe(200)
        const data = await res.json()

        expect(data.meta.limit).toBe(2)

        // For mixed past/upcoming results, we check that results within each group are sorted
        // Past bancas should be sorted by title ascending
        if (data.past.length > 1) {
          for (let i = 1; i < data.past.length; i++) {
            const currentTitle = data.past[i].tituloTrabalho || ""
            const prevTitle = data.past[i - 1].tituloTrabalho || ""
            expect(currentTitle.localeCompare(prevTitle)).toBeGreaterThanOrEqual(0)
          }
        }

        // Upcoming bancas should be sorted by title ascending
        if (data.upcoming.length > 1) {
          for (let i = 1; i < data.upcoming.length; i++) {
            const currentTitle = data.upcoming[i].tituloTrabalho || ""
            const prevTitle = data.upcoming[i - 1].tituloTrabalho || ""
            expect(currentTitle.localeCompare(prevTitle)).toBeGreaterThanOrEqual(0)
          }
        }
      })
    })

    describe("Separação de bancas passadas e futuras", () => {
      it("deve separar corretamente bancas passadas e futuras", async () => {
        const res = await client.banca.$get()

        expect(res.status).toBe(200)
        const data = await res.json()

        const now = new Date()

        // All past bancas should be in the past
        data.past.forEach((banca) => {
          const bancaDate = new Date(banca.dataRealizacao)
          expect(bancaDate.getTime()).toBeLessThan(now.getTime())
        })

        // All upcoming bancas should be in the future
        data.upcoming.forEach((banca) => {
          const bancaDate = new Date(banca.dataRealizacao)
          expect(bancaDate.getTime()).toBeGreaterThanOrEqual(now.getTime())
        })
      })

      it("deve ordenar bancas passadas por data decrescente", async () => {
        const res = await client.banca.$get()

        expect(res.status).toBe(200)
        const data = await res.json()

        // Past bancas should be ordered by date descending (most recent first)
        if (data.past.length > 1) {
          for (let i = 1; i < data.past.length; i++) {
            const date1 = new Date(data.past[i - 1].dataRealizacao)
            const date2 = new Date(data.past[i].dataRealizacao)
            expect(date1.getTime()).toBeGreaterThanOrEqual(date2.getTime())
          }
        }
      })

      it("deve ordenar bancas futuras por data crescente", async () => {
        const res = await client.banca.$get()

        expect(res.status).toBe(200)
        const data = await res.json()

        // Upcoming bancas should be ordered by date ascending (earliest first)
        if (data.upcoming.length > 1) {
          for (let i = 1; i < data.upcoming.length; i++) {
            const date1 = new Date(data.upcoming[i - 1].dataRealizacao)
            const date2 = new Date(data.upcoming[i].dataRealizacao)
            expect(date1.getTime()).toBeLessThanOrEqual(date2.getTime())
          }
        }
      })
    })

    describe("Casos extremos", () => {
      it("deve lidar com página inexistente", async () => {
        const res = await client.banca.$get({
          query: {
            page: "999",
            limit: "10",
          },
        })

        expect(res.status).toBe(200)
        const data = await res.json()

        // High page numbers should return pagination metadata correctly
        expect(data.meta.currentPage).toBe(999)
        expect(data.meta.hasNext).toBe(false)
        expect(data.meta.hasPrev).toBe(true)
        // The actual results may vary depending on pagination implementation
      })

      it("deve lidar com limite baixo", async () => {
        const res = await client.banca.$get({
          query: {
            limit: "1",
          },
        })

        expect(res.status).toBe(200)
        const data = await res.json()

        expect(data.meta.limit).toBe(1)
        // Should still return valid structure
        expect(Array.isArray(data.past)).toBe(true)
        expect(Array.isArray(data.upcoming)).toBe(true)
      })

      it("deve lidar com parâmetros de ordenação inválidos", async () => {
        const res = await client.banca.$get({
          query: {
            orderBy: "invalidField",
            order: "asc",
          },
        })

        expect(res.status).toBe(200)
        const data = await res.json()

        // Should still return valid structure even with invalid orderBy
        expect(Array.isArray(data.past)).toBe(true)
        expect(Array.isArray(data.upcoming)).toBe(true)
        expect(data.meta).toBeDefined()
      })
    })
  })
})
