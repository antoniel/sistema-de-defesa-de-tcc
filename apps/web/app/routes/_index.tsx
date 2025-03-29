"use client" // Required for hooks like useState, useEffect, useRouter

import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton" // For loading state
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { fetchBancas } from "../services/bancaService"

// Placeholder function for teacher check - replace with your actual auth logic
const isTeacher = () => true

// Define the data structure for a 'Banca'
export interface Banca {
  id: string | number // Assuming ID can be string or number
  data_realizacao: string // ISO string format from backend
  titulo_trabalho: string
  autor: string
  nome_orientador: string
  sigla_curso: string
  local: string // Can be a URL or physical location
  tipo_banca: "remoto" | "presencial" // Assuming these are the types
  palavras_chave: string[]
  resumo: string
  membros: string[] // Assuming array of member names/IDs
  // Derived properties after processing
  data?: Date
  formatedData?: string
}

// Helper function to match search query
const matchSearchQuery = (element: Banca, query: string): boolean => {
  if (!query) return true // Show all if query is empty

  const lowerCaseQuery = query.toLocaleLowerCase()
  const SEARCH_PROPERTIES: (keyof Banca)[] = [
    // 'ano', // Assuming 'ano' is not directly available, can derive from 'data' if needed
    "autor",
    "formatedData",
    "local",
    "nome_orientador",
    "palavras_chave",
    "resumo",
    "sigla_curso",
    "titulo_trabalho",
    "membros",
  ]

  return SEARCH_PROPERTIES.some((property) => {
    const value = element[property]
    if (Array.isArray(value)) {
      return value.some((item) => String(item).toLocaleLowerCase().includes(lowerCaseQuery))
    }
    return String(value).toLocaleLowerCase().includes(lowerCaseQuery)
  })
}

export default function Home() {
  // State variables
  const [rawData, setRawData] = useState<[Banca[], Banca[]]>([[], []]) // [upcoming, past]
  const [filteredData, setFilteredData] = useState<[Banca[], Banca[]]>([[], []])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("upcoming") // Default tab

  const navigate = useNavigate()

  // Navigation function
  const goToViewBanca = (bancaId: string | number) => {
    navigate(`/verbanca?id=${bancaId}`) // Adjust path if needed
  }

  // Data fetching and processing using the service
  useEffect(() => {
    setLoading(true) // Ensure loading is true at the start

    fetchBancas() // Call the service function
      .then((fetchedEvents: Banca[]) => {
        // The service now directly returns the array of bancas
        let events: Banca[] = fetchedEvents || []

        if (events && Array.isArray(events)) {
          // Process events: format date, sort, split
          events.forEach((e) => {
            e.data = new Date(e.data_realizacao)
            e.data.setSeconds(0) // Consistent time formatting
            e.formatedData = `${e.data.toLocaleDateString()} às ${e.data.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}h`
          })

          const now = new Date()
          events.sort((a, b) => (a.data! < b.data! ? -1 : 1)) // Sort by date

          const upcomingEvents = events.filter((a) => a.data! >= now)
          const pastEvents = events.filter((a) => a.data! < now)

          const allEvents: [Banca[], Banca[]] = [upcomingEvents, pastEvents]
          setRawData(allEvents)
          setFilteredData(allEvents)
        } else {
          // This case might be less likely now as the service handles empty arrays
          console.error("Fetched data is not in the expected format:", events)
          setRawData([[], []])
          setFilteredData([[], []])
        }
      })
      .catch((error) => {
        // Error is already logged in the service, but you can add component-specific handling here
        console.error("Error fetching data in component:", error)
        // Optionally set an error state to display a message to the user
        setRawData([[], []])
        setFilteredData([[], []])
      })
      .finally(() => {
        setLoading(false)
      })
  }, []) // Empty dependency array means this runs once on mount

  // Filter data based on search query whenever rawData or searchQuery changes
  useEffect(() => {
    const upcomingFiltered = rawData[0].filter((banca) => matchSearchQuery(banca, searchQuery))
    const pastFiltered = rawData[1].filter((banca) => matchSearchQuery(banca, searchQuery))
    setFilteredData([upcomingFiltered, pastFiltered])
  }, [searchQuery, rawData])

  // Table Columns Definition (simplified for direct rendering)
  const columns = [
    { key: "formatedData", header: "Data", minWidth: "160px" },
    { key: "titulo_trabalho", header: "Título do Trabalho", minWidth: "400px" }, // Adjusted minWidth
    { key: "autor", header: "Discente", minWidth: "150px" },
    { key: "nome_orientador", header: "Orientador", minWidth: "150px" },
    { key: "sigla_curso", header: "Curso", minWidth: "80px" }, // Adjusted minWidth
    { key: "local", header: "Local ou link", minWidth: "200px" }, // Adjusted minWidth
    { key: "actions", header: "Ações", minWidth: "100px" },
  ]

  const renderCellContent = (banca: Banca, columnKey: string) => {
    switch (columnKey) {
      case "local":
        const isRemote = banca.tipo_banca === "remoto"
        return isRemote ? (
          <a
            href={banca.local}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:underline break-all" // Added break-all for long links
          >
            {banca.local}
          </a>
        ) : (
          <span className="break-words">{banca.local}</span> // Added break-words
        )
      case "actions":
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToViewBanca(banca.id)}
            aria-label={`Ver detalhes da banca ${banca.titulo_trabalho}`}
          >
            Ver
          </Button>
        )
      case "formatedData":
        return <span className="whitespace-nowrap">{banca.formatedData}</span> // Prevent wrapping date/time
      default:
        // Ensure the property exists before trying to access it
        return (banca[columnKey as keyof Banca] as React.ReactNode) || "N/A"
    }
  }

  const renderTable = (data: Banca[]) => (
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
        {data.length > 0 ? (
          data.map((banca) => (
            <TableRow
              key={banca.id}
              onDoubleClick={() => goToViewBanca(banca.id)}
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
              Nenhuma defesa encontrada{searchQuery ? " para esta busca." : "."}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )

  // Render loading state
  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
          <Skeleton className="h-10 w-full sm:w-1/2" />
          {isTeacher() && <Skeleton className="h-10 w-full sm:w-auto px-8" />}
        </div>
        <Skeleton className="h-10 w-48 mb-4" /> {/* Tab List Skeleton */}
        <div className="border rounded-md p-4">
          <Skeleton className="h-8 w-full mb-2" /> {/* Table Header Skeleton */}
          <Skeleton className="h-12 w-full mb-2" />
          <Skeleton className="h-12 w-full mb-2" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    )
  }

  // Render main component
  return (
    <div className="container mx-auto p-4 md:p-8">
      <Header className="mb-6" />
      {/* Search and Add Button Section */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <Input
          id="banca-search"
          type="search" // Use type="search" for better semantics and potential browser features (like clear button)
          placeholder="Buscar defesas, alunos, orientadores ou avaliadores..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-lg w-full" // Control width
        />
        {isTeacher() && (
          <Button onClick={() => navigate("/addbanca")}>
            {" "}
            {/* Adjust path if needed */}
            Cadastrar Defesa de TCC
          </Button>
        )}
      </div>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="upcoming">Próximas defesas</TabsTrigger>
          <TabsTrigger value="past">Defesas anteriores</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">
          <div className="border rounded-md overflow-x-auto">
            {" "}
            {/* Add border and horizontal scroll */}
            {renderTable(filteredData[0])}
          </div>
        </TabsContent>
        <TabsContent value="past">
          <div className="border rounded-md overflow-x-auto">
            {" "}
            {/* Add border and horizontal scroll */}
            {renderTable(filteredData[1])}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
