"use client"

import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Dry } from "@/config/type"
import { rpcReturn } from "@/lib/utils"
import apiClient from "@/services/apiClient"
import { useUser } from "@/services/useUser"
import { useQuery } from "@tanstack/react-query"
import type { SelectBanca } from "@tcc/server"
import { useState } from "react"
import { href, useNavigate } from "react-router"
import { match } from "ts-pattern"

const useBancasDefesa = () => {
  return useQuery({
    queryKey: ["bancas"],
    queryFn: async () => {
      const res = await apiClient.banca.$get()
      return rpcReturn(res)
    },
  })
}
type BancasDefesa = (ReturnType<typeof useBancasDefesa>["data"] & {})["past"]

export default function Home() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("upcoming")

  const userQuery = useUser()
  const bancasDefesaQuery = useBancasDefesa()

  const isTeacher = userQuery.data?.role === "TEACHER"

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
            <HomeTable data={bancasDefesaQuery.data?.upcoming || []} searchQuery={searchQuery} />
          </div>
        </TabsContent>
        <TabsContent value="past">
          <div className="border rounded-md overflow-x-auto">
            <HomeTable data={bancasDefesaQuery.data?.past || []} searchQuery={searchQuery} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface HomeTableProps {
  data: BancasDefesa
  searchQuery: string
}

const columns = [
  { key: "formatedData", header: "Data", minWidth: "160px" },
  { key: "tituloTrabalho", header: "Título do Trabalho", minWidth: "400px" },
  { key: "autor", header: "Discente", minWidth: "120px" },
  { key: "nomeOrientador", header: "Orientador", minWidth: "150px" },
  { key: "siglaCurso", header: "Curso", minWidth: "80px" },
  { key: "local", header: "Virtual", minWidth: "200px" },
] as const

function HomeTable(props: HomeTableProps) {
  const navigate = useNavigate()

  const goToViewBanca = (bancaId: string | number) => {
    navigate(href("/banca/:id", { id: String(bancaId) }))
  }

  const getNomeOrientador = (banca: Dry<SelectBanca>) => {
    return banca.orientador.nome
  }

  const renderCellContent = (banca: Dry<SelectBanca>, columnKey: (typeof columns)[number]["key"]) => {
    return match(columnKey)
      .with("formatedData", () => (
        <span className="whitespace-nowrap">{new Date(banca.dataRealizacao).toLocaleDateString("pt-BR")}</span>
      ))
      .with("tituloTrabalho", () => <span className="whitespace-nowrap">{banca.tituloTrabalho}</span>)
      .with("autor", () => <span className="whitespace-nowrap">{banca.autor}</span>)
      .with("nomeOrientador", () => <span className="whitespace-nowrap">{banca.membros[0].usuario.nome}</span>)
      .with("siglaCurso", () => <span className="whitespace-nowrap">{banca.cursoId}</span>)
      .with("local", () => <span className="whitespace-nowrap">{banca.local}</span>)
      .otherwise(() => null)
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={col.key} style={{ minWidth: col.minWidth }}>
              {col.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {props.data.length > 0 ? (
          props.data.map((banca) => (
            <TableRow
              key={banca.id}
              onClick={() => goToViewBanca(banca.id)}
              className="cursor-pointer hover:bg-muted/50"
            >
              {columns.map((col) => (
                <TableCell key={`${banca.id}-${col.key}`}>{renderCellContent(banca, col.key)}</TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center">
              Nenhuma defesa encontrada{props.searchQuery ? " para esta busca." : "."}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
