import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useCursos, useUpdateCursoCoordenador } from "@/hooks"
import { useUser } from "@/services/useUser"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Save } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { Link, Navigate } from "react-router"
import { z } from "zod"
import type { Route } from "./+types/admin.cursos"

export const meta: Route.MetaFunction = () => [{ title: "SISDEF - Coordenadores de Curso" }]

const coordenadorFormSchema = z.object({
  nomeCoordenador: z.string().min(1, "Nome do coordenador é obrigatório"),
})

type CoordenadorFormValues = z.infer<typeof coordenadorFormSchema>

interface CursoCoordenadorFormProps {
  cursoId: number
  cursoNome: string
  cursoSigla: string
  defaultNomeCoordenador: string
}

function CursoCoordenadorForm(props: CursoCoordenadorFormProps) {
  const updateMutation = useUpdateCursoCoordenador()

  const form = useForm<CoordenadorFormValues>({
    resolver: zodResolver(coordenadorFormSchema),
    defaultValues: {
      nomeCoordenador: props.defaultNomeCoordenador,
    },
  })

  useEffect(() => {
    form.reset({ nomeCoordenador: props.defaultNomeCoordenador })
  }, [props.defaultNomeCoordenador, form])

  function handleSubmit(values: CoordenadorFormValues) {
    updateMutation.mutate({
      cursoId: props.cursoId,
      nomeCoordenador: values.nomeCoordenador.trim(),
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {props.cursoSigla} — {props.cursoNome}
        </CardTitle>
        <CardDescription>
          Este nome aparece nas declarações de participação e orientação geradas pelo sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nomeCoordenador"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do coordenador</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: Prof. João Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={updateMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default function AdminCursosPage() {
  const userQuery = useUser()
  const cursosQuery = useCursos()

  const isAdmin = userQuery.data?.role === "ADMIN"

  if (userQuery.isSuccess && !isAdmin) {
    return <Navigate to="/" />
  }

  if (userQuery.isLoading || cursosQuery.isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 space-y-4">
        <Header className="mb-6" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (userQuery.isError || cursosQuery.isError) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Header className="mb-6" />
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          <h2 className="text-xl font-bold mb-2">Erro ao carregar dados</h2>
          <p>Não foi possível carregar os cursos. Tente novamente mais tarde.</p>
        </div>
      </div>
    )
  }

  const cursos = cursosQuery.data ?? []

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Header className="mb-6" />

      <div className="mb-6">
        <Button asChild variant="outline" className="mb-4">
          <Link to="/admin/users">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para administração
          </Link>
        </Button>
        <h1 className="text-2xl font-bold mb-2">Coordenadores de Curso</h1>
        <p className="text-muted-foreground">
          Cadastre o nome do coordenador de cada curso para uso nas declarações PDF.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {cursos.map((curso) => (
          <CursoCoordenadorForm
            key={curso.id}
            cursoId={curso.id}
            cursoNome={curso.nome}
            cursoSigla={curso.sigla}
            defaultNomeCoordenador={curso.nomeCoordenador ?? ""}
          />
        ))}
      </div>
    </div>
  )
}
