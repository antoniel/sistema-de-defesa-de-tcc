import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { rpcReturn } from "@/lib/utils"
import apiClient from "@/services/apiClient"
import { useUser } from "@/services/useUser"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { href, Navigate } from "react-router"
import { z } from "zod"

const profileFormSchema = z.object({
  nome: z.string().min(2, {
    message: "O nome deve ter pelo menos 2 caracteres",
  }),
  school: z.string().min(2, {
    message: "A instituição deve ter pelo menos 2 caracteres",
  }),
  academicTitle: z.string().min(2, {
    message: "O título acadêmico deve ter pelo menos 2 caracteres",
  }),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export default function ProfilePage() {
  const { data: user, isLoading, isError } = useUser()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      nome: user?.nome || "",
      school: user?.school || "",
      academicTitle: user?.academicTitle || "",
    },
    values: {
      nome: user?.nome || "",
      school: user?.school || "",
      academicTitle: user?.academicTitle || "",
    },
  })

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      if (!user?.id) throw new Error("Usuário não encontrado")
      const response = await apiClient.usuario.me.$put({
        json: data,
      })
      return rpcReturn(response)
    },
    onSuccess: (data) => {
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso!",
      })
      // Atualiza os dados do usuário na aplicação
      queryClient.setQueryData(useUser.queryKey(), (oldData: any) => {
        return { ...oldData, ...data }
      })
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar perfil",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao atualizar seu perfil.",
        variant: "destructive",
      })
    },
  })

  function onSubmit(data: ProfileFormValues) {
    updateProfileMutation.mutate(data)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Header className="mb-6" />
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (isError || !user) {
    return <Navigate to={href("/")} />
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Header className="mb-6" />

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Meu Perfil</CardTitle>
            <CardDescription>
              Atualize suas informações pessoais. Seu email e matrícula não podem ser alterados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="school"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instituição</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Universidade Federal da Bahia" {...field} />
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
                          <Input placeholder="Ex: Doutor, Mestre, Graduado" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex flex-col">
                  <FormLabel>Email</FormLabel>
                  <p className="text-sm text-muted-foreground break-all">{user.email}</p>
                </div>

                <div className="flex flex-col">
                  <FormLabel>Matrícula</FormLabel>
                  <p className="text-sm text-muted-foreground">{user.matricula}</p>
                </div>

                <Button type="submit" className="w-full" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    "Salvar alterações"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-between border-t px-6 py-4">
            <p className="text-xs text-muted-foreground">
              Última atualização:{" "}
              {new Date(user.updatedAt).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
