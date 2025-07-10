"use client"

import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useQueryParamsState } from "@/hooks/use-query-param-state"
import { useBancasDefesa } from "@/hooks"
import { useUser } from "@/services/useUser"
import { useQuery } from "@tanstack/react-query"
import { Search, Tag, Calendar, MapPin, User, BookOpen } from "lucide-react"
import { useEffect, useState, useMemo } from "react"
import { href } from "react-router"
import { match } from "ts-pattern"

export default function Explorar() {
  const [searchQuery, setSearchQuery] = useQueryParamsState("searchQuery", "")
  const [selectedKeywords, setSelectedKeywords] = useQueryParamsState("keywords", "")
  const [activeTab, setActiveTab] = useQueryParamsState("activeTab", "all")
  
  const userQuery = useUser()
  const bancasDefesaQuery = useBancasDefesa(undefined, undefined, 1, 1000, searchQuery)

  // Extrair palavras-chave únicas de todas as bancas
  const allKeywords = useMemo(() => {
    if (!bancasDefesaQuery.data?.upcoming && !bancasDefesaQuery.data?.past) return []
    
    const allBancas = [
      ...(bancasDefesaQuery.data.upcoming || []),
      ...(bancasDefesaQuery.data.past || [])
    ]
    
    const keywordsSet = new Set<string>()
    allBancas.forEach(banca => {
      if (banca.palavrasChave) {
        const keywords = banca.palavrasChave.split(',').map(k => k.trim().toLowerCase())
        keywords.forEach(keyword => {
          if (keyword.length > 0) {
            keywordsSet.add(keyword)
          }
        })
      }
    })
    
    return Array.from(keywordsSet).sort()
  }, [bancasDefesaQuery.data])

  // Filtrar bancas por palavras-chave selecionadas
  const filteredBancas = useMemo(() => {
    if (!bancasDefesaQuery.data?.upcoming && !bancasDefesaQuery.data?.past) return { upcoming: [], past: [] }
    
    const allBancas = {
      upcoming: bancasDefesaQuery.data.upcoming || [],
      past: bancasDefesaQuery.data.past || []
    }
    
    if (!selectedKeywords) return allBancas
    
    const selectedKeywordsArray = selectedKeywords.split(',').map(k => k.trim().toLowerCase())
    
    const filterByKeywords = (bancas: any[]) => {
      return bancas.filter(banca => {
        if (!banca.palavrasChave) return false
        const bancaKeywords = banca.palavrasChave.split(',').map(k => k.trim().toLowerCase())
        return selectedKeywordsArray.some(selected => 
          bancaKeywords.some(bancaKeyword => bancaKeyword.includes(selected))
        )
      })
    }
    
    return {
      upcoming: filterByKeywords(allBancas.upcoming),
      past: filterByKeywords(allBancas.past)
    }
  }, [bancasDefesaQuery.data, selectedKeywords])

  const handleKeywordClick = (keyword: string) => {
    const currentKeywords = selectedKeywords ? selectedKeywords.split(',') : []
    const keywordLower = keyword.toLowerCase()
    
    if (currentKeywords.includes(keywordLower)) {
      const newKeywords = currentKeywords.filter(k => k !== keywordLower)
      setSelectedKeywords(newKeywords.join(','))
    } else {
      const newKeywords = [...currentKeywords, keywordLower]
      setSelectedKeywords(newKeywords.join(','))
    }
  }

  const clearKeywords = () => {
    setSelectedKeywords("")
  }

  if (bancasDefesaQuery.isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 space-y-4">
        <Header className="mb-6" />
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
          <Skeleton className="h-10 w-full sm:w-1/2" />
        </div>
        <Skeleton className="h-10 w-48 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
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

  const getTableData = () => {
    if (activeTab === "upcoming") {
      return filteredBancas.upcoming
    } else if (activeTab === "past") {
      return filteredBancas.past
    }
    return [...filteredBancas.upcoming, ...filteredBancas.past]
  }

  const tableData = getTableData()

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Header className="mb-6" />
      
      {/* Header da página */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Explorar Defesas</h1>
        <p className="text-muted-foreground">
          Descubra defesas de TCC organizadas por temas e palavras-chave
        </p>
      </div>

      {/* Barra de pesquisa */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="relative w-full max-w-lg">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="search"
            placeholder="Buscar por título, autor, orientador..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Palavras-chave */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Palavras-chave
          </h2>
          {selectedKeywords && (
            <Button variant="outline" size="sm" onClick={clearKeywords}>
              Limpar filtros
            </Button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {allKeywords.map((keyword) => {
            const isSelected = selectedKeywords.includes(keyword.toLowerCase())
            return (
              <Badge
                key={keyword}
                variant={isSelected ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/80 transition-colors"
                onClick={() => handleKeywordClick(keyword)}
              >
                {keyword}
              </Badge>
            )
          })}
        </div>
        
        {selectedKeywords && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Filtros ativos: <span className="font-medium">{selectedKeywords}</span>
            </p>
          </div>
        )}
      </div>

      {/* Abas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">Todas ({tableData.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Próximas ({filteredBancas.upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Anteriores ({filteredBancas.past.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <BancasGrid bancas={tableData} />
        </TabsContent>
        
        <TabsContent value="upcoming">
          <BancasGrid bancas={filteredBancas.upcoming} />
        </TabsContent>
        
        <TabsContent value="past">
          <BancasGrid bancas={filteredBancas.past} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function BancasGrid({ bancas }: { bancas: any[] }) {
  if (bancas.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhuma defesa encontrada</h3>
        <p className="text-muted-foreground">
          Tente ajustar os filtros ou palavras-chave para encontrar mais resultados.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {bancas.map((banca) => (
        <BancaCard key={banca.id} banca={banca} />
      ))}
    </div>
  )
}

function BancaCard({ banca }: { banca: any }) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getKeywords = (palavrasChave: string) => {
    return palavrasChave.split(',').map(k => k.trim()).slice(0, 3)
  }

  const isUpcoming = new Date(banca.dataRealizacao) > new Date()

  return (
    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-2 mb-2">
            {banca.tituloTrabalho}
          </CardTitle>
          <Badge variant={isUpcoming ? "default" : "secondary"}>
            {isUpcoming ? "Próxima" : "Concluída"}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">
          {banca.resumo}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Informações principais */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{banca.autor}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{formatDate(banca.dataRealizacao)}</span>
          </div>
          
          {banca.local && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{banca.local}</span>
            </div>
          )}
        </div>

        {/* Palavras-chave */}
        {banca.palavrasChave && (
          <div>
            <div className="flex flex-wrap gap-1">
              {getKeywords(banca.palavrasChave).map((keyword, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {keyword}
                </Badge>
              ))}
              {banca.palavrasChave.split(',').length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{banca.palavrasChave.split(',').length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Botão para ver detalhes */}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-3"
          onClick={() => window.location.href = href(`/banca/${banca.id}`)}
        >
          Ver detalhes
        </Button>
      </CardContent>
    </Card>
  )
}