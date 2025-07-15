"use client"

import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useQueryParamsState } from "@/hooks/use-query-param-state"
import { useUser } from "@/services/useUser"
import { ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react"
import { useEffect, useState } from "react"
import { href, useNavigate } from "react-router"
import { match } from "ts-pattern"

import { useUpcomingBancasDefesa, usePastBancasDefesa, useMyDefesas } from "@/hooks"

type BancasDefesa = ReturnType<typeof useUpcomingBancasDefesa>["data"] & {}

export default function Home() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useQueryParamsState("searchQuery", "")
  const [activeTab, setActiveTab] = useQueryParamsState("activeTab", "upcoming")
  const [sortField, setSortField] = useState<string>("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [rowsPerPage, setRowsPerPage] = useState<number>(10)
  const [upcomingCurrentPage, setUpcomingCurrentPage] = useState<number>(1)
  const [pastCurrentPage, setPastCurrentPage] = useState<number>(1)

  const userQuery = useUser()
  const upcomingBancasQuery = useUpcomingBancasDefesa(
    sortField || undefined,
    sortField ? sortOrder : undefined,
    upcomingCurrentPage,
    rowsPerPage,
    searchQuery
  )
  const pastBancasQuery = usePastBancasDefesa(
    sortField || undefined,
    sortField ? sortOrder : undefined,
    pastCurrentPage,
    rowsPerPage,
    searchQuery
  )
  const myDefesasQuery = useMyDefesas(
    sortField || undefined,
    sortField ? sortOrder : undefined,
    activeTab === "upcoming" ? upcomingCurrentPage : pastCurrentPage,
    rowsPerPage,
    searchQuery
  )

  // Reset pages when search query changes
  useEffect(() => {
    setUpcomingCurrentPage(1)
    setPastCurrentPage(1)
  }, [searchQuery])

  // Reset pages when tab changes
  useEffect(() => {
    setUpcomingCurrentPage(1)
    setPastCurrentPage(1)
  }, [activeTab])

  const isTeacherOrAdmin = userQuery.data?.role === "TEACHER" || userQuery.data?.role === "ADMIN"

  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle order if same field
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      // New field, default to ascending
      setSortField(field)
      setSortOrder("asc")
    }
    setUpcomingCurrentPage(1) // Reset to first page when sorting
    setPastCurrentPage(1)
  }

  if (upcomingBancasQuery.isLoading && pastBancasQuery.isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 space-y-4">
        <Header className="mb-6" />
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
          <Skeleton className="h-10 w-full sm:w-1/2" />
          {isTeacherOrAdmin && <Skeleton className="h-10 w-full sm:w-auto px-8" />}
        </div>
        <Skeleton className="h-10 w-48 mb-4" />
        <div className="border rounded-md p-4">
          <Skeleton className="h-8 w-full mb-2" />
          <Skeleton className="h-12 w-full mb-2" />
          <Skeleton className="h-12 w-full mb-2" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    )
  }

  if (upcomingBancasQuery.isError || pastBancasQuery.isError) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Header className="mb-6" />
        <div className="text-red-600">
          Erro ao carregar as defesas: {upcomingBancasQuery.error?.message || pastBancasQuery.error?.message || "Erro desconhecido"}
        </div>
      </div>
    )
  }

  const getTableData = () => {
    if (activeTab === "my-defesas") {
      return {
        upcoming: myDefesasQuery.data?.upcoming || [],
        past: myDefesasQuery.data?.past || [],
        meta: myDefesasQuery.data?.meta,
      }
    }
    
    if (activeTab === "upcoming") {
      return {
        upcoming: upcomingBancasQuery.data?.data || [],
        past: [],
        meta: upcomingBancasQuery.data?.meta,
      }
    }
    
    if (activeTab === "past") {
      return {
        upcoming: [],
        past: pastBancasQuery.data?.data || [],
        meta: pastBancasQuery.data?.meta,
      }
    }
    
    // Default fallback
    return {
      upcoming: upcomingBancasQuery.data?.data || [],
      past: pastBancasQuery.data?.data || [],
      meta: activeTab === "upcoming" ? upcomingBancasQuery.data?.meta : pastBancasQuery.data?.meta,
    }
  }

  const tableData = getTableData()

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Header className="mb-6" />
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <Input
            id="banca-search"
            type="search"
            placeholder="Buscar defesas, alunos, orientadores ou avaliadores..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-lg w-full"
          />
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-sm text-muted-foreground">Exibir:</span>
            <Select
              value={rowsPerPage.toString()}
              onValueChange={(value) => {
                setRowsPerPage(Number(value))
                setUpcomingCurrentPage(1) // Reset to first page when changing rows per page
    setPastCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="30">30</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">linhas</span>
          </div>
        </div>
        {!!userQuery.data && <Button onClick={() => navigate("/add-banca")}>Cadastrar Defesa de TCC</Button>}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="upcoming" data-testid="upcoming-tab">Próximas defesas</TabsTrigger>
          <TabsTrigger value="past" data-testid="past-tab">Defesas anteriores</TabsTrigger>
          {isTeacherOrAdmin && <TabsTrigger value="my-defesas" data-testid="my-defesas-tab">Minhas defesas</TabsTrigger>}
        </TabsList>
        {tableData.upcoming.length > 0 && (
          <TabsContent value="upcoming">
            <div data-testid="defense-table">
              <TableWithInfo
                data={tableData.upcoming}
                searchQuery={searchQuery}
                sortField={sortField}
                sortOrder={sortOrder}
                onSort={handleSort}
                rowsPerPage={rowsPerPage}
                currentPage={upcomingCurrentPage}
                onPageChange={setUpcomingCurrentPage}
                meta={tableData.meta}
              />
            </div>
          </TabsContent>
        )}
        <TabsContent value="past">
          <div data-testid="defense-table">
            <TableWithInfo
              data={tableData.past}
              searchQuery={searchQuery}
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={handleSort}
              rowsPerPage={rowsPerPage}
              currentPage={pastCurrentPage}
              onPageChange={setPastCurrentPage}
              meta={tableData.meta}
            />
          </div>
        </TabsContent>
        {isTeacherOrAdmin && (
          <TabsContent value="my-defesas">
            {myDefesasQuery.isLoading ? (
              <div className="border rounded-md p-4">
                <Skeleton className="h-8 w-full mb-2" />
                <Skeleton className="h-12 w-full mb-2" />
                <Skeleton className="h-12 w-full mb-2" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : myDefesasQuery.isError ? (
              <div className="text-red-600 p-4">
                Erro ao carregar suas defesas: {myDefesasQuery.error?.message || "Erro desconhecido"}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="border rounded-md">
                    <div className="p-4 border-b">
                      <h3 className="text-lg font-semibold">Próximas defesas</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <HomeTable
                        data={tableData.upcoming}
                        searchQuery={searchQuery}
                        sortField={sortField}
                        sortOrder={sortOrder}
                        onSort={handleSort}
                        rowsPerPage={rowsPerPage}
                      />
                    </div>
                  </div>
                  {tableData.meta && (
                    <div className="flex items-center justify-between px-4 pt-2">
                      <div className="text-sm text-muted-foreground">
                        Exibindo {tableData.upcoming.length} de {tableData.meta.total} resultado
                        {tableData.meta.total !== 1 ? "s" : ""}
                        {searchQuery && ` para "${searchQuery}"`}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUpcomingCurrentPage(upcomingCurrentPage - 1)}
                          disabled={!tableData.meta.hasPrev}
                        >
                          Anterior
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          Página {tableData.meta.currentPage} de {tableData.meta.totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUpcomingCurrentPage(upcomingCurrentPage + 1)}
                          disabled={!tableData.meta.hasNext}
                        >
                          Próximo
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <div className="border rounded-md">
                    <div className="p-4 border-b">
                      <h3 className="text-lg font-semibold">Defesas anteriores</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <HomeTable
                        data={tableData.past}
                        searchQuery={searchQuery}
                        sortField={sortField}
                        sortOrder={sortOrder}
                        onSort={handleSort}
                        rowsPerPage={rowsPerPage}
                      />
                    </div>
                  </div>
                  {tableData.meta && (
                    <div className="flex items-center justify-between px-4 pt-2">
                      <div className="text-sm text-muted-foreground">
                        Exibindo {tableData.past.length} de {tableData.meta.total} resultado
                        {tableData.meta.total !== 1 ? "s" : ""}
                        {searchQuery && ` para "${searchQuery}"`}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPastCurrentPage(pastCurrentPage - 1)}
                          disabled={!tableData.meta.hasPrev}
                        >
                          Anterior
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          Página {tableData.meta.currentPage} de {tableData.meta.totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPastCurrentPage(pastCurrentPage + 1)}
                          disabled={!tableData.meta.hasNext}
                        >
                          Próximo
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

const columns = [
  { key: "dataRealizacao", header: "Data", minWidth: "100px", sortable: true },
  { key: "tituloTrabalho", header: "Título do Trabalho", minWidth: "350px", sortable: true },
  { key: "autor", header: "Discente", minWidth: "120px", sortable: true },
  { key: "orientador", header: "Orientador", minWidth: "150px", sortable: true },
  { key: "curso", header: "Curso", minWidth: "80px", sortable: true },
  { key: "local", header: "Virtual", minWidth: "200px", sortable: true },
] as const

function HomeTable(props: {
  data: BancasDefesa
  searchQuery: string
  sortField: string
  sortOrder: "asc" | "desc"
  onSort: (field: string) => void
  rowsPerPage: number
}) {
  const navigate = useNavigate()

  const goToViewBanca = (bancaId: string | number) => {
    navigate(href("/banca/:id", { id: String(bancaId) }))
  }

  const getSortIcon = (columnKey: string) => {
    if (props.sortField !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
    }
    return props.sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  // Data is already filtered and paginated by the backend
  const paginatedData = props.data

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead
              key={col.key}
              style={{ minWidth: col.minWidth }}
              className={col.sortable ? "cursor-pointer select-none hover:bg-muted/50" : ""}
              onClick={() => col.sortable && props.onSort(col.key)}
            >
              <div className="flex items-center gap-2">
                {col.header}
                {col.sortable && getSortIcon(col.key)}
              </div>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {paginatedData.length > 0 ? (
          paginatedData.map((banca) => (
            <TableRow
              key={banca.id}
              onClick={() => goToViewBanca(banca.id)}
              className="cursor-pointer hover:bg-muted/50"
            >
              {columns.map((col) => (
                <TableCell key={`${banca.id}-${col.key}`}>
                  {match(col.key)
                    .with("dataRealizacao", () => (
                      <span className="whitespace-nowrap text-xs">
                        {new Date(banca.dataRealizacao).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "2-digit",
                        })}
                      </span>
                    ))
                    .with("tituloTrabalho", () => (
                      <span className="block" title={banca.tituloTrabalho}>
                        {truncateText(banca.tituloTrabalho, 80)}
                      </span>
                    ))
                    .with("autor", () => <span className="whitespace-nowrap">{banca.autor}</span>)
                    .with("orientador", () => <span className="whitespace-nowrap">{banca.orientador.nome}</span>)
                    .with("curso", () => <span className="whitespace-nowrap">{banca.curso.sigla}</span>)
                    .with("local", () => <span className="whitespace-nowrap">{banca.local}</span>)
                    .otherwise(() => null)}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center">
              Nenhuma defesa agendada{props.searchQuery ? " para esta busca." : "."}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}

function TableWithInfo(props: {
  data: BancasDefesa
  searchQuery: string
  sortField: string
  sortOrder: "asc" | "desc"
  onSort: (field: string) => void
  rowsPerPage: number
  currentPage: number
  onPageChange: (page: number) => void
  meta?: {
    total: number
    totalPages: number
    currentPage: number
    limit: number
    hasNext: boolean
    hasPrev: boolean
  }
}) {
  const meta = props.meta

  return (
    <div>
      <div className="border rounded-md overflow-x-auto">
        <HomeTable {...props} />
      </div>
      {meta && (
        <div className="flex items-center justify-between px-4 pt-2">
          <div className="text-sm text-muted-foreground">
            Exibindo {props.data.length} de {meta.total} resultado{meta.total !== 1 ? "s" : ""}
            {props.searchQuery && ` para "${props.searchQuery}"`}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => props.onPageChange(props.currentPage - 1)}
              disabled={!meta.hasPrev}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {meta.currentPage} de {meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => props.onPageChange(props.currentPage + 1)}
              disabled={!meta.hasNext}
            >
              Próximo
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
