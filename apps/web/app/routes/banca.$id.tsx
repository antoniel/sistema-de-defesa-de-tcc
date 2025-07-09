import { Header } from "@/components/layout/Header"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { rpcReturn } from "@/lib/utils"
import apiClient from "@/services/apiClient"
import { useUser } from "@/services/useUser"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Calendar, Clock, MapPin, School, User } from "lucide-react"
import { useNavigate, useParams } from "react-router"

const useDeleteBanca = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.banca[":id"].$delete({ param: { id } })

      return rpcReturn(res as any)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bancas"] })
      navigate("/")
    },
  })
}

const useToggleBancaVisibility = (bancaId: string) => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.banca[":id"]["toggle-visibility"].$patch({
        param: { id: bancaId },
      })
      return rpcReturn(res)
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["banca", bancaId], data)
      toast({
        title: "Visibilidade alterada",
        description: `A banca agora está ${data.visible ? "visível" : "oculta"}.`,
      })
    },
    onError: (error) => {
      toast({
        title: "Erro ao alterar visibilidade",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

export default function BancaDetalhesPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  if (!id) {
    navigate("/")
    return
  }

  const userQuery = useUser()
  const bancaQuery = useBanca(id)
  const deleteBancaMutation = useDeleteBanca()
  const toggleVisibilityMutation = useToggleBancaVisibility(id)

  const banca = bancaQuery.data
  const user = userQuery.data
  const orientador = banca?.membros?.find((m) => m.role === "orientador")?.usuario

  const isAdmin = user?.role === "ADMIN"
  const isOrientador = !!user?.id && user?.id === orientador?.id
  const canEdit = isAdmin || isOrientador
  console.log({ isAdmin, isOrientador, canEdit })

  const isLoading = bancaQuery.isLoading || userQuery.isLoading
  const error = bancaQuery.error || userQuery.error

  const membrosBanca = banca?.membros

  if (isLoading) {
    return <BancaSkeleton />
  }

  const handleDelete = () => {
    if (!id) return
    deleteBancaMutation.mutate(id)
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

  const getMembroPorPapel = (role: string) => {
    return membrosBanca?.find((membro) => membro.role === role)?.usuario
  }

  const coorientador = getMembroPorPapel("coorientador")
  const avaliadores = membrosBanca?.filter((membro) => membro.role === "avaliador") || []

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Header className="mb-6" />

      <div className="mb-6 flex items-center justify-between">
        <Button onClick={() => navigate(-1)} variant="outline" className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>

        {canEdit && (
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="visibility-switch"
                checked={banca.visible}
                onCheckedChange={() => toggleVisibilityMutation.mutate()}
                disabled={toggleVisibilityMutation.isPending}
              />
              <Label htmlFor="visibility-switch" className="flex flex-col">
                <span>Visibilidade</span>
                <span className="text-xs text-muted-foreground">{banca.visible ? "Visível" : "Oculta"}</span>
              </Label>
            </div>
            <Button variant="outline" onClick={() => navigate(`/banca/${id}/edit`)}>
              Editar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Excluir</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Essa ação não pode ser desfeita. Isso irá excluir permanentemente a banca de defesa.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Confirmar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <div className="bg-card shadow-md rounded-lg overflow-hidden">
        {/* Cabeçalho com título do trabalho */}
        <div className="bg-muted p-6 border-b">
          <h1 className="text-2xl font-bold">{banca.tituloTrabalho}</h1>
          <div className="flex items-center mt-2 text-muted-foreground">
            <User className="h-4 w-4 mr-1" />
            <span className="mr-4">{banca.autor}</span>

            <School className="h-4 w-4 mr-1" />
            <span>{banca.curso?.nome}</span>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Coluna da esquerda - Informações da Banca */}
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-4">Detalhes da Defesa</h2>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-primary" />
                    <div>
                      <p className="font-medium">Data</p>
                      <p className="text-muted-foreground">{formatDate(banca.dataRealizacao)}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-primary" />
                    <div>
                      <p className="font-medium">Horário</p>
                      <p className="text-muted-foreground">{formatTime(banca.dataRealizacao)}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-primary" />
                    <div>
                      <p className="font-medium">{banca.modalidade === "remoto" ? "Link" : "Local"}</p>
                      {banca.modalidade === "remoto" && banca.local?.startsWith("http") ? (
                        <a
                          href={banca.local}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {banca.local}
                        </a>
                      ) : (
                        <p className="text-muted-foreground">{banca.local || "Não especificado"}</p>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">Orientação</h2>
                <div className="space-y-3">
                  {orientador ? (
                    <div>
                      <p className="font-medium">Orientador(a)</p>
                      <p className="text-muted-foreground">{orientador.nome}</p>
                      <p className="text-sm text-muted-foreground">{orientador.academicTitle}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Orientador não especificado</p>
                  )}

                  {coorientador && (
                    <div>
                      <p className="font-medium">Coorientador(a)</p>
                      <p className="text-muted-foreground">{coorientador.nome}</p>
                      <p className="text-sm text-muted-foreground">{coorientador.academicTitle}</p>
                    </div>
                  )}
                </div>
              </section>

              {avaliadores.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold mb-4">Comissão Avaliadora</h2>
                  <div className="space-y-3">
                    {avaliadores.map(({ usuario }) => (
                      <div key={usuario.id}>
                        <p className="font-medium">{usuario.nome}</p>
                        <p className="text-sm text-muted-foreground">{usuario.academicTitle}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Coluna da direita - Conteúdo Acadêmico */}
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-4">Resumo</h2>
                <p className="whitespace-pre-line text-muted-foreground">{banca.resumo}</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">Abstract</h2>
                <p className="whitespace-pre-line text-muted-foreground">{banca.abstract}</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">Palavras-chave</h2>
                <div className="flex flex-wrap gap-2">
                  {banca.palavrasChave?.split(",").map((palavra, index) => (
                    <span key={index} className="bg-muted px-3 py-1 rounded-full text-sm">
                      {palavra.trim()}
                    </span>
                  ))}
                </div>
              </section>

              <section>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold">Período Acadêmico</h3>
                    <p className="text-muted-foreground">{banca.periodoAcademico}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Turma</h3>
                    <p className="text-muted-foreground">{banca.turma}</p>
                  </div>
                  {banca.notaFinal && (
                    <div>
                      <h3 className="font-semibold">Nota Final</h3>
                      <p className="text-muted-foreground">{banca.notaFinal}</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const BancaSkeleton = () => {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <Header className="mb-6" />
      <div className="space-y-6">
        <div className="flex items-center space-x-4 mb-6">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

export const useBanca = (id: string) => {
  return useQuery({
    queryKey: ["banca", id],
    queryFn: async () => {
      if (!id) throw new Error("ID da banca não fornecido")
      const response = await apiClient.banca[":id"].$get({ param: { id } })
      return rpcReturn(response)
    },
    enabled: !!id,
  })
}

const formatDate = (dateString?: string | Date) => {
  if (!dateString) return "Data não disponível"
  const date = new Date(dateString)
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

const formatTime = (dateString?: string | Date) => {
  if (!dateString) return "Horário não disponível"
  const date = new Date(dateString)
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}
