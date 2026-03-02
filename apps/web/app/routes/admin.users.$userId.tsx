import { Header } from "@/components/layout/Header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useUserAssociations, useUserById } from "@/hooks"
import { ArrowLeft, GraduationCap, Hash, Mail, School, User } from "lucide-react"
import { useNavigate, useParams } from "react-router"
import { match } from "ts-pattern"
import type { Route } from "./+types/admin.users.$userId"

const roleLabels: Record<string, string> = {
  orientador: "Orientador",
  coorientador: "Coorientador",
  aluno: "Aluno",
  avaliador: "Avaliador",
}

export const meta: Route.MetaFunction = () => [{ title: "SISDEF - Detalhe do Usuário" }]

export default function AdminUserDetailPage() {
  const navigate = useNavigate()
  const { userId } = useParams<{ userId: string }>()
  const userQuery = useUserById(userId)
  const associationsQuery = useUserAssociations(userId ? parseInt(userId, 10) : null)

  const isLoading = userQuery.isLoading || associationsQuery.isLoading
  const user = userQuery.data
  const associations = associationsQuery.data

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Header className="mb-6" />
        <div className="max-w-4xl mx-auto space-y-6">
          <Button onClick={() => navigate("/admin/users")} variant="outline" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (userQuery.error || !user) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Header className="mb-6" />
        <div className="max-w-4xl mx-auto">
          <Button onClick={() => navigate("/admin/users")} variant="outline" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <Card>
            <CardContent className="pt-6">
              <div className="bg-destructive/10 text-destructive p-4 rounded-md">
                <h2 className="text-xl font-bold mb-2">Usuário não encontrado</h2>
                <p>O usuário solicitado não existe ou você não tem permissão para visualizá-lo.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const roleLabel = match(user.role)
    .with("TEACHER", () => "Professor")
    .with("STUDENT", () => "Aluno")
    .with("ADMIN", () => "Administrador")
    .otherwise(() => user.role)

  const hasAssociations =
    associations &&
    (associations.bancasAsOrientador.length > 0 ||
      associations.bancasAsAluno.length > 0 ||
      associations.membrosEmBancas.length > 0)

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Header className="mb-6" />
      <div className="max-w-4xl mx-auto space-y-6">
        <Button onClick={() => navigate("/admin/users")} variant="outline" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <User className="h-6 w-6" />
                  {user.nome}
                </CardTitle>
                <CardDescription className="mt-2">{roleLabel}</CardDescription>
              </div>
              <Badge variant="outline" className="text-sm">
                {roleLabel}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-sm">{user.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Hash className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Matrícula</p>
                  <p className="text-sm">{user.matricula}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <School className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Escola/Instituição</p>
                  <p className="text-sm">{user.school}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <GraduationCap className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Título Acadêmico</p>
                  <p className="text-sm">{user.academicTitle}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Associações em Bancas</CardTitle>
            <CardDescription>
              {hasAssociations
                ? "Bancas onde este usuário participa como orientador, aluno ou membro"
                : "Este usuário não possui associações em bancas ou outras entidades"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {associationsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando associações...</p>
            ) : !hasAssociations ? (
              <p className="text-sm text-muted-foreground">Nenhuma banca ou participação encontrada.</p>
            ) : (
              <div className="space-y-4">
                {associations.bancasAsOrientador.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Orientador</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {associations.bancasAsOrientador.map((b) => (
                        <li key={b.id}>
                          {b.tituloTrabalho} ({b.autor})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {associations.bancasAsAluno.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Aluno</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {associations.bancasAsAluno.map((b) => (
                        <li key={b.id}>
                          {b.tituloTrabalho} ({b.autor})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {associations.membrosEmBancas.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Membro</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {associations.membrosEmBancas.map((m) => (
                        <li key={`${m.bancaId}-${m.role}`}>
                          {m.tituloTrabalho} ({roleLabels[m.role] ?? m.role})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
