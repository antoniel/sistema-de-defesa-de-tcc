import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useAcceptTeacherInvitation, useVerifyTeacherInvitation, type AcceptTeacherInvitationData } from "@/hooks"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle, Clock, Mail, XCircle } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useNavigate, useParams } from "react-router"
import { z } from "zod"
import type { Route } from "./+types/teacher-invitation.$hash"

export const meta: Route.MetaFunction = () => [{ title: "SISDEF - Convite de Professor" }]

const acceptTeacherInvitationSchema = z
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

type AcceptFormData = z.infer<typeof acceptTeacherInvitationSchema>

export default function TeacherInvitationAcceptPage() {
  const { hash } = useParams<{ hash: string }>()
  const navigate = useNavigate()

  const verifyQuery = useVerifyTeacherInvitation(hash || "")
  const acceptMutation = useAcceptTeacherInvitation()

  const form = useForm<AcceptFormData>({
    resolver: zodResolver(acceptTeacherInvitationSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
      school: "",
      academicTitle: "",
      matricula: "",
    },
  })

  useEffect(() => {
    if (acceptMutation.isSuccess) {
      const timer = setTimeout(() => {
        navigate("/")
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [acceptMutation.isSuccess, navigate])

  if (!hash) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Header className="mb-6" />
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Convite Inválido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">O link do convite está incompleto ou é inválido.</p>
            <Button onClick={() => navigate("/")} className="w-full">
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (verifyQuery.isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Header className="mb-6" />
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-6 w-32" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (verifyQuery.isError) {
    const error = verifyQuery.error
    const isExpired = error?.message?.includes("expirado")
    const isUsed = error?.message?.includes("utilizado")
    const isNotFound = error?.message?.includes("não encontrado")

    return (
      <div className="container mx-auto p-4 md:p-8">
        <Header className="mb-6" />
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              {isExpired ? "Convite Expirado" : isUsed ? "Convite Já Utilizado" : "Convite Inválido"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {isExpired
                ? "Este convite expirou. Entre em contato com o administrador para receber um novo convite."
                : isUsed
                  ? "Este convite já foi utilizado. Se você já possui uma conta, faça login."
                  : "Este convite não foi encontrado ou é inválido."}
            </p>
            <Button onClick={() => navigate("/")} className="w-full">
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (acceptMutation.isSuccess) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Header className="mb-6" />
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Conta Criada!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Sua conta de professor foi criada com sucesso. Você será redirecionado para a página de login em breve.
            </p>
            <Button onClick={() => navigate("/")} className="w-full">
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const invitation = verifyQuery.data?.data
  const expiresAt = invitation?.expiresAt ? new Date(invitation.expiresAt) : null

  const onSubmit = async (data: AcceptFormData) => {
    if (!hash) return

    const acceptData: AcceptTeacherInvitationData = {
      invitationHash: hash,
      password: data.password,
      school: data.school,
      academicTitle: data.academicTitle,
      matricula: data.matricula,
    }

    try {
      await acceptMutation.mutateAsync(acceptData)
    } catch (error) {
      // Error is handled by the mutation
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Header className="mb-6" />

      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Convite para Professor
          </CardTitle>
          <CardDescription>Olá, {invitation?.nome}! Complete seu cadastro para acessar o sistema.</CardDescription>
        </CardHeader>

        <CardContent>
          {expiresAt && (
            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Este convite expira em{" "}
                {expiresAt.toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

              <FormField
                control={form.control}
                name="school"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Escola/Instituição</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da escola ou instituição" {...field} />
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
                      <Input placeholder="Ex: Doutor em Ciência da Computação" {...field} />
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
                      <Input placeholder="Sua matrícula" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4">
                <Button type="submit" className="w-full" disabled={acceptMutation.isPending}>
                  {acceptMutation.isPending ? "Criando conta..." : "Criar Conta"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
