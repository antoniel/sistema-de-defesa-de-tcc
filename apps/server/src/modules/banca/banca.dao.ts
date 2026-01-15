import { and, asc, desc, eq, gte, ilike, inArray, lt, ne, or, type SQL } from "drizzle-orm"
import type { Context } from "hono"
import type { InferResultType } from "../../database"
import { Bancas, Cursos, Users, usuariosBancas } from "../../database/schema"
import type { AppVariables } from "../../types"

export interface BancaSearchFilters {
  searchQuery?: string
  orientadorId?: number
  visible?: boolean
  userId?: number
  userRole?: "ADMIN" | "TEACHER" | "STUDENT"
}

export interface BancaSortOptions {
  orderBy?: string
  order?: "asc" | "desc"
}

export interface BancaPaginationOptions {
  page: number
  limit: number
}

export interface BancaQueryOptions extends BancaSearchFilters, BancaSortOptions, BancaPaginationOptions {}

const FIELD_MAP: Record<string, any> = {
  dataRealizacao: Bancas.dataRealizacao,
  tituloTrabalho: Bancas.tituloTrabalho,
  autor: Bancas.autor,
  local: Bancas.local,
  orientador: Users.nome,
  curso: Cursos.nome,
}

const SORTABLE_FIELDS = Object.keys(FIELD_MAP)
const JOIN_FIELDS = ["orientador", "curso"]

export class BancaDAO {
  constructor(private db: Context<{ Variables: AppVariables }>["get"]) {}

  /**
   * Build search conditions for queries with joins (can reference related tables)
   */
  private buildSearchConditionWithJoins(searchQuery?: string): SQL | undefined {
    if (!searchQuery) return undefined

    return or(
      ilike(Bancas.tituloTrabalho, `%${searchQuery}%`),
      ilike(Bancas.autor, `%${searchQuery}%`),
      ilike(Users.nome, `%${searchQuery}%`),
      ilike(Cursos.nome, `%${searchQuery}%`)
    )
  }

  /**
   * Build search conditions for queries without joins (main table only)
   */
  private buildSearchConditionMainTable(searchQuery?: string): SQL | undefined {
    if (!searchQuery) return undefined

    return or(ilike(Bancas.tituloTrabalho, `%${searchQuery}%`), ilike(Bancas.autor, `%${searchQuery}%`))
  }

  /**
   * Build where conditions for queries with joins
   */
  private buildWhereConditionWithJoins(filters: BancaSearchFilters): SQL {
    const conditions: SQL[] = []

    if (filters.visible !== undefined) {
      conditions.push(eq(Bancas.visible, filters.visible))
    }

    if (filters.orientadorId !== undefined) {
      conditions.push(eq(Bancas.orientadorId, filters.orientadorId))
    }

    const searchCondition = this.buildSearchConditionWithJoins(filters.searchQuery)
    if (searchCondition) {
      conditions.push(searchCondition)
    }

    return conditions.length > 1 ? and(...conditions)! : conditions[0]
  }

  /**
   * Build where conditions for queries without joins
   */
  private buildWhereConditionMainTable(filters: BancaSearchFilters): SQL {
    const conditions: SQL[] = []

    if (filters.visible !== undefined) {
      conditions.push(eq(Bancas.visible, filters.visible))
    }

    if (filters.orientadorId !== undefined) {
      conditions.push(eq(Bancas.orientadorId, filters.orientadorId))
    }

    const searchCondition = this.buildSearchConditionMainTable(filters.searchQuery)
    if (searchCondition) {
      conditions.push(searchCondition)
    }

    return conditions.length > 1 ? and(...conditions)! : conditions[0]
  }

  /**
   * Get order clause for sorting
   */
  private getOrderClause(sortOptions: BancaSortOptions, defaultOrder: "asc" | "desc" = "desc"): SQL {
    const { orderBy, order } = sortOptions

    if (!orderBy || !SORTABLE_FIELDS.includes(orderBy)) {
      return defaultOrder === "desc" ? desc(Bancas.dataRealizacao) : asc(Bancas.dataRealizacao)
    }

    // For dataRealizacao, always use natural ordering regardless of user preference
    if (orderBy === "dataRealizacao") {
      return defaultOrder === "desc" ? desc(FIELD_MAP[orderBy]) : asc(FIELD_MAP[orderBy])
    }

    const field = FIELD_MAP[orderBy]
    const sortOrder = order || "asc"

    return sortOrder === "desc" ? desc(field) : asc(field)
  }

  /**
   * Check if sorting requires joins
   */
  private needsJoins(orderBy?: string): boolean {
    return orderBy ? JOIN_FIELDS.includes(orderBy) : false
  }

  /**
   * Get total count of bancas matching filters
   */
  async getTotalCount(filters: BancaSearchFilters): Promise<number> {
    const dbInstance = this.db("db")
    const whereCondition = this.buildWhereConditionWithJoins(filters)

    const result = await dbInstance
      .select({ count: Bancas.id })
      .from(Bancas)
      .leftJoin(Users, eq(Bancas.orientadorId, Users.id))
      .leftJoin(Cursos, eq(Bancas.cursoId, Cursos.id))
      .where(whereCondition)

    return result.length
  }

  /**
   * Get bancas with full relations using efficient method
   */
  async getBancasWithRelations(
    options: BancaQueryOptions,
    dateFilter?: { past?: boolean; upcoming?: boolean }
  ): Promise<InferResultType<"Bancas", { curso: true; orientador: true; membros: { with: { usuario: true } } }>[]> {
    const dbInstance = this.db("db")
    const { page, limit, orderBy } = options
    const offset = (page - 1) * limit
    const needsJoins = this.needsJoins(orderBy)

    // Add date filters to the main filters
    const filters = { ...options }
    let whereConditionWithJoins = this.buildWhereConditionWithJoins(filters)
    let whereConditionMainTable = this.buildWhereConditionMainTable(filters)

    // Apply date filters
    if (dateFilter?.past) {
      whereConditionWithJoins = whereConditionWithJoins
        ? and(whereConditionWithJoins, lt(Bancas.dataRealizacao, new Date()))!
        : lt(Bancas.dataRealizacao, new Date())
      whereConditionMainTable = whereConditionMainTable
        ? and(whereConditionMainTable, lt(Bancas.dataRealizacao, new Date()))!
        : lt(Bancas.dataRealizacao, new Date())
    }

    if (dateFilter?.upcoming) {
      whereConditionWithJoins = whereConditionWithJoins
        ? and(whereConditionWithJoins, gte(Bancas.dataRealizacao, new Date()))!
        : gte(Bancas.dataRealizacao, new Date())
      whereConditionMainTable = whereConditionMainTable
        ? and(whereConditionMainTable, gte(Bancas.dataRealizacao, new Date()))!
        : gte(Bancas.dataRealizacao, new Date())
    }

    // Determine default order based on date filter
    let defaultOrder: "asc" | "desc" = "desc"
    if (dateFilter?.upcoming) {
      defaultOrder = "asc" // Upcoming: closest first (for dataRealizacao) or any field default
    } else if (dateFilter?.past) {
      defaultOrder = "desc" // Past: most recent first (for dataRealizacao) or any field default
    }

    const orderClause = this.getOrderClause(options, defaultOrder)

    if (needsJoins) {
      // Use core Drizzle API with explicit joins for sorting by related fields
      const bancasResult = await dbInstance
        .select({ banca: Bancas })
        .from(Bancas)
        .leftJoin(Users, eq(Bancas.orientadorId, Users.id))
        .leftJoin(Cursos, eq(Bancas.cursoId, Cursos.id))
        .where(whereConditionWithJoins)
        .orderBy(orderClause)
        .limit(limit)
        .offset(offset)

      // Now fetch the full data with relations for the found bancas
      const bancaIds = bancasResult.map((row) => row.banca.id)
      if (bancaIds.length === 0) return []

      const bancasWithRelations = await dbInstance.query.Bancas.findMany({
        where: inArray(Bancas.id, bancaIds),
        with: {
          orientador: true,
          curso: true,
          membros: {
            with: {
              usuario: true,
            },
          },
        },
      })

      // Sort the results to match the original order from the join query
      const orderMap = new Map(bancasResult.map((row, index) => [row.banca.id, index]))
      bancasWithRelations.sort((a, b) => (orderMap.get(a.id) || 0) - (orderMap.get(b.id) || 0))

      return bancasWithRelations
    } else {
      // Use query API for non-join sorting (faster)
      return await dbInstance.query.Bancas.findMany({
        where: whereConditionMainTable,
        orderBy: orderClause,
        limit,
        offset,
        with: {
          orientador: true,
          curso: true,
          membros: {
            with: {
              usuario: true,
            },
          },
        },
      })
    }
  }

  /**
   * Get upcoming bancas (future defenses)
   * If userId and userRole provided, includes invisible bancas where user is a member
   */
  async getUpcomingBancas(
    options: BancaQueryOptions & { userId?: number; userRole?: "ADMIN" | "TEACHER" | "STUDENT" }
  ): Promise<{
    bancas: InferResultType<"Bancas", { curso: true; orientador: true; membros: { with: { usuario: true } } }>[]
    total: number
  }> {
    const dbInstance = this.db("db")

    // If admin, show all bancas
    if (options.userRole === "ADMIN") {
      const filters = { ...options }
      const bancas = await this.getBancasWithRelations(filters, { upcoming: true })
      const whereCondition = and(this.buildWhereConditionWithJoins(filters), gte(Bancas.dataRealizacao, new Date()))
      const totalResult = await dbInstance
        .select({ count: Bancas.id })
        .from(Bancas)
        .leftJoin(Users, eq(Bancas.orientadorId, Users.id))
        .leftJoin(Cursos, eq(Bancas.cursoId, Cursos.id))
        .where(whereCondition)
      return { bancas, total: totalResult.length }
    }

    // Get visible bancas
    const filters = { ...options, visible: true }
    let bancas = await this.getBancasWithRelations(filters, { upcoming: true })

    // If userId provided, also get user's invisible bancas
    if (options.userId) {
      const userBancaIds = await dbInstance
        .select({ bancaId: usuariosBancas.bancaId })
        .from(usuariosBancas)
        .where(eq(usuariosBancas.usuarioId, options.userId))

      if (userBancaIds.length > 0) {
        const invisibleFilters = { ...options, visible: false }
        const invisibleBancas = await this.getBancasWithRelations(invisibleFilters, { upcoming: true })
        const userInvisibleBancas = invisibleBancas.filter((b) => userBancaIds.some((ub) => ub.bancaId === b.id))
        bancas = [...bancas, ...userInvisibleBancas]
      }
    }

    const whereCondition = and(this.buildWhereConditionWithJoins(filters), gte(Bancas.dataRealizacao, new Date()))
    const totalResult = await dbInstance
      .select({ count: Bancas.id })
      .from(Bancas)
      .leftJoin(Users, eq(Bancas.orientadorId, Users.id))
      .leftJoin(Cursos, eq(Bancas.cursoId, Cursos.id))
      .where(whereCondition)

    return { bancas, total: totalResult.length }
  }

  /**
   * Get past bancas (completed defenses)
   * If userId and userRole provided, includes invisible bancas where user is a member
   */
  async getPastBancas(
    options: BancaQueryOptions & { userId?: number; userRole?: "ADMIN" | "TEACHER" | "STUDENT" }
  ): Promise<{
    bancas: InferResultType<"Bancas", { curso: true; orientador: true; membros: { with: { usuario: true } } }>[]
    total: number
  }> {
    const dbInstance = this.db("db")

    // If admin, show all bancas
    if (options.userRole === "ADMIN") {
      const filters = { ...options }
      const bancas = await this.getBancasWithRelations(filters, { past: true })
      const whereCondition = and(this.buildWhereConditionWithJoins(filters), lt(Bancas.dataRealizacao, new Date()))
      const totalResult = await dbInstance
        .select({ count: Bancas.id })
        .from(Bancas)
        .leftJoin(Users, eq(Bancas.orientadorId, Users.id))
        .leftJoin(Cursos, eq(Bancas.cursoId, Cursos.id))
        .where(whereCondition)
      return { bancas, total: totalResult.length }
    }

    // Get visible bancas
    const filters = { ...options, visible: true }
    let bancas = await this.getBancasWithRelations(filters, { past: true })

    // If userId provided, also get user's invisible bancas
    if (options.userId) {
      const userBancaIds = await dbInstance
        .select({ bancaId: usuariosBancas.bancaId })
        .from(usuariosBancas)
        .where(eq(usuariosBancas.usuarioId, options.userId))

      if (userBancaIds.length > 0) {
        const invisibleFilters = { ...options, visible: false }
        const invisibleBancas = await this.getBancasWithRelations(invisibleFilters, { past: true })
        const userInvisibleBancas = invisibleBancas.filter((b) => userBancaIds.some((ub) => ub.bancaId === b.id))
        bancas = [...bancas, ...userInvisibleBancas]
      }
    }

    const whereCondition = and(this.buildWhereConditionWithJoins(filters), lt(Bancas.dataRealizacao, new Date()))
    const totalResult = await dbInstance
      .select({ count: Bancas.id })
      .from(Bancas)
      .leftJoin(Users, eq(Bancas.orientadorId, Users.id))
      .leftJoin(Cursos, eq(Bancas.cursoId, Cursos.id))
      .where(whereCondition)

    return { bancas, total: totalResult.length }
  }

  /**
   * Get bancas by orientador (for "my defenses" functionality)
   */
  async getBancasByOrientador(options: BancaQueryOptions & { orientadorId: number }): Promise<{
    past: InferResultType<"Bancas", { curso: true; orientador: true; membros: { with: { usuario: true } } }>[]
    upcoming: InferResultType<"Bancas", { curso: true; orientador: true; membros: { with: { usuario: true } } }>[]
    total: number
  }> {
    const filters = { ...options }

    const [pastBancas, upcomingBancas, total] = await Promise.all([
      this.getBancasWithRelations(options, { past: true }),
      this.getBancasWithRelations(options, { upcoming: true }),
      this.getTotalCount(filters),
    ])

    return {
      past: pastBancas,
      upcoming: upcomingBancas,
      total,
    }
  }

  /**
   * Get bancas where user is a member (avaliador) but not orientador
   * Simplified: query usuariosBancas, join with Bancas + relations, then split past/upcoming
   */
  async getBancasByMember(options: BancaQueryOptions & { userId: number }): Promise<{
    past: InferResultType<"Bancas", { curso: true; orientador: true }>[]
    upcoming: InferResultType<"Bancas", { curso: true; orientador: true }>[]
    total: number
  }> {
    const dbInstance = this.db("db")
    const now = new Date()

    // Single query: get all bancas where user is avaliador (not orientador)
    const bancaIds = await dbInstance
      .select({ bancaId: usuariosBancas.bancaId })
      .from(usuariosBancas)
      .innerJoin(Bancas, eq(usuariosBancas.bancaId, Bancas.id))
      .where(
        and(
          eq(usuariosBancas.usuarioId, options.userId),
          eq(usuariosBancas.role, "avaliador"),
          ne(Bancas.orientadorId, options.userId)
        )
      )

    if (bancaIds.length === 0) {
      return { past: [], upcoming: [], total: 0 }
    }

    const ids = bancaIds.map((b) => b.bancaId)

    // Build search condition
    let whereCondition: SQL | undefined = inArray(Bancas.id, ids)
    const searchCondition = this.buildSearchConditionMainTable(options.searchQuery)
    if (searchCondition) {
      whereCondition = and(whereCondition, searchCondition)!
    }

    // Fetch all matching bancas with only needed relations (no membros)
    const allBancas = await dbInstance.query.Bancas.findMany({
      where: whereCondition,
      orderBy: desc(Bancas.dataRealizacao),
      with: {
        orientador: true,
        curso: true,
      },
    })

    // Split past/upcoming in memory
    const past = allBancas.filter((b) => b.dataRealizacao < now)
    const upcoming = allBancas.filter((b) => b.dataRealizacao >= now).reverse() // ascending order

    return {
      past,
      upcoming,
      total: allBancas.length,
    }
  }
}
