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
import { useNavigate } from "react-router"

export default function Home() {
  const { data: user } = useUser()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("upcoming")

  const {
    data: rawBancasData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["bancas"],
    queryFn: async () => {
      const res = await apiClient.banca.$get()
      return rpcReturn(res)
    },
  })

  const isTeacher = user?.role === "TEACHER"

  if (isLoading) {
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

  if (isError) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Header className="mb-6" />
        <div className="text-red-600">Erro ao carregar as defesas: {error?.message || "Erro desconhecido"}</div>
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
        <Button onClick={() => navigate("/add-banca")}>Cadastrar Defesa de TCC</Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="upcoming">Próximas defesas</TabsTrigger>
          <TabsTrigger value="past">Defesas anteriores</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">
          <div className="border rounded-md overflow-x-auto">
            <HomeTable data={rawBancasData || []} searchQuery={searchQuery} />
          </div>
        </TabsContent>
        <TabsContent value="past">
          <div className="border rounded-md overflow-x-auto">
            <HomeTable data={rawBancasData || []} searchQuery={searchQuery} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface HomeTableProps {
  data: Dry<SelectBanca>[]
  searchQuery: string
}

function HomeTable(props: HomeTableProps) {
  const navigate = useNavigate()

  const columns = [
    { key: "formatedData", header: "Data", minWidth: "160px" },
    { key: "tituloTrabalho", header: "Título do Trabalho", minWidth: "400px" },
    { key: "autor", header: "Discente", minWidth: "150px" },
    { key: "nomeOrientador", header: "Orientador", minWidth: "150px" },
    { key: "siglaCurso", header: "Curso", minWidth: "80px" },
    { key: "local", header: "Virtual", minWidth: "200px" },
    { key: "actions", header: "Ações", minWidth: "100px" },
  ]

  const goToViewBanca = (bancaId: string | number) => {
    navigate(`/verbanca?id=${bancaId}`)
  }

  const renderCellContent = (banca: Dry<SelectBanca>, columnKey: string) => {
    switch (columnKey) {
      case "local":
        const isRemote = banca.modalidade === "remoto"
        const isUrl = isRemote && banca.local?.startsWith("http")
        return isUrl ? (
          <a
            href={banca.local ?? ""}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:underline break-all"
          >
            {banca.local}
          </a>
        ) : (
          <span className="break-words">{banca.local}</span>
        )
      case "actions":
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              goToViewBanca(banca.id)
            }}
            aria-label={`Ver detalhes da banca ${banca.tituloTrabalho}`}
          >
            Ver
          </Button>
        )
      case "formatedData":
        return <span className="whitespace-nowrap">{banca.dataRealizacao}</span>
      default:
        const value = banca[columnKey as keyof Dry<SelectBanca>]
        return (typeof value === "string" || typeof value === "number" ? value : JSON.stringify(value)) || "N/A"
    }
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
              onDoubleClick={() => goToViewBanca(banca.id)}
              className="cursor-pointer hover:bg-muted/50"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  goToViewBanca(banca.id)
                }
              }}
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
