import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  useCreateFeatureRequestMutation,
  useFeatureRequestsQuery,
  useVoteFeatureRequestMutation,
} from "@/services/feedbackService"
import { useUser } from "@/services/useUser"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { ArrowUp, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

const featureRequestSchema = z.object({
  title: z.string().min(1, { message: "Título é obrigatório." }).max(200, { message: "Título muito longo." }),
  description: z.string().min(1, { message: "Descrição é obrigatória." }),
})

type FeatureRequestFormValues = z.infer<typeof featureRequestSchema>

export function FeatureRequests() {
  const { data: user } = useUser()

  return (
    <div className="space-y-8">
      <SubmissionSection user={user} />
      <FeatureRequestsList user={user} />
    </div>
  )
}

interface SubmissionSectionProps {
  user: any
}

function SubmissionSection({ user }: SubmissionSectionProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const createFeatureRequestMutation = useCreateFeatureRequestMutation()

  const form = useForm<FeatureRequestFormValues>({
    resolver: zodResolver(featureRequestSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  })

  function onSubmit(data: FeatureRequestFormValues) {
    if (!user) {
      toast({
        title: "Autenticação necessária",
        description: "Por favor, faça login para enviar uma solicitação.",
        variant: "destructive",
      })
      return
    }

    createFeatureRequestMutation.mutate(
      { json: data },
      {
        onSuccess: () => {
          toast({
            title: "Solicitação enviada com sucesso",
            description: "Obrigado por sua sugestão!",
          })
          form.reset()
          queryClient.invalidateQueries({ queryKey: ["feature-requests"] })
        },
        onError: (error) => {
          toast({
            title: "Erro ao enviar solicitação",
            description: error instanceof Error ? error.message : "Ocorreu um erro ao enviar sua solicitação.",
            variant: "destructive",
          })
        },
      }
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Solicitar Nova Funcionalidade</CardTitle>
        <CardDescription>
          {user
            ? "Sugira melhorias ou novas funcionalidades para o sistema."
            : "Faça login para enviar sua solicitação."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Adicionar filtro de busca por data" {...field} disabled={!user} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva a funcionalidade que você gostaria de ver no sistema..."
                      rows={4}
                      {...field}
                      disabled={!user}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={createFeatureRequestMutation.isPending || !user}>
              {createFeatureRequestMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Solicitação"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

interface FeatureRequestsListProps {
  user: any
}

function FeatureRequestsList({ user }: FeatureRequestsListProps) {
  const { data: featureRequests, isLoading } = useFeatureRequestsQuery()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Solicitações de Funcionalidades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!featureRequests || featureRequests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Solicitações de Funcionalidades</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Nenhuma solicitação de funcionalidade ainda. Seja o primeiro a sugerir!
          </p>
        </CardContent>
      </Card>
    )
  }

  const sortedRequests = [...featureRequests].sort((a, b) => b.voteCount - a.voteCount)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Solicitações de Funcionalidades</CardTitle>
        <CardDescription>Vote nas funcionalidades que você gostaria de ver implementadas.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedRequests.map((request) => (
            <FeatureRequestItem key={request.id} request={request} user={user} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface FeatureRequestItemProps {
  request: any
  user: any
}

function FeatureRequestItem({ request, user }: FeatureRequestItemProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const voteFeatureRequestMutation = useVoteFeatureRequestMutation()

  function handleVote() {
    if (!user) {
      toast({
        title: "Autenticação necessária",
        description: "Por favor, faça login para votar.",
        variant: "destructive",
      })
      return
    }

    if (request.userVoted) {
      toast({
        title: "Voto já registrado",
        description: "Você já votou nesta solicitação.",
      })
      return
    }

    voteFeatureRequestMutation.mutate(
      { json: { featureRequestId: request.id } },
      {
        onSuccess: () => {
          toast({
            title: "Voto registrado",
            description: "Seu voto foi computado com sucesso!",
          })
          queryClient.invalidateQueries({ queryKey: ["feature-requests"] })
        },
        onError: (error) => {
          toast({
            title: "Erro ao votar",
            description: error instanceof Error ? error.message : "Ocorreu um erro ao registrar seu voto.",
            variant: "destructive",
          })
        },
      }
    )
  }

  return (
    <div className="flex gap-4 p-4 border rounded-lg">
      <div className="flex flex-col items-center gap-1">
        <Button
          variant={request.userVoted ? "secondary" : "outline"}
          size="sm"
          onClick={handleVote}
          disabled={request.userVoted || voteFeatureRequestMutation.isPending}
          className="h-10 w-10 p-0"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
        <span className="text-sm font-semibold">{request.voteCount}</span>
      </div>

      <div className="flex-1 space-y-2">
        <h3 className="text-lg font-semibold">{request.title}</h3>
        <p className="text-sm text-muted-foreground">{request.description}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Por {request.authorName}</span>
          <span>•</span>
          <span>{new Date(request.createdAt).toLocaleDateString("pt-BR")}</span>
        </div>
      </div>
    </div>
  )
}
