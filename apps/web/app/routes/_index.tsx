"use client"

import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { rpcReturn } from "@/lib/utils"
import apiClient from "@/services/apiClient"
import { useUser } from "@/services/useUser"
import { useQuery } from "@tanstack/react-query"
import { ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import { href, useNavigate } from "react-router"
import { match } from "ts-pattern"

const useBancasDefesa = (orderBy?: string, order?: "asc" | "desc") => {
  return useQuery({
    queryKey: ["bancas", orderBy, order],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (orderBy) params.set("orderBy", orderBy)
      if (order) params.set("order", order)

      const res = await apiClient.banca.$get({
        query: Object.fromEntries(params),
      })
      return rpcReturn(res)
    },
  })
}

type BancasDefesa = (ReturnType<typeof useBancasDefesa>["data"] & {})["past"]

export default function Home() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("upcoming")
  const [sortField, setSortField] = useState<string>("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  const userQuery = useUser()
  const bancasDefesaQuery = useBancasDefesa(sortField || undefined, sortField ? sortOrder : undefined)

  const isTeacher = userQuery.data?.role === "TEACHER"

  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle order if same field
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      // New field, default to ascending
      setSortField(field)
      setSortOrder("asc")
    }
  }

  if (bancasDefesaQuery.isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 space-y-4">
        <Header className="mb-6" />
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
          <Skeleton className="h-10 w-full sm:w-1/2" />
          {isTeacher && <Skeleton className="h-10 w-full sm:w-auto px-8" />}
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

  if (bancasDefesaQuery.isError) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Header className="mb-6" />
        <div className="text-red-600">
          Erro ao carregar as defesas: {bancasDefesaQuery.error?.message || "Erro desconhecido"}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Header className="mb-6" />
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <Input
          id="banca-search"
          type="search"
          placeholder="Buscar defesas, alunos, orientadores ou avaliadores..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-lg w-full"
        />
        {!!userQuery.data && <Button onClick={() => navigate("/add-banca")}>Cadastrar Defesa de TCC</Button>}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="upcoming">Próximas defesas</TabsTrigger>
          <TabsTrigger value="past">Defesas anteriores</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">
          <div className="border rounded-md overflow-x-auto">
            <HomeTable
              data={bancasDefesaQuery.data?.upcoming || []}
              searchQuery={searchQuery}
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={handleSort}
            />
          </div>
        </TabsContent>
        <TabsContent value="past">
          <div className="border rounded-md overflow-x-auto">
            <HomeTable
              data={bancasDefesaQuery.data?.past || []}
              searchQuery={searchQuery}
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={handleSort}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

const columns = [
  { key: "dataRealizacao", header: "Data", minWidth: "160px", sortable: true },
  { key: "tituloTrabalho", header: "Título do Trabalho", minWidth: "400px", sortable: true },
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

  // Filter data based on search query
  const filteredData = props.data.filter(
    (banca) =>
      banca.tituloTrabalho.toLowerCase().includes(props.searchQuery.toLowerCase()) ||
      banca.autor.toLowerCase().includes(props.searchQuery.toLowerCase()) ||
      banca.orientador.nome.toLowerCase().includes(props.searchQuery.toLowerCase()) ||
      banca.curso.nome.toLowerCase().includes(props.searchQuery.toLowerCase())
  )

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
        {filteredData.length > 0 ? (
          filteredData.map((banca) => (
            <TableRow
              key={banca.id}
              onClick={() => goToViewBanca(banca.id)}
              className="cursor-pointer hover:bg-muted/50"
            >
              {columns.map((col) => (
                <TableCell key={`${banca.id}-${col.key}`}>
                  {match(col.key)
                    .with("dataRealizacao", () => (
                      <span className="whitespace-nowrap">
                        {new Date(banca.dataRealizacao).toLocaleDateString("pt-BR")}
                      </span>
                    ))
                    .with("tituloTrabalho", () => <span className="whitespace-nowrap">{banca.tituloTrabalho}</span>)
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
