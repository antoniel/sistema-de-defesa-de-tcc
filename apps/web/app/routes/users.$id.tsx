import { Header } from "@/components/layout/Header"
import type { Route } from "./+types/users.$id"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useUserById, useUserBancas } from "@/hooks"
import { useUser } from "@/services/useUser"
import { ArrowLeft, Mail, School, User, GraduationCap, Hash } from "lucide-react"
import { useNavigate, useParams } from "react-router"
import { match } from "ts-pattern"
import { UserBancaList } from "@/components/users/UserBancaList"

export const meta: Route.MetaFunction = () => [{ title: "SISDEF - Perfil do Usuário" }]

export default function UserProfilePage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const currentUserQuery = useUser()
  const userQuery = useUserById(id)
  const bancasQuery = useUserBancas(id)

  if (!id) {
    navigate("/")
    return null
  }

  const isLoading = userQuery.isLoading || bancasQuery.isLoading
  const error = userQuery.error || bancasQuery.error
  const user = userQuery.data
  const bancas = bancasQuery.data || []
  const currentUser = currentUserQuery.data
  const isAdmin = currentUser?.role === "ADMIN"

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Header className="mb-6" />
        <div className="max-w-4xl mx-auto space-y-6">
          <Button onClick={() => navigate(-1)} variant="outline" className="mb-4">
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

  if (error || !user) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Header className="mb-6" />
        <div className="max-w-4xl mx-auto">
          <Button onClick={() => navigate(-1)} variant="outline" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <Card>
            <CardContent className="pt-6">
              <div className="bg-destructive/10 text-destructive p-4 rounded-md">
                <h2 className="text-xl font-bold mb-2">
                  {userQuery.error?.message?.includes("404") || !user
                    ? "Usuário não encontrado"
                    : "Erro ao carregar dados do usuário"}
                </h2>
                <p>
                  {error instanceof Error
                    ? error.message
                    : "Ocorreu um erro ao carregar os dados do usuário. Por favor, tente novamente mais tarde."}
                </p>
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

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Header className="mb-6" />
      <div className="max-w-4xl mx-auto space-y-6">
        <Button onClick={() => navigate(-1)} variant="outline" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>

        {/* User Information Card */}
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

        {/* Banca Participation Section */}
        <Card>
          <CardHeader>
            <CardTitle>Participações em Bancas</CardTitle>
            <CardDescription>
              {user.role === "TEACHER"
                ? "Bancas onde este professor participou como orientador, coorientador ou avaliador"
                : user.role === "STUDENT"
                  ? "Bancas onde este aluno defendeu"
                  : "Bancas onde este usuário participou"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserBancaList bancas={bancas} userRole={user.role} isAdmin={isAdmin} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

