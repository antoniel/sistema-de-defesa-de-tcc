import { beforeEach, describe, expect, it } from "vitest"
import { fakeDeps, getFakeDb } from "../../tests/utils"
import { getUpcomingBancasVisible, getPastBancasVisible, getBancasByOrientador } from "./banca.service"
import type { Context } from "hono"
import type { AppVariables } from "../../types"

describe("BancaService - Sorting Integration", () => {
  let db: Awaited<ReturnType<typeof getFakeDb>>
  let context: Context<{ Variables: AppVariables }>

  beforeEach(async () => {
    db = await getFakeDb()
    context = {
      get: (key: "db" | "jwtPayload") => {
        if (key === "db") return db
        if (key === "jwtPayload") return { sub: 1 }
        throw new Error(`Unknown dependency: ${key}`)
      }
    } as any as Context<{ Variables: AppVariables }>
  })

  describe("getUpcomingBancasVisible", () => {
    it("should return successful result with sorting by orientador", async () => {
      const result = await getUpcomingBancasVisible(
        context,
        "orientador",
        "asc",
        1,
        10,
        undefined
      )

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.bancasWithMembros).toBeDefined()
        expect(result.data.meta).toBeDefined()
        expect(result.data.meta.total).toBeGreaterThanOrEqual(0)
        expect(result.data.meta.currentPage).toBe(1)
        expect(result.data.meta.limit).toBe(10)

        // If there are results, check if they have the required relations
        if (result.data.bancasWithMembros.length > 0) {
          const firstBanca = result.data.bancasWithMembros[0]
          expect(firstBanca.orientador).toBeDefined()
          expect(firstBanca.orientador.nome).toBeDefined()
          expect(firstBanca.curso).toBeDefined()
          expect(firstBanca.membros).toBeDefined()
        }
      }
    })

    it("should return successful result with sorting by curso", async () => {
      const result = await getUpcomingBancasVisible(
        context,
        "curso",
        "desc",
        1,
        10,
        undefined
      )

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.bancasWithMembros).toBeDefined()
        expect(result.data.meta).toBeDefined()

        // If there are results, verify curso relation is loaded
        if (result.data.bancasWithMembros.length > 0) {
          const firstBanca = result.data.bancasWithMembros[0]
          expect(firstBanca.curso).toBeDefined()
          expect(firstBanca.curso.nome).toBeDefined()
        }
      }
    })

    it("should work with search query and sorting", async () => {
      const result = await getUpcomingBancasVisible(
        context,
        "tituloTrabalho",
        "asc",
        1,
        5,
        "test"
      )

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.bancasWithMembros).toBeDefined()
        expect(result.data.meta).toBeDefined()
        expect(result.data.meta.limit).toBe(5)
      }
    })

    it("should handle non-sortable fields gracefully", async () => {
      const result = await getUpcomingBancasVisible(
        context,
        "invalidField",
        "asc",
        1,
        10,
        undefined
      )

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.bancasWithMembros).toBeDefined()
        // Should still return results, just with default ordering
      }
    })
  })

  describe("getPastBancasVisible", () => {
    it("should return successful result with sorting by orientador", async () => {
      const result = await getPastBancasVisible(
        context,
        "orientador",
        "asc",
        1,
        10,
        undefined
      )

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.bancasWithMembros).toBeDefined()
        expect(result.data.meta).toBeDefined()
        expect(result.data.meta.total).toBeGreaterThanOrEqual(0)

        // Verify relations are loaded
        if (result.data.bancasWithMembros.length > 0) {
          const firstBanca = result.data.bancasWithMembros[0]
          expect(firstBanca.orientador).toBeDefined()
          expect(firstBanca.curso).toBeDefined()
          expect(firstBanca.membros).toBeDefined()
        }
      }
    })

    it("should return successful result with sorting by curso", async () => {
      const result = await getPastBancasVisible(
        context,
        "curso",
        "desc",
        1,
        10,
        undefined
      )

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.bancasWithMembros).toBeDefined()
        expect(result.data.meta).toBeDefined()
      }
    })
  })

  describe("getBancasByOrientador", () => {
    it("should return successful result with sorting by orientador", async () => {
      const result = await getBancasByOrientador(
        context,
        1, // Assuming orientador with ID 1 exists
        "orientador",
        "asc",
        1,
        10,
        undefined
      )

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.past).toBeDefined()
        expect(result.data.upcoming).toBeDefined()
        expect(result.data.meta).toBeDefined()
        expect(result.data.meta.total).toBeGreaterThanOrEqual(0)

        // Verify relations are loaded for both past and upcoming
        if (result.data.past.length > 0) {
          const firstPastBanca = result.data.past[0]
          expect(firstPastBanca.orientador).toBeDefined()
          expect(firstPastBanca.curso).toBeDefined()
          expect(firstPastBanca.membros).toBeDefined()
        }

        if (result.data.upcoming.length > 0) {
          const firstUpcomingBanca = result.data.upcoming[0]
          expect(firstUpcomingBanca.orientador).toBeDefined()
          expect(firstUpcomingBanca.curso).toBeDefined()
          expect(firstUpcomingBanca.membros).toBeDefined()
        }
      }
    })

    it("should return successful result with sorting by curso", async () => {
      const result = await getBancasByOrientador(
        context,
        1,
        "curso",
        "desc",
        1,
        5,
        "search test"
      )

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.past).toBeDefined()
        expect(result.data.upcoming).toBeDefined()
        expect(result.data.meta).toBeDefined()
        expect(result.data.meta.limit).toBe(5)
      }
    })

    it("should handle non-existent orientador gracefully", async () => {
      const result = await getBancasByOrientador(
        context,
        99999, // Non-existent orientador ID
        "tituloTrabalho",
        "asc",
        1,
        10,
        undefined
      )

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.past).toEqual([])
        expect(result.data.upcoming).toEqual([])
        expect(result.data.meta.total).toBe(0)
      }
    })
  })

  describe("backwards compatibility", () => {
    it("should work without sorting parameters", async () => {
      const result = await getUpcomingBancasVisible(
        context,
        undefined,
        undefined,
        1,
        10,
        undefined
      )

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.bancasWithMembros).toBeDefined()
        expect(result.data.meta).toBeDefined()
      }
    })

    it("should work with only orderBy parameter", async () => {
      const result = await getPastBancasVisible(
        context,
        "autor",
        undefined, // No order specified
        1,
        10,
        undefined
      )

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.bancasWithMembros).toBeDefined()
        expect(result.data.meta).toBeDefined()
      }
    })

    it("should work with old parameters format", async () => {
      const result = await getUpcomingBancasVisible(
        context,
        "dataRealizacao",
        "asc",
        1,
        10,
        ""
      )

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.bancasWithMembros).toBeDefined()
        expect(result.data.meta).toBeDefined()
      }
    })
  })

  describe("error handling", () => {
    it("should handle database errors gracefully", async () => {
      // Create a context with a broken database connection
      const brokenCtx = {
        get: (key: "db" | "jwtPayload") => {
          if (key === "db") {
            throw new Error("Database connection failed")
          }
          if (key === "jwtPayload") return { sub: 1 }
          throw new Error(`Unknown dependency: ${key}`)
        }
      } as any as Context<{ Variables: AppVariables }>

      const result = await getUpcomingBancasVisible(
        brokenCtx,
        "orientador",
        "asc",
        1,
        10,
        undefined
      )

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.type).toBe("database_error")
      }
    })
  })
})