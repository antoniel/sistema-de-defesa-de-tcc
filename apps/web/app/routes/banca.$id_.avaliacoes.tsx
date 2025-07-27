import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useBanca } from "@/hooks"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/services/useUser"
import { ArrowLeft, BarChart3, CheckCircle, FileText, Save, User } from "lucide-react"
import React, { useState } from "react"
import { useNavigate, useParams } from "react-router"
import type { Route } from "./+types/banca.$id_.avaliacoes"

export const meta: Route.MetaFunction = () => [{ title: "SISDEF - Avaliações da Banca" }]

interface AvaliacaoMembro {
  membroId: number
  nota: string
  comentarios: string
  presente: boolean
}

export default function BancaAvaliacoesPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()

  if (!id) {
    navigate("/")
    return
  }

  const userQuery = useUser()
  const bancaQuery = useBanca(id)

  const user = userQuery.data
  const banca = bancaQuery.data

  // Estado para as avaliações
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoMembro[]>([])
  const [notaFinal, setNotaFinal] = useState("")
  const [observacoes, setObservacoes] = useState("")

  // Verificar permissões: admin, teacher ou membro da banca
  const isAdmin = user?.role === "ADMIN"
  const isTeacher = user?.role === "TEACHER"
  const isMembroBanca = banca?.membros?.some((m) => m.usuario.id === user?.id)
  const hasAccess = isAdmin || isTeacher || isMembroBanca

  const isLoading = bancaQuery.isLoading || userQuery.isLoading
  const error = bancaQuery.error || userQuery.error

  // Inicializar avaliações quando a banca carregar
  React.useEffect(() => {
    if (banca?.membros) {
      const avaliacoesIniciais = banca.membros
        .filter((m) => m.role !== "discente") // Excluir o discente
        .map((m) => ({
          membroId: m.id,
          nota: "",
          comentarios: "",
          presente: true,
        }))
      setAvaliacoes(avaliacoesIniciais)
    }
  }, [banca])

  const handleAvaliacaoChange = (membroId: number, field: keyof AvaliacaoMembro, value: string | boolean) => {
    setAvaliacoes((prev) => prev.map((av) => (av.membroId === membroId ? { ...av, [field]: value } : av)))
  }

  const handleSave = async () => {
    // Aqui você implementaria a lógica para salvar as avaliações
    toast({
      title: "Avaliações salvas",
      description: "As avaliações foram salvas com sucesso.",
    })
  }

  if (isLoading) {
    return <AvaliacoesPageSkeleton />
  }

  if (!hasAccess) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Header className="mb-6" />
        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
          <h2 className="text-xl font-bold mb-2">Acesso negado</h2>
          <p>
            Você não tem permissão para acessar esta página. Apenas administradores, professores e membros da banca
            podem acessar as avaliações.
          </p>
        </div>
        <Button onClick={() => navigate(-1)} variant="outline" className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </div>
    )
  }

  if (error || !banca) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Header className="mb-6" />
        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
          <h2 className="text-xl font-bold mb-2">Erro ao carregar dados da banca</h2>
          <p>{error instanceof Error ? error.message : "Erro desconhecido ao carregar dados da banca."}</p>
        </div>
        <Button onClick={() => navigate(-1)} variant="outline" className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </div>
    )
  }

  const membrosAvaliadores = banca.membros?.filter((m) => m.role !== "discente") || []

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Header className="mb-6" />

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={() => navigate(-1)} variant="outline" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>

          {/* Navegação tipo tabs */}
          <nav className="flex items-center gap-1 ml-6">
            <Button
              variant="ghost"
              className="flex items-center gap-2 relative px-4 py-2 hover:bg-muted border-b-2 border-transparent hover:border-muted-foreground/20"
              onClick={() => navigate(`/banca/${id}`)}
            >
              <User className="h-4 w-4" />
              Detalhes
            </Button>

            {(user?.role === "ADMIN" || user?.role === "TEACHER") && (
              <Button
                variant="ghost"
                className="flex items-center gap-2 relative px-4 py-2 hover:bg-muted border-b-2 border-transparent hover:border-muted-foreground/20"
                onClick={() => navigate(`/banca/${id}/documentos`)}
              >
                <FileText className="h-4 w-4" />
                Documentos
              </Button>
            )}

            {/* Botão Avaliações - para membros da banca */}
            {(user?.role === "ADMIN" || user?.role === "TEACHER") && (
              <Button
                variant="ghost"
                className="flex items-center gap-2 relative px-4 py-2 hover:bg-muted border-b-2 border-primary bg-primary/5"
                onClick={() => {}}
              >
                <BarChart3 className="h-4 w-4" />
                Avaliações
              </Button>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">{/* Área para controles administrativos se necessário */}</div>
      </div>

      <div className="bg-card shadow-md rounded-lg overflow-hidden">
        {/* Cabeçalho */}
        <div className="bg-muted p-6 border-b">
          <div className="flex items-start gap-4">
            <img src="/brasao_ufba.png" alt="Brasão da UFBA" className="w-16 h-16 object-contain" />
            <div className="flex-1">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                Avaliações da Banca
              </h1>
              <p className="text-muted-foreground mt-2">{banca.tituloTrabalho}</p>
              <p className="text-sm text-muted-foreground">
                Autor: {banca.autor} • Curso: {banca.curso?.nome}
              </p>
            </div>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="p-6 space-y-6">
          {/* Avaliações dos membros */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Avaliações dos Membros da Banca</h2>
            <div className="grid gap-4">
              {membrosAvaliadores.map((membro) => {
                const avaliacao = avaliacoes.find((av) => av.membroId === membro.id)
                if (!avaliacao) return null

                return (
                  <Card key={membro.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {membro.usuario.nome}
                      </CardTitle>
                      <CardDescription>
                        {membro.role === "orientador"
                          ? "Orientador"
                          : membro.role === "coorientador"
                            ? "Coorientador"
                            : "Avaliador"}
                        {membro.usuario.academicTitle && ` • ${membro.usuario.academicTitle}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`presente-${membro.id}`}
                          checked={avaliacao.presente}
                          onChange={(e) => handleAvaliacaoChange(membro.id, "presente", e.target.checked)}
                          className="h-4 w-4"
                        />
                        <Label htmlFor={`presente-${membro.id}`} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Presente na defesa
                        </Label>
                      </div>

                      {avaliacao.presente && (
                        <>
                          <div>
                            <Label htmlFor={`nota-${membro.id}`}>Nota (0-10)</Label>
                            <Input
                              id={`nota-${membro.id}`}
                              type="number"
                              min="0"
                              max="10"
                              step="0.1"
                              value={avaliacao.nota}
                              onChange={(e) => handleAvaliacaoChange(membro.id, "nota", e.target.value)}
                              placeholder="Ex: 8.5"
                            />
                          </div>

                          <div>
                            <Label htmlFor={`comentarios-${membro.id}`}>Comentários e Observações</Label>
                            <Textarea
                              id={`comentarios-${membro.id}`}
                              value={avaliacao.comentarios}
                              onChange={(e) => handleAvaliacaoChange(membro.id, "comentarios", e.target.value)}
                              placeholder="Comentários sobre a apresentação, trabalho, etc..."
                              rows={3}
                            />
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Resultado final */}
          <Card>
            <CardHeader>
              <CardTitle>Resultado Final</CardTitle>
              <CardDescription>Nota final e observações gerais da banca</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nota-final">Nota Final (0-10)</Label>
                <Input
                  id="nota-final"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={notaFinal}
                  onChange={(e) => setNotaFinal(e.target.value)}
                  placeholder="Ex: 8.5"
                />
              </div>

              <div>
                <Label htmlFor="observacoes">Observações Gerais da Banca</Label>
                <Textarea
                  id="observacoes"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Observações gerais, recomendações, etc..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Botão salvar */}
          <div className="flex justify-end">
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Salvar Avaliações
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

const AvaliacoesPageSkeleton = () => {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <Header className="mb-6" />
      <div className="space-y-6">
        <div className="flex items-center space-x-4 mb-6">
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="bg-card shadow-md rounded-lg overflow-hidden">
          <div className="bg-muted p-6 border-b">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96 mb-1" />
            <Skeleton className="h-3 w-48" />
          </div>
          <div className="p-6 space-y-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="space-y-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
