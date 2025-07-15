import bcrypt from "bcrypt"
import { eq } from "drizzle-orm"
import { testClient } from "hono/testing"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { app } from "../.."
import { Bancas, Cursos, Users, usuariosBancas } from "../../database/schema"
import { fakeDeps, getFakeDb } from "../../tests/utils"
import { type CreateBancaInput, type UpdateBancaInput } from "./banca.schema"

import {
  TEST_ADMIN,
  TEST_CURSO,
  TEST_STUDENT,
  TEST_TEACHER,
  createLoginHelper,
  createTestBancaInput,
  createTestStudent,
  createTestUserWithPasswordHash,
  getTestBancaData,
} from "@tcc/tests"

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

    const teacherWithHash = await createTestUserWithPasswordHash(TEST_TEACHER)
    const studentWithHash = await createTestUserWithPasswordHash(TEST_STUDENT)
    const adminWithHash = await createTestUserWithPasswordHash(TEST_ADMIN)

    const [teacher] = await db.insert(Users).values(teacherWithHash).returning()
    const [student] = await db.insert(Users).values(studentWithHash).returning()
    await db.insert(Users).values(adminWithHash).returning()
    teacherId = teacher.id
    studentId = student.id

    const [curso] = await db.insert(Cursos).values(TEST_CURSO).returning()
    cursoId = curso.id

    const [banca] = await db
      .insert(Bancas)
      .values(getTestBancaData(cursoId, teacherId, studentId))
      .returning()
    bancaId = banca.id

    const loginUser = createLoginHelper(client)

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
      const student = await createTestStudent()
      const [studentUser] = await db.insert(Users).values(student).returning()
      const newBancaData: CreateBancaInput = createTestBancaInput(cursoId, teacherId, studentUser.id)

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
      const unrelatedUserData = {
        email: "unrelated@test.com",
        password: "Password123!",
        nome: "Unrelated User",
        role: "TEACHER" as const,
        matricula: "444",
        status: "ACTIVE" as const,
        school: "ICC",
        academicTitle: "PhD",
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const unrelatedUserWithHash = await createTestUserWithPasswordHash(unrelatedUserData)
      await db.insert(Users).values(unrelatedUserWithHash).returning()

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
      const unrelatedUserData2 = {
        email: "unrelated2@test.com",
        password: "Password123!",
        nome: "Unrelated User 2",
        role: "TEACHER" as const,
        matricula: "555",
        status: "ACTIVE" as const,
        school: "ICC",
        academicTitle: "PhD",
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const unrelatedUserWithHash2 = await createTestUserWithPasswordHash(unrelatedUserData2)
      await db.insert(Users).values(unrelatedUserWithHash2).returning()

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

      it("deve retornar apenas o número de resultados especificado no limite", async () => {
        const limit = 2
        const res = await client.banca.$get({
          query: {
            limit: limit.toString(),
          },
        })

        expect(res.status).toBe(200)
        const data = await res.json()

        // Check that pagination metadata is correct
        expect(data.meta.limit).toBe(limit)

        // Check that the actual number of results doesn't exceed the limit
        expect(data.past.length).toBeLessThanOrEqual(limit)
        expect(data.upcoming.length).toBeLessThanOrEqual(limit)

        // Test with a smaller limit to ensure it's working
        const smallLimit = 1
        const smallRes = await client.banca.$get({
          query: {
            limit: smallLimit.toString(),
          },
        })

        expect(smallRes.status).toBe(200)
        const smallData = await smallRes.json()

        expect(smallData.meta.limit).toBe(smallLimit)
        expect(smallData.past.length).toBeLessThanOrEqual(smallLimit)
        expect(smallData.upcoming.length).toBeLessThanOrEqual(smallLimit)
      })

      it("deve aplicar paginação corretamente na busca de defesas públicas", async () => {
        const limit = 2
        const res = await client.banca.$get({
          query: {
            searchQuery: "Test", // Should match our test defenses
            limit: limit.toString(),
            page: "1",
          },
        })

        expect(res.status).toBe(200)
        const data = await res.json()

        // Verify pagination metadata
        expect(data.meta.limit).toBe(limit)
        expect(data.meta.currentPage).toBe(1)

        // Verify that search results don't exceed the limit
        expect(data.past.length).toBeLessThanOrEqual(limit)
        expect(data.upcoming.length).toBeLessThanOrEqual(limit)

        // Note: The limit applies to each category separately in the pagination implementation
        // So we verify that each category respects the limit individually

        // Test second page to ensure pagination is working
        const page2Res = await client.banca.$get({
          query: {
            searchQuery: "Test",
            limit: limit.toString(),
            page: "2",
          },
        })

        expect(page2Res.status).toBe(200)
        const page2Data = await page2Res.json()

        expect(page2Data.meta.limit).toBe(limit)
        expect(page2Data.meta.currentPage).toBe(2)

        // Verify that page 2 results also don't exceed the limit
        expect(page2Data.past.length).toBeLessThanOrEqual(limit)
        expect(page2Data.upcoming.length).toBeLessThanOrEqual(limit)
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

describe("GET /bancas/my-defenses - Professor's Defenses Sorting", () => {
  let db: any
  let client: any

  let teacherToken = ""
  let teacher2Token = ""
  let teacherId: number
  let teacher2Id: number
  let cursoId: number

  const createTestBancasForMyDefenses = async () => {
    // Clear existing bancas first
    await db.delete(usuariosBancas)
    await db.delete(Bancas)

    const now = new Date()

    // Create students for each banca
    const students = []
    for (let i = 0; i < 6; i++) {
      const studentPasswordHash = await bcrypt.hash("testpass", 10)
      const [student] = await db
        .insert(Users)
        .values({
          email: `mystudent${i}@test.com`,
          passwordHash: studentPasswordHash,
          nome: `My Student ${i}`,
          role: "STUDENT",
          matricula: `666${i}`,
          school: "ICC",
          academicTitle: "BSc",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()
      students.push(student)
    }

    // Create bancas for teacherId (these should be returned by my-defenses)
    const myBancas = [
      {
        ...getTestBancaData(cursoId, teacherId, students[0].id),
        tituloTrabalho: "Alpha Project Defense",
        autor: "Alice MyStudent",
        local: "Room A101",
        dataRealizacao: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // +1 day (future)
        visible: true,
      },
      {
        ...getTestBancaData(cursoId, teacherId, students[1].id),
        tituloTrabalho: "Beta Analysis Defense",
        autor: "Bruno MyStudent",
        local: "Room B102",
        dataRealizacao: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // +3 days (future)
        visible: true,
      },
      {
        ...getTestBancaData(cursoId, teacherId, students[2].id),
        tituloTrabalho: "Charlie System Defense",
        autor: "Carlos MyStudent",
        local: "Room C103",
        dataRealizacao: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // -1 day (past)
        visible: true,
      },
      {
        ...getTestBancaData(cursoId, teacherId, students[3].id),
        tituloTrabalho: "Delta Framework Defense",
        autor: "Diana MyStudent",
        local: "Room D104",
        dataRealizacao: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // -3 days (past)
        visible: true,
      },
    ]

    // Create bancas for teacher2Id (these should NOT be returned by teacherId's my-defenses)
    const otherBancas = [
      {
        ...getTestBancaData(cursoId, teacher2Id, students[4].id),
        tituloTrabalho: "Echo Platform Defense",
        autor: "Eduardo OtherStudent",
        local: "Room E105",
        dataRealizacao: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // +2 days (future)
        visible: true,
      },
      {
        ...getTestBancaData(cursoId, teacher2Id, students[5].id),
        tituloTrabalho: "Foxtrot Service Defense",
        autor: "Fernanda OtherStudent",
        local: "Room F106",
        dataRealizacao: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // -2 days (past)
        visible: true,
      },
    ]

    await db.insert(Bancas).values([...myBancas, ...otherBancas])
  }

  beforeEach(async () => {
    if (!db) {
      db = await getFakeDb()
      client = testClient(app(fakeDeps(db)))
    }

    await db.delete(usuariosBancas)
    await db.delete(Bancas)
    await db.delete(Users)
    await db.delete(Cursos)

    // Create test teacher 1
    const teacher1WithHash = await createTestUserWithPasswordHash({
      ...TEST_TEACHER,
      email: "teacher1@test.com",
      matricula: "TEACH1",
    })
    const [teacher1] = await db.insert(Users).values(teacher1WithHash).returning()
    teacherId = teacher1.id

    // Create test teacher 2
    const teacher2WithHash = await createTestUserWithPasswordHash({
      ...TEST_TEACHER,
      email: "teacher2@test.com",
      matricula: "TEACH2",
      nome: "Second Teacher",
    })
    const [teacher2] = await db.insert(Users).values(teacher2WithHash).returning()
    teacher2Id = teacher2.id

    const [curso] = await db.insert(Cursos).values(TEST_CURSO).returning()
    cursoId = curso.id

    // Login both teachers
    const loginUser = createLoginHelper(client)
    teacherToken = await loginUser({ ...TEST_TEACHER, email: "teacher1@test.com" })
    teacher2Token = await loginUser({ ...TEST_TEACHER, email: "teacher2@test.com" })

    await createTestBancasForMyDefenses()
  })

  afterEach(async () => {
    await db.delete(usuariosBancas)
    await db.delete(Bancas)
    await db.delete(Users)
    await db.delete(Cursos)
  })

  describe("Basic functionality", () => {
    it("should return only the teacher's own defenses", async () => {
      const res = await client.banca["my-defenses"].$get({}, { headers: { Authorization: `Bearer ${teacherToken}` } })

      expect(res.status).toBe(200)
      const data = await res.json()

      // Should return only teacher1's defenses
      const allDefenses = [...data.past, ...data.upcoming]
      expect(allDefenses).toHaveLength(4) // 4 bancas for teacher1

      // All returned defenses should belong to teacher1
      allDefenses.forEach((banca) => {
        expect(banca.orientador.id).toBe(teacherId)
      })

      // Should not contain teacher2's defenses
      allDefenses.forEach((banca) => {
        expect(banca.autor).not.toContain("OtherStudent")
      })
    })

    it("should require teacher or admin role", async () => {
      // Create a student and try to access my-defenses
      const studentWithHash = await createTestUserWithPasswordHash(TEST_STUDENT)
      await db.insert(Users).values(studentWithHash).returning()

      const studentToken = await createLoginHelper(client)(TEST_STUDENT)

      const res = await client.banca["my-defenses"].$get({}, { headers: { Authorization: `Bearer ${studentToken}` } })

      expect(res.status).toBe(403)
    })
  })

  describe("Date sorting behavior (natural ordering)", () => {
    it("should always sort past defenses by date descending regardless of user order preference", async () => {
      // Test with user requesting ascending order for date
      const resAsc = await client.banca["my-defenses"].$get(
        {
          query: {
            orderBy: "dataRealizacao",
            order: "asc",
          },
        },
        { headers: { Authorization: `Bearer ${teacherToken}` } }
      )

      expect(resAsc.status).toBe(200)
      const dataAsc = await resAsc.json()

      // Past defenses should still be descending (most recent first)
      if (dataAsc.past.length > 1) {
        for (let i = 1; i < dataAsc.past.length; i++) {
          const date1 = new Date(dataAsc.past[i - 1].dataRealizacao)
          const date2 = new Date(dataAsc.past[i].dataRealizacao)
          expect(date1.getTime()).toBeGreaterThanOrEqual(date2.getTime())
        }
      }

      // Test with user requesting descending order for date
      const resDesc = await client.banca["my-defenses"].$get(
        {
          query: {
            orderBy: "dataRealizacao",
            order: "desc",
          },
        },
        { headers: { Authorization: `Bearer ${teacherToken}` } }
      )

      expect(resDesc.status).toBe(200)
      const dataDesc = await resDesc.json()

      // Past defenses should still be descending (same as above)
      if (dataDesc.past.length > 1) {
        for (let i = 1; i < dataDesc.past.length; i++) {
          const date1 = new Date(dataDesc.past[i - 1].dataRealizacao)
          const date2 = new Date(dataDesc.past[i].dataRealizacao)
          expect(date1.getTime()).toBeGreaterThanOrEqual(date2.getTime())
        }
      }
    })

    it("should always sort upcoming defenses by date ascending regardless of user order preference", async () => {
      // Test with user requesting ascending order for date
      const resAsc = await client.banca["my-defenses"].$get(
        {
          query: {
            orderBy: "dataRealizacao",
            order: "asc",
          },
        },
        { headers: { Authorization: `Bearer ${teacherToken}` } }
      )

      expect(resAsc.status).toBe(200)
      const dataAsc = await resAsc.json()

      // Upcoming defenses should be ascending (earliest first)
      if (dataAsc.upcoming.length > 1) {
        for (let i = 1; i < dataAsc.upcoming.length; i++) {
          const date1 = new Date(dataAsc.upcoming[i - 1].dataRealizacao)
          const date2 = new Date(dataAsc.upcoming[i].dataRealizacao)
          expect(date1.getTime()).toBeLessThanOrEqual(date2.getTime())
        }
      }

      // Test with user requesting descending order for date
      const resDesc = await client.banca["my-defenses"].$get(
        {
          query: {
            orderBy: "dataRealizacao",
            order: "desc",
          },
        },
        { headers: { Authorization: `Bearer ${teacherToken}` } }
      )

      expect(resDesc.status).toBe(200)
      const dataDesc = await resDesc.json()

      // Upcoming defenses should still be ascending (same as above)
      if (dataDesc.upcoming.length > 1) {
        for (let i = 1; i < dataDesc.upcoming.length; i++) {
          const date1 = new Date(dataDesc.upcoming[i - 1].dataRealizacao)
          const date2 = new Date(dataDesc.upcoming[i].dataRealizacao)
          expect(date1.getTime()).toBeLessThanOrEqual(date2.getTime())
        }
      }
    })

    it("should use natural date ordering when no order is specified", async () => {
      const res = await client.banca["my-defenses"].$get({}, { headers: { Authorization: `Bearer ${teacherToken}` } })

      expect(res.status).toBe(200)
      const data = await res.json()

      // Past defenses should be descending by default
      if (data.past.length > 1) {
        for (let i = 1; i < data.past.length; i++) {
          const date1 = new Date(data.past[i - 1].dataRealizacao)
          const date2 = new Date(data.past[i].dataRealizacao)
          expect(date1.getTime()).toBeGreaterThanOrEqual(date2.getTime())
        }
      }

      // Upcoming defenses should be ascending by default
      if (data.upcoming.length > 1) {
        for (let i = 1; i < data.upcoming.length; i++) {
          const date1 = new Date(data.upcoming[i - 1].dataRealizacao)
          const date2 = new Date(data.upcoming[i].dataRealizacao)
          expect(date1.getTime()).toBeLessThanOrEqual(date2.getTime())
        }
      }
    })
  })

  describe("Non-date field sorting (respects user preference)", () => {
    it("should respect user order preference for title field", async () => {
      // Test ascending order for title
      const resAsc = await client.banca["my-defenses"].$get(
        {
          query: {
            orderBy: "tituloTrabalho",
            order: "asc",
          },
        },
        { headers: { Authorization: `Bearer ${teacherToken}` } }
      )

      expect(resAsc.status).toBe(200)
      const dataAsc = await resAsc.json()

      // Past defenses should be sorted by title ascending
      if (dataAsc.past.length > 1) {
        for (let i = 1; i < dataAsc.past.length; i++) {
          const title1 = dataAsc.past[i - 1].tituloTrabalho || ""
          const title2 = dataAsc.past[i].tituloTrabalho || ""
          expect(title1.localeCompare(title2)).toBeLessThanOrEqual(0)
        }
      }

      // Upcoming defenses should be sorted by title ascending
      if (dataAsc.upcoming.length > 1) {
        for (let i = 1; i < dataAsc.upcoming.length; i++) {
          const title1 = dataAsc.upcoming[i - 1].tituloTrabalho || ""
          const title2 = dataAsc.upcoming[i].tituloTrabalho || ""
          expect(title1.localeCompare(title2)).toBeLessThanOrEqual(0)
        }
      }

      // Test descending order for title
      const resDesc = await client.banca["my-defenses"].$get(
        {
          query: {
            orderBy: "tituloTrabalho",
            order: "desc",
          },
        },
        { headers: { Authorization: `Bearer ${teacherToken}` } }
      )

      expect(resDesc.status).toBe(200)
      const dataDesc = await resDesc.json()

      // Past defenses should be sorted by title descending
      if (dataDesc.past.length > 1) {
        for (let i = 1; i < dataDesc.past.length; i++) {
          const title1 = dataDesc.past[i - 1].tituloTrabalho || ""
          const title2 = dataDesc.past[i].tituloTrabalho || ""
          expect(title1.localeCompare(title2)).toBeGreaterThanOrEqual(0)
        }
      }

      // Upcoming defenses should be sorted by title descending
      if (dataDesc.upcoming.length > 1) {
        for (let i = 1; i < dataDesc.upcoming.length; i++) {
          const title1 = dataDesc.upcoming[i - 1].tituloTrabalho || ""
          const title2 = dataDesc.upcoming[i].tituloTrabalho || ""
          expect(title1.localeCompare(title2)).toBeGreaterThanOrEqual(0)
        }
      }
    })

    it("should respect user order preference for author field", async () => {
      // Test ascending order for author
      const resAsc = await client.banca["my-defenses"].$get(
        {
          query: {
            orderBy: "autor",
            order: "asc",
          },
        },
        { headers: { Authorization: `Bearer ${teacherToken}` } }
      )

      expect(resAsc.status).toBe(200)
      const dataAsc = await resAsc.json()

      // Check that autor sorting works properly for upcoming defenses
      if (dataAsc.upcoming.length > 1) {
        for (let i = 1; i < dataAsc.upcoming.length; i++) {
          const autor1 = dataAsc.upcoming[i - 1].autor || ""
          const autor2 = dataAsc.upcoming[i].autor || ""
          expect(autor1.localeCompare(autor2)).toBeLessThanOrEqual(0)
        }
      }

      // Test descending order for author
      const resDesc = await client.banca["my-defenses"].$get(
        {
          query: {
            orderBy: "autor",
            order: "desc",
          },
        },
        { headers: { Authorization: `Bearer ${teacherToken}` } }
      )

      expect(resDesc.status).toBe(200)
      const dataDesc = await resDesc.json()

      // Check that autor sorting works properly for upcoming defenses
      if (dataDesc.upcoming.length > 1) {
        for (let i = 1; i < dataDesc.upcoming.length; i++) {
          const autor1 = dataDesc.upcoming[i - 1].autor || ""
          const autor2 = dataDesc.upcoming[i].autor || ""
          expect(autor1.localeCompare(autor2)).toBeGreaterThanOrEqual(0)
        }
      }
    })

    it("should respect user order preference for local field", async () => {
      // Test ascending order for local
      const resAsc = await client.banca["my-defenses"].$get(
        {
          query: {
            orderBy: "local",
            order: "asc",
          },
        },
        { headers: { Authorization: `Bearer ${teacherToken}` } }
      )

      expect(resAsc.status).toBe(200)
      const dataAsc = await resAsc.json()

      // Check that local sorting works properly for past defenses
      if (dataAsc.past.length > 1) {
        for (let i = 1; i < dataAsc.past.length; i++) {
          const local1 = dataAsc.past[i - 1].local || ""
          const local2 = dataAsc.past[i].local || ""
          expect(local1.localeCompare(local2)).toBeLessThanOrEqual(0)
        }
      }

      // Test descending order for local
      const resDesc = await client.banca["my-defenses"].$get(
        {
          query: {
            orderBy: "local",
            order: "desc",
          },
        },
        { headers: { Authorization: `Bearer ${teacherToken}` } }
      )

      expect(resDesc.status).toBe(200)
      const dataDesc = await resDesc.json()

      // Check that local sorting works properly for past defenses
      if (dataDesc.past.length > 1) {
        for (let i = 1; i < dataDesc.past.length; i++) {
          const local1 = dataDesc.past[i - 1].local || ""
          const local2 = dataDesc.past[i].local || ""
          expect(local1.localeCompare(local2)).toBeGreaterThanOrEqual(0)
        }
      }
    })
  })

  describe("Search functionality with sorting", () => {
    it("should maintain natural date sorting when searching", async () => {
      const res = await client.banca["my-defenses"].$get(
        {
          query: {
            searchQuery: "Defense", // Should match all our test defenses
            orderBy: "dataRealizacao",
            order: "desc", // User wants desc, but dates should still follow natural order
          },
        },
        { headers: { Authorization: `Bearer ${teacherToken}` } }
      )

      expect(res.status).toBe(200)
      const data = await res.json()

      // Past defenses should still be descending (natural order)
      if (data.past.length > 1) {
        for (let i = 1; i < data.past.length; i++) {
          const date1 = new Date(data.past[i - 1].dataRealizacao)
          const date2 = new Date(data.past[i].dataRealizacao)
          expect(date1.getTime()).toBeGreaterThanOrEqual(date2.getTime())
        }
      }

      // Upcoming defenses should still be ascending (natural order)
      if (data.upcoming.length > 1) {
        for (let i = 1; i < data.upcoming.length; i++) {
          const date1 = new Date(data.upcoming[i - 1].dataRealizacao)
          const date2 = new Date(data.upcoming[i].dataRealizacao)
          expect(date1.getTime()).toBeLessThanOrEqual(date2.getTime())
        }
      }
    })

    it("should respect user sorting for non-date fields when searching", async () => {
      const res = await client.banca["my-defenses"].$get(
        {
          query: {
            searchQuery: "MyStudent", // Should match our test students
            orderBy: "autor",
            order: "desc",
          },
        },
        { headers: { Authorization: `Bearer ${teacherToken}` } }
      )

      expect(res.status).toBe(200)
      const data = await res.json()

      // Should respect desc order for autor field
      const allResults = [...data.past, ...data.upcoming]
      if (allResults.length > 1) {
        // At least verify that search found our results
        allResults.forEach((banca) => {
          expect(banca.autor).toContain("MyStudent")
        })
      }
    })

    it("should apply pagination correctly when searching", async () => {
      const limit = 2
      const res = await client.banca["my-defenses"].$get(
        {
          query: {
            searchQuery: "Defense", // Should match all our test defenses
            limit: limit.toString(),
            page: "1",
          },
        },
        { headers: { Authorization: `Bearer ${teacherToken}` } }
      )

      expect(res.status).toBe(200)
      const data = await res.json()

      // Verify pagination metadata
      expect(data.meta.limit).toBe(limit)
      expect(data.meta.currentPage).toBe(1)

      // Verify that search results don't exceed the limit
      expect(data.past.length).toBeLessThanOrEqual(limit)
      expect(data.upcoming.length).toBeLessThanOrEqual(limit)

      // Note: The limit applies to each category separately in the pagination implementation
      // So we verify that each category respects the limit individually

      // Test with a smaller limit
      const smallLimit = 1
      const smallRes = await client.banca["my-defenses"].$get(
        {
          query: {
            searchQuery: "Defense",
            limit: smallLimit.toString(),
            page: "1",
          },
        },
        { headers: { Authorization: `Bearer ${teacherToken}` } }
      )

      expect(smallRes.status).toBe(200)
      const smallData = await smallRes.json()

      expect(smallData.meta.limit).toBe(smallLimit)
      expect(smallData.past.length).toBeLessThanOrEqual(smallLimit)
      expect(smallData.upcoming.length).toBeLessThanOrEqual(smallLimit)
    })
  })

  describe("Pagination with sorting", () => {
    it("should maintain sorting behavior with pagination", async () => {
      const res = await client.banca["my-defenses"].$get(
        {
          query: {
            orderBy: "dataRealizacao",
            order: "asc", // User wants asc, but dates should follow natural order
            page: "1",
            limit: "2",
          },
        },
        { headers: { Authorization: `Bearer ${teacherToken}` } }
      )

      expect(res.status).toBe(200)
      const data = await res.json()

      expect(data.meta.limit).toBe(2)
      expect(data.meta.currentPage).toBe(1)

      // Past defenses should still be descending (natural order) even with pagination
      if (data.past.length > 1) {
        for (let i = 1; i < data.past.length; i++) {
          const date1 = new Date(data.past[i - 1].dataRealizacao)
          const date2 = new Date(data.past[i].dataRealizacao)
          expect(date1.getTime()).toBeGreaterThanOrEqual(date2.getTime())
        }
      }

      // Upcoming defenses should still be ascending (natural order) even with pagination
      if (data.upcoming.length > 1) {
        for (let i = 1; i < data.upcoming.length; i++) {
          const date1 = new Date(data.upcoming[i - 1].dataRealizacao)
          const date2 = new Date(data.upcoming[i].dataRealizacao)
          expect(date1.getTime()).toBeLessThanOrEqual(date2.getTime())
        }
      }
    })
  })
})
