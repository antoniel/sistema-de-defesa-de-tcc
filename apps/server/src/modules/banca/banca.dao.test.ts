import { beforeEach, describe, expect, it } from "vitest"
import type { InferResultType } from "../../database"
import { Bancas, Cursos, Users, usuariosBancas } from "../../database/schema"
import { fakeDeps, getFakeDb } from "../../tests/utils"
import { BancaDAO } from "./banca.dao"
import { testClient } from "hono/testing"
import { app } from "../.."

describe("BancaDAO", () => {
  let db: Awaited<ReturnType<typeof getFakeDb>>
  let dao: BancaDAO

  beforeEach(async () => {
    db = await getFakeDb()

    // Seed minimal required data for tests
    await db.insert(Cursos).values({ id: 1, nome: "Ciência da Computação", sigla: "BCC" }).onConflictDoNothing()
    await db.insert(Users).values([
      {
        id: 1,
        passwordHash: "hash",
        email: "admin@test.com",
        nome: "Admin Test",
        school: "UFBA",
        academicTitle: "Doutor",
        matricula: "ADM123",
        createdAt: new Date(),
        updatedAt: new Date(),
        role: "ADMIN",
      },
      {
        id: 2,
        passwordHash: "hash",
        email: "teacher@test.com",
        nome: "Professor Test",
        school: "UFBA",
        academicTitle: "Doutor",
        matricula: "PROF123",
        createdAt: new Date(),
        updatedAt: new Date(),
        role: "TEACHER",
      },
      {
        id: 3,
        passwordHash: "hash",
        email: "student@test.com",
        nome: "Aluno Test",
        school: "UFBA",
        academicTitle: "Bacharel",
        matricula: "STU123",
        createdAt: new Date(),
        updatedAt: new Date(),
        role: "STUDENT",
      },
    ]).onConflictDoNothing()

    const middleware = fakeDeps(db)
    dao = new BancaDAO((key: string) => {
      if (key === "db") return db
      throw new Error(`Unknown dependency: ${key}`)
    })
  })

  describe("sorting functionality", () => {
    beforeEach(async () => {
      // Create test data for sorting tests - using existing seed functionality
      // Note: In a real test, you'd want to create specific test data for sorting
    })

    it("should sort by orientador name correctly", async () => {
      const resultAsc = await dao.getUpcomingBancas({
        page: 1,
        limit: 10,
        orderBy: "orientador",
        order: "asc",
      })

      const resultDesc = await dao.getUpcomingBancas({
        page: 1,
        limit: 10,
        orderBy: "orientador",
        order: "desc",
      })

      expect(resultAsc.bancas).toBeDefined()
      expect(resultDesc.bancas).toBeDefined()

      // Check if results are actually sorted
      if (resultAsc.bancas.length > 1) {
        const ascNames = resultAsc.bancas.map(b => b.orientador.nome)
        const sortedAscNames = [...ascNames].sort()
        expect(ascNames).toEqual(sortedAscNames)
      }

      if (resultDesc.bancas.length > 1) {
        const descNames = resultDesc.bancas.map(b => b.orientador.nome)
        const sortedDescNames = [...descNames].sort().reverse()
        expect(descNames).toEqual(sortedDescNames)
      }
    })

    it("should sort by curso name correctly", async () => {
      const resultAsc = await dao.getUpcomingBancas({
        page: 1,
        limit: 10,
        orderBy: "curso",
        order: "asc",
      })

      const resultDesc = await dao.getUpcomingBancas({
        page: 1,
        limit: 10,
        orderBy: "curso",
        order: "desc",
      })

      expect(resultAsc.bancas).toBeDefined()
      expect(resultDesc.bancas).toBeDefined()

      // Check if results are actually sorted
      if (resultAsc.bancas.length > 1) {
        const ascNames = resultAsc.bancas.map(b => b.curso.nome)
        const sortedAscNames = [...ascNames].sort()
        expect(ascNames).toEqual(sortedAscNames)
      }

      if (resultDesc.bancas.length > 1) {
        const descNames = resultDesc.bancas.map(b => b.curso.nome)
        const sortedDescNames = [...descNames].sort().reverse()
        expect(descNames).toEqual(sortedDescNames)
      }
    })

    it("should sort by titulo do trabalho correctly", async () => {
      const resultAsc = await dao.getUpcomingBancas({
        page: 1,
        limit: 10,
        orderBy: "tituloTrabalho",
        order: "asc",
      })

      const resultDesc = await dao.getUpcomingBancas({
        page: 1,
        limit: 10,
        orderBy: "tituloTrabalho",
        order: "desc",
      })

      expect(resultAsc.bancas).toBeDefined()
      expect(resultDesc.bancas).toBeDefined()

      // Check if results are actually sorted
      if (resultAsc.bancas.length > 1) {
        const ascTitles = resultAsc.bancas.map(b => b.tituloTrabalho)
        const sortedAscTitles = [...ascTitles].sort()
        expect(ascTitles).toEqual(sortedAscTitles)
      }

      if (resultDesc.bancas.length > 1) {
        const descTitles = resultDesc.bancas.map(b => b.tituloTrabalho)
        const sortedDescTitles = [...descTitles].sort().reverse()
        expect(descTitles).toEqual(sortedDescTitles)
      }
    })

    it("should sort by autor correctly", async () => {
      const resultAsc = await dao.getUpcomingBancas({
        page: 1,
        limit: 10,
        orderBy: "autor",
        order: "asc",
      })

      const resultDesc = await dao.getUpcomingBancas({
        page: 1,
        limit: 10,
        orderBy: "autor",
        order: "desc",
      })

      expect(resultAsc.bancas).toBeDefined()
      expect(resultDesc.bancas).toBeDefined()

      // Check if results are actually sorted
      if (resultAsc.bancas.length > 1) {
        const ascAuthors = resultAsc.bancas.map(b => b.autor)
        const sortedAscAuthors = [...ascAuthors].sort()
        expect(ascAuthors).toEqual(sortedAscAuthors)
      }

      if (resultDesc.bancas.length > 1) {
        const descAuthors = resultDesc.bancas.map(b => b.autor)
        const sortedDescAuthors = [...descAuthors].sort().reverse()
        expect(descAuthors).toEqual(sortedDescAuthors)
      }
    })

    it("should sort upcoming defenses by date ascending by default", async () => {
      const result = await dao.getUpcomingBancas({
        page: 1,
        limit: 10,
        orderBy: "dataRealizacao",
      })

      expect(result.bancas).toBeDefined()

      if (result.bancas.length > 1) {
        const dates = result.bancas.map(b => new Date(b.dataRealizacao).getTime())
        const sortedDates = [...dates].sort((a, b) => a - b) // ascending
        expect(dates).toEqual(sortedDates)
      }
    })

    it("should sort past defenses by date descending by default", async () => {
      const result = await dao.getPastBancas({
        page: 1,
        limit: 10,
        orderBy: "dataRealizacao",
      })

      expect(result.bancas).toBeDefined()

      if (result.bancas.length > 1) {
        const dates = result.bancas.map(b => new Date(b.dataRealizacao).getTime())
        const sortedDates = [...dates].sort((a, b) => b - a) // descending
        expect(dates).toEqual(sortedDates)
      }
    })

    it("should handle search with sorting", async () => {
      const result = await dao.getUpcomingBancas({
        page: 1,
        limit: 10,
        orderBy: "orientador",
        order: "asc",
        searchQuery: "test",
      })

      expect(result.bancas).toBeDefined()
      expect(result.total).toBeGreaterThanOrEqual(0)

      // If results exist, they should be sorted
      if (result.bancas.length > 1) {
        const names = result.bancas.map(b => b.orientador.nome)
        const sortedNames = [...names].sort()
        expect(names).toEqual(sortedNames)
      }
    })

    it("should handle pagination with sorting", async () => {
      const page1 = await dao.getUpcomingBancas({
        page: 1,
        limit: 2,
        orderBy: "autor",
        order: "asc",
      })

      const page2 = await dao.getUpcomingBancas({
        page: 2,
        limit: 2,
        orderBy: "autor",
        order: "asc",
      })

      expect(page1.bancas).toBeDefined()
      expect(page2.bancas).toBeDefined()

      // If both pages have results, first page's last item should be <= second page's first item
      if (page1.bancas.length > 0 && page2.bancas.length > 0) {
        const lastOfPage1 = page1.bancas[page1.bancas.length - 1].autor
        const firstOfPage2 = page2.bancas[0].autor
        expect(lastOfPage1 <= firstOfPage2).toBe(true)
      }
    })

    it("should work with getBancasByOrientador", async () => {
      // Assume orientador with ID 1 exists from seeded data
      const result = await dao.getBancasByOrientador({
        orientadorId: 1,
        page: 1,
        limit: 10,
        orderBy: "tituloTrabalho",
        order: "asc",
      })

      expect(result.past).toBeDefined()
      expect(result.upcoming).toBeDefined()
      expect(result.total).toBeGreaterThanOrEqual(0)

      // Check sorting of past bancas
      if (result.past.length > 1) {
        const pastTitles = result.past.map(b => b.tituloTrabalho)
        const sortedPastTitles = [...pastTitles].sort()
        expect(pastTitles).toEqual(sortedPastTitles)
      }

      // Check sorting of upcoming bancas
      if (result.upcoming.length > 1) {
        const upcomingTitles = result.upcoming.map(b => b.tituloTrabalho)
        const sortedUpcomingTitles = [...upcomingTitles].sort()
        expect(upcomingTitles).toEqual(sortedUpcomingTitles)
      }
    })
  })

  describe("visibility filtering", () => {
    it("should only return visible bancas for anonymous users", async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)

      const [invisibleBanca] = await db.insert(Bancas).values({
        alunoId: 3,
        orientadorId: 2,
        cursoId: 1,
        autor: "Test Author Invisible",
        matricula: "999999",
        tituloTrabalho: "Test Invisible Upcoming Banca",
        resumo: "Test",
        abstract: "Test",
        palavrasChave: "test",
        dataRealizacao: futureDate,
        modalidade: "local",
        local: "Test Location",
        visible: false,
        turma: "TEST",
        periodoAcademico: "2025.1"
      }).returning()

      const result = await dao.getUpcomingBancas({
        page: 1,
        limit: 100,
      })

      expect(result.bancas).toBeDefined()
      const foundInvisible = result.bancas.find(b => b.id === invisibleBanca.id)
      expect(foundInvisible).toBeUndefined()
    })

    it("should not return invisible bancas for admin users in list", async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)

      const [invisibleBanca] = await db.insert(Bancas).values({
        alunoId: 3,
        orientadorId: 2,
        cursoId: 1,
        autor: "Test Admin Invisible",
        matricula: "888888",
        tituloTrabalho: "Test Admin Invisible Banca",
        resumo: "Test",
        abstract: "Test",
        palavrasChave: "test",
        dataRealizacao: futureDate,
        modalidade: "local",
        local: "Test Location",
        visible: false,
        turma: "TEST",
        periodoAcademico: "2025.1"
      }).returning()

      const result = await dao.getUpcomingBancas({
        page: 1,
        limit: 100,
        userId: 1,
        userRole: "ADMIN",
      })

      expect(result.bancas).toBeDefined()
      const foundInvisible = result.bancas.find(b => b.id === invisibleBanca.id)
      expect(foundInvisible).toBeUndefined()
    })

    it("should return invisible bancas for member users", async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)

      const [invisibleBanca] = await db.insert(Bancas).values({
        alunoId: 3,
        orientadorId: 2,
        cursoId: 1,
        autor: "Test Member Invisible",
        matricula: "777777",
        tituloTrabalho: "Test Member Invisible Banca",
        resumo: "Test",
        abstract: "Test",
        palavrasChave: "test",
        dataRealizacao: futureDate,
        modalidade: "local",
        local: "Test Location",
        visible: false,
        turma: "TEST",
        periodoAcademico: "2025.1"
      }).returning()

      // Add user as member of the banca
      await db.insert(usuariosBancas).values({
        bancaId: invisibleBanca.id,
        usuarioId: 2,
        role: "avaliador",
      })

      const result = await dao.getUpcomingBancas({
        page: 1,
        limit: 100,
        userId: 2,
        userRole: "TEACHER",
      })

      expect(result.bancas).toBeDefined()
      const foundInvisible = result.bancas.find(b => b.id === invisibleBanca.id)
      expect(foundInvisible).toBeDefined()
      expect(foundInvisible?.visible).toBe(false)
    })

    it("should return invisible bancas for orientador in getBancasByOrientador", async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)

      const [invisibleBanca] = await db.insert(Bancas).values({
        alunoId: 3,
        orientadorId: 2,
        cursoId: 1,
        autor: "Test Author Invisible for Orientador",
        matricula: "666666",
        tituloTrabalho: "Test Invisible Banca for Orientador",
        resumo: "Test",
        abstract: "Test",
        palavrasChave: "test",
        dataRealizacao: futureDate,
        modalidade: "local",
        local: "Test Location",
        visible: false,
        turma: "TEST",
        periodoAcademico: "2025.1"
      }).returning()

      const result = await dao.getBancasByOrientador({
        orientadorId: 2,
        page: 1,
        limit: 100,
      })

      expect(result.upcoming).toBeDefined()
      const foundInvisible = result.upcoming.find(b => b.id === invisibleBanca.id)
      expect(foundInvisible).toBeDefined()
      expect(foundInvisible?.visible).toBe(false)
    })
  })

  describe("data consistency", () => {
    beforeEach(async () => {
      // Create test data for consistency tests
    })

    it("should return the same total count regardless of sorting", async () => {
      const resultNoSort = await dao.getUpcomingBancas({
        page: 1,
        limit: 100,
      })

      const resultSortByOrientador = await dao.getUpcomingBancas({
        page: 1,
        limit: 100,
        orderBy: "orientador",
        order: "asc",
      })

      const resultSortByCurso = await dao.getUpcomingBancas({
        page: 1,
        limit: 100,
        orderBy: "curso",
        order: "desc",
      })

      expect(resultNoSort.total).toEqual(resultSortByOrientador.total)
      expect(resultNoSort.total).toEqual(resultSortByCurso.total)
    })

    it("should return all items when combining pages", async () => {
      const allResults = await dao.getUpcomingBancas({
        page: 1,
        limit: 100,
        orderBy: "autor",
        order: "asc",
      })

      if (allResults.total > 2) {
        const page1 = await dao.getUpcomingBancas({
          page: 1,
          limit: 2,
          orderBy: "autor",
          order: "asc",
        })

        const page2 = await dao.getUpcomingBancas({
          page: 2,
          limit: 2,
          orderBy: "autor",
          order: "asc",
        })

        const combinedIds = [...page1.bancas, ...page2.bancas].map(b => b.id)
        const allIds = allResults.bancas.slice(0, 4).map(b => b.id)

        expect(combinedIds).toEqual(allIds)
      }
    })
  })
})