import { BancaNavigation } from "@/components/layout/BancaNavigation"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useAssignGradeMutation, useBanca } from "@/hooks"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/services/useUser"
import { ArrowLeft, BarChart3, Info, Save, User } from "lucide-react"
import React, { useState } from "react"
import { useNavigate, useParams } from "react-router"
import type { Route } from "./+types/banca.$id_.avaliacoes"

export const meta: Route.MetaFunction = () => [{ title: "SISDEF - Avaliações da Banca" }]

interface AvaliacaoMembro {
  membroId: number
  nota: string
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
  const assignGradeMutation = useAssignGradeMutation()

  const user = userQuery.data
  const banca = bancaQuery.data

  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoMembro[]>([])

  const isAdmin = user?.role === "ADMIN"
  const isTeacher = user?.role === "TEACHER"
  const isMembroBanca = banca?.membros?.some((m) => m.usuario.id === user?.id)
  const hasAccess = isAdmin || isTeacher || isMembroBanca

  const isLoading = bancaQuery.isLoading || userQuery.isLoading || !userQuery.isAuthReady
  const error = bancaQuery.error || userQuery.error

  React.useEffect(() => {
    if (banca?.membros) {
      const avaliacoesIniciais = banca.membros
        .filter((m) => m.role !== "aluno")
        .map((m) => ({
          membroId: m.id,
          nota: m.nota || "",
          comentarios: "",
          presente: true,
        }))
      setAvaliacoes(avaliacoesIniciais)
    }
  }, [banca])

  const handleAvaliacaoChange = (membroId: number, field: keyof AvaliacaoMembro, value: string | boolean) => {
    setAvaliacoes((prev) => prev.map((av) => (av.membroId === membroId ? { ...av, [field]: value } : av)))
  }

  const handleSaveUserGrade = async (membroId: number, nota: string) => {
    if (!user || !banca) return

    const membro = banca.membros?.find((m) => m.id === membroId)
    if (!membro) return

    assignGradeMutation.mutate({
      bancaId: id,
      userId: membro.usuario.id.toString(),
      nota,
    })
  }

  if (isLoading) {
    return <AvaliacoesPageSkeleton />
  }

  if (!hasAccess) {
    return <AccessDeniedMessage />
  }

  if (error || !banca) {
    return <ErrorMessage error={error} />
  }

  if (!user) {
    return null
  }

  const membrosAvaliaveis = banca.membros?.filter((m) => m.role !== "aluno") ?? []

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Header className="mb-6" />

      <BancaNavigation id={id} user={user} currentPage="avaliacoes" />

      <div className="bg-card shadow-md rounded-lg overflow-hidden">
        <BancaHeader banca={banca} />

        <div className="p-6 space-y-6">
          <AvaliacoesMembros
            membros={membrosAvaliaveis}
            avaliacoes={avaliacoes}
            handleAvaliacaoChange={handleAvaliacaoChange}
            handleSaveUserGrade={handleSaveUserGrade}
            user={user}
            isAdmin={isAdmin}
            isAssigningGrade={assignGradeMutation.isPending}
          />
        </div>
      </div>
    </div>
  )
}

// function BancaNavigation({ id, user }: { id: string; user: AppUser }) {
//   const navigate = useNavigate()

//   return (
//     <div className="mb-6 flex items-center justify-between">
//       <div className="flex items-center gap-4">
//         <Button onClick={() => navigate(-1)} variant="outline" className="flex items-center">
//           <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
//         </Button>

//         {/* Navegação tipo tabs */}
//         <nav className="flex items-center gap-1 ml-6">
//           <Button
//             variant="ghost"
//             className="flex items-center gap-2 relative px-4 py-2 hover:bg-muted border-b-2 border-transparent hover:border-muted-foreground/20"
//             onClick={() => navigate(`/banca/${id}`)}
//           >
//             <User className="h-4 w-4" />
//             Detalhes
//           </Button>

//           {(user?.role === "ADMIN" || user?.role === "TEACHER") && (
//             <Button
//               variant="ghost"
//               className="flex items-center gap-2 relative px-4 py-2 hover:bg-muted border-b-2 border-primary bg-primary/5"
//               onClick={() => {}}
//             >
//               <BarChart3 className="h-4 w-4" />
//               Avaliações
//             </Button>
//           )}

//           {(user?.role === "ADMIN" || user?.role === "TEACHER") && (
//             <Button
//               variant="ghost"
//               className="flex items-center gap-2 relative px-4 py-2 hover:bg-muted border-b-2 border-transparent hover:border-muted-foreground/20"
//               onClick={() => navigate(`/banca/${id}/documentos`)}
//             >
//               <FileText className="h-4 w-4" />
//               Documentos
//             </Button>
//           )}
//         </nav>
//       </div>

//       <div className="flex items-center gap-4">{/* Área para controles administrativos se necessário */}</div>
//     </div>
//   )
// }

const BancaHeader = ({ banca }: { banca: any }) => (
  <div className="bg-muted p-6 border-b">
    <div className="flex items-start justify-between">
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

      {/* Botão Normas */}
      <NormasDialog />
    </div>
  </div>
)

function NormasDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Info className="h-4 w-4" />
          Normas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">NORMAS</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 text-sm">
          {/* 1. Formato da Avaliação Oral */}
          <div>
            <h3 className="text-lg font-bold mb-3">1. Sobre o Formato da Avaliação Oral</h3>
            <p className="text-justify leading-relaxed">
              O tempo para exposição do trabalho pelo aluno é de 20 minutos. Após a apresentação, cada avaliador terá um
              tempo médio de 15 minutos para <span className="underline">arguição</span>. Após a{" "}
              <span className="underline">arguição</span>, os membros da banca devem-se reunir para preencher o
              formulário de avaliação.
            </p>
          </div>

          {/* 2. Critérios de Avaliação */}
          <div>
            <h3 className="text-lg font-bold mb-3">2. Critérios de Avaliação</h3>
            <p className="text-justify leading-relaxed mb-3">
              Na avaliação do projeto apresentado pelo(a) estudante consistirá que devem ser observados os parâmetros
              relacionados abaixo.
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Clareza.</li>
              <li>Objetividade.</li>
              <li>Correção e organização do texto.</li>
              <li>Nível de detalhamento do conteúdo.</li>
              <li>Domínio do assunto.</li>
              <li>Resultados apresentados.</li>
              <li>Organização da apresentação.</li>
              <li>Preparação do material de apoio.</li>
              <li>Transmissão do assunto.</li>
            </ul>
            <p className="text-justify leading-relaxed mt-3">
              Cada avaliador deverá atribuir uma nota de 0 a 10. A nota obtida pelo(a) aluno(a) será o resultado da
              média simples das notas dos avaliadores.
            </p>
          </div>

          {/* 3. Sobre Aprovação */}
          <div>
            <h3 className="text-lg font-bold mb-3">3. Sobre Aprovação</h3>
            <p className="text-justify leading-relaxed">
              O estudante será <strong>"Aprovado por Média"</strong> se obtiver nota igual ou superior a 7 (sete). O
              estudante terá um prazo de 8 (oito) dias para entregar nova versão da monografia com as mudanças sugeridas
              pela banca, se não entregar nova versão será <strong>"Reprovado por Média"</strong> (nota inferior a 1,7).
              Se a nota for maior que 1,7 (um e sete décimos) e menor que 7 (sete), o estudante terá prazo de 8 (oito)
              dias para apresentar nova versão da monografia. Findo este prazo, a banca de avaliação atribuirá uma
              segunda nota e o estudante será considerado <strong>"Aprovado"</strong> (com Final) se obtiver nota igual
              ou superior a 5 (cinco). Caso contrário, o aluno será <strong>"Reprovado por Conceito"</strong>.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const getRoleLabel = (role: string) => {
  switch (role) {
    case "orientador":
      return "Orientador"
    case "coorientador":
      return "Coorientador"
    case "avaliador":
      return "Avaliador"
    default:
      return role
  }
}

const AvaliacoesMembros = (props: {
  membros: NonNullable<ReturnType<typeof useBanca>["data"]>["membros"]
  avaliacoes: AvaliacaoMembro[]
  handleAvaliacaoChange: (membroId: number, field: keyof AvaliacaoMembro, value: string | boolean) => void
  handleSaveUserGrade: (membroId: number, nota: string) => void
  user: NonNullable<ReturnType<typeof useUser>["data"]>
  isAdmin: boolean
  isAssigningGrade: boolean
}) => {
  const orientador = props.membros?.find((m) => m.role === "orientador")?.usuario

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Avaliações dos Membros da Banca</h2>
      {props.membros.length === 0 ? (
        <p className="text-muted-foreground">Nenhum membro da banca cadastrado para avaliação.</p>
      ) : (
        <div className="grid gap-4">
          {props.membros.map((membro) => {
            const avaliacao = props.avaliacoes.find((av) => av.membroId === membro.id) ?? {
              membroId: membro.id,
              nota: membro.nota || "",
            }
            const isCurrentUserMembro = props.user.id === membro.usuario.id
            const isOrientadorDaBanca = !!orientador?.id && props.user.id === orientador.id
            const canEdit = props.isAdmin || isCurrentUserMembro || isOrientadorDaBanca

            return (
              <Card key={membro.id} className={!canEdit ? "bg-muted/30" : ""}>
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center justify-between">
                    <div className="w-full">
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {membro.usuario.nome}
                      </CardTitle>
                      <CardDescription
                        className="flex items-start gap-2 line-clamp-2 w-3/4"
                        title={membro.usuario.academicTitle}
                      >
                        {getRoleLabel(membro.role)}
                        {membro.usuario.academicTitle && ` • ${membro.usuario.academicTitle}`}
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label htmlFor={`nota-${membro.id}`}>Nota:</Label>
                      {canEdit ? (
                        <div className="flex items-center gap-2">
                          <Input
                            id={`nota-${membro.id}`}
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            value={avaliacao.nota}
                            onChange={(e) => props.handleAvaliacaoChange(membro.id, "nota", e.target.value)}
                            placeholder="Ex: 8.5"
                            disabled={props.isAssigningGrade}
                            className="w-28"
                          />
                          <Button
                            size="sm"
                            onClick={() => props.handleSaveUserGrade(membro.id, avaliacao.nota)}
                            disabled={!avaliacao.nota || props.isAssigningGrade}
                            className="flex items-center gap-1"
                          >
                            <Save className="h-3 w-3" />
                            {props.isAssigningGrade ? "Salvando..." : "Salvar"}
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm">{avaliacao.nota || "N/A"}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function AccessDeniedMessage() {
  const navigate = useNavigate()

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Header className="mb-6" />
      <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
        <h2 className="text-xl font-bold mb-2">Acesso negado</h2>
        <p>
          Você não tem permissão para acessar esta página. Apenas administradores, professores e membros da banca podem
          acessar as avaliações.
        </p>
      </div>
      <Button onClick={() => navigate(-1)} variant="outline" className="mt-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>
    </div>
  )
}

function ErrorMessage({ error }: { error: any }) {
  const navigate = useNavigate()

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

function AvaliacoesPageSkeleton() {
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
