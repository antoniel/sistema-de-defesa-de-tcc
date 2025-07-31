import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useAcceptStudentInvitation, useVerifyTeacherInvitation } from "@/hooks"
import { zodResolver } from "@hookform/resolvers/zod"
import { Clock, Mail, XCircle } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useNavigate, useParams } from "react-router"
import { z } from "zod"
import type { Route } from "./+types/student-invitation.$hash"

export const meta: Route.MetaFunction = () => [{ title: "SISDEF - Convite de Aluno" }]

const acceptStudentInvitationSchema = z
  .object({
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string().min(6, "Confirmação de senha é obrigatória"),
    school: z.string().min(1, "Escola é obrigatória"),
    academicTitle: z.string().min(1, "Título acadêmico é obrigatório"),
    matricula: z.string().min(1, "Matrícula é obrigatória"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  })

type AcceptFormData = z.infer<typeof acceptStudentInvitationSchema>

export default function StudentInvitationAcceptPage() {
  const { hash } = useParams<{ hash: string }>()
  const navigate = useNavigate()

  const verifyQuery = useVerifyTeacherInvitation(hash || "")
  const acceptMutation = useAcceptStudentInvitation()

  const form = useForm<AcceptFormData>({
    resolver: zodResolver(acceptStudentInvitationSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
      school: "",
      academicTitle: "",
      matricula: "",
    },
  })

  const onSubmit = (data: AcceptFormData) => {
    if (!hash) return

    acceptMutation.mutate({
      invitationHash: hash,
      password: data.password,
      school: data.school,
      academicTitle: data.academicTitle,
      matricula: data.matricula,
    })
  }

  useEffect(() => {
    if (acceptMutation.isSuccess) {
      navigate("/login")
    }
  }, [acceptMutation.isSuccess, navigate])

  if (!hash) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                Link Inválido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">O link de convite não é válido.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (verifyQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (verifyQuery.isError || !verifyQuery.data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                Convite Inválido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Este convite não é válido, já foi usado ou expirou.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const invitation = verifyQuery.data

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-500" />
              Convite de Aluno
            </CardTitle>
            <CardDescription>
              Olá, {invitation.data.nome}! Complete seu cadastro para acessar o sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border">
              <div className="flex items-center gap-2 text-blue-700 mb-2">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Informações do Convite</span>
              </div>
              <p className="text-sm text-blue-600">Email: {invitation.data.email}</p>
              <p className="text-sm text-blue-600">
                Expira em: {new Date(invitation.data.expiresAt).toLocaleDateString("pt-BR")}
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Digite sua senha" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar Senha</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Confirme sua senha" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="school"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Escola/Instituto</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Instituto de Matemática e Estatística" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="academicTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título Acadêmico</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Graduando, Mestrando, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="matricula"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Matrícula</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite sua matrícula" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={acceptMutation.isPending}>
                  {acceptMutation.isPending ? "Criando conta..." : "Criar Conta"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
