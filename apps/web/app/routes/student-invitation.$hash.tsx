import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useAcceptStudentInvitation, useVerifyStudentInvitation, type AcceptStudentInvitationData } from "@/hooks"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle, Mail, XCircle } from "lucide-react"
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
    academicTitle: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  })

type AcceptFormData = z.infer<typeof acceptStudentInvitationSchema>

export default function StudentInvitationAcceptPage() {
  const { hash } = useParams<{ hash: string }>()
  const navigate = useNavigate()

  const verifyQuery = useVerifyStudentInvitation(hash || "")
  const acceptMutation = useAcceptStudentInvitation()

  const form = useForm<AcceptFormData>({
    resolver: zodResolver(acceptStudentInvitationSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
      school: "",
      academicTitle: "",
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
    return <InvalidInviteCard message="O link do convite está incompleto ou é inválido." onBack={() => navigate("/")} />
  }

  if (verifyQuery.isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Header className="mb-6" />
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (verifyQuery.isError) {
    const error = verifyQuery.error
    const isUsed = error?.message?.includes("utilizado")
    return (
      <InvalidInviteCard
        message={
          isUsed
            ? "Este convite já foi utilizado. Se você já possui conta, faça login."
            : "Este convite não foi encontrado ou é inválido."
        }
        onBack={() => navigate("/")}
      />
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
              Cadastro concluído!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Sua conta foi ativada. Você será redirecionado para a página de login em breve.
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

  const onSubmit = async (data: AcceptFormData) => {
    if (!hash) return
    const acceptData: AcceptStudentInvitationData = {
      invitationHash: hash,
      password: data.password,
      school: data.school,
      academicTitle: data.academicTitle,
    }
    try {
      await acceptMutation.mutateAsync(acceptData)
    } catch {
      // Erro tratado pela mutation
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Header className="mb-6" />
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Convite para Aluno
          </CardTitle>
          <CardDescription>
            Olá, {invitation?.nome}! Sua matrícula <strong>{invitation?.matricula}</strong> foi pré-cadastrada.
            Defina sua senha para completar o acesso.
          </CardDescription>
        </CardHeader>

        <CardContent>
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
                      <Input placeholder="Ex: Instituto de Computação" {...field} />
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
                    <FormLabel>Título Acadêmico (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Graduando em BCC" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="pt-4">
                <Button type="submit" className="w-full" disabled={acceptMutation.isPending}>
                  {acceptMutation.isPending ? "Concluindo cadastro..." : "Concluir Cadastro"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

function InvalidInviteCard({ message, onBack }: { message: string; onBack: () => void }) {
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
          <p className="text-muted-foreground mb-4">{message}</p>
          <Button onClick={onBack} className="w-full">
            Voltar ao Início
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
