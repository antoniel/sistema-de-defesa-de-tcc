import * as bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { testClient } from "hono/testing"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { app } from "../.."
import { Bancas, type InsertBanca, type InsertUser, Users, cursos, usuariosBancas } from "../../database/schema"
import { fakeDeps, getFakeDb } from "../../tests/utils"
import { type CreateBancaInput, type UpdateBancaInput } from "./banca.schema"

const TEST_TEACHER: Omit<InsertUser, "passwordHash"> & { password: "Password123!" } = {
  email: "teacher@test.com",
  password: "Password123!",
  nome: "Test Teacher",
  role: "TEACHER",
  matricula: "111",
  status: "ACTIVE",
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
  status: "ACTIVE",
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
  status: "ACTIVE",
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

const getTestBancaData = (cursoId: number, orientadorId: number): Omit<InsertBanca, "id"> => ({
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
    await db.delete(cursos)

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

    const [curso] = await db.insert(cursos).values(TEST_CURSO).returning()
    cursoId = curso.id

    const [banca] = await db.insert(Bancas).values(getTestBancaData(cursoId, teacherId)).returning()
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
    await db.delete(cursos)
  })

  describe("POST /bancas", () => {
    it("permite um professor criar uma nova banca", async () => {
      const newBancaData: CreateBancaInput = {
        tituloTrabalho: "Nova Banca de TCC",
        palavrasChave: "tcc, novo",
        cursoId,
        resumo: "Resumo da nova banca",
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

    it("não retorna bancas não visíveis na lista principal", async () => {
      await db.update(Bancas).set({ visible: false }).where(eq(Bancas.id, bancaId))

      const res = await client.banca.$get()
      expect(res.status).toBe(200)
      const { upcoming } = await res.json()
      expect(upcoming.find((b) => b.id === bancaId)).toBeUndefined()
    })
  })

  describe("GET /bancas/:id", () => {
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
        alunoId: studentId.toString(),
        orientadorId: teacherId.toString(),
        cursoId: cursoId.toString(),
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
        alunoId: studentId.toString(),
        orientadorId: teacherId.toString(),
        cursoId: cursoId.toString(),
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
})
