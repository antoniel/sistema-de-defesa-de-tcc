import { Header } from "@/components/layout/Header"
import type { Route } from "./+types/banca.$id_.edit"

export const meta: Route.MetaFunction = () => [
  { title: "SISDEF - Editar Defesa" },
]
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { cn, rpcReturn, type RpcType } from "@/lib/utils"
import apiClient from "@/services/apiClient"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { SelectCurso, SelectUser } from "@tcc/server"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useFieldArray, useForm } from "react-hook-form"
import { useNavigate, useParams } from "react-router"
import { z } from "zod"
import { BancaSkeleton } from "./banca.$id"
import { useBanca } from "@/hooks"

const formSchema = z.object({
  tituloTrabalho: z.string().min(1, "Título é obrigatório"),
  palavrasChave: z.string().min(1, "Palavras-chave são obrigatórias"),
  resumo: z.string().min(1, "Resumo é obrigatório"),
  abstract: z.string().min(1, "Abstract é obrigatório"),
  dataRealizacao: z.date({ required_error: "Data de realização é obrigatória" }),
  local: z.string().min(1, "Local é obrigatório"),
  turma: z.string().min(1, "Turma é obrigatória"),
  cursoId: z.string().min(1, "Curso é obrigatório"),
  orientadorId: z.string().min(1, "Orientador é obrigatório"),
  autor: z.string().min(1, "Autor é obrigatório"),
  matricula: z.string().min(1, "Matrícula é obrigatória"),
  avaliadores: z.array(
    z.object({
      usuarioId: z.string().min(1, "Usuário é obrigatório"),
    })
  ),
})

type FormValues = z.infer<typeof formSchema>

type updateBanca = RpcType<(typeof apiClient.banca)[":id"]["$put"]>["input"]["json"]

import { useUpdateBanca, useCursos, useTeachers } from "@/hooks"

export default function EditBancaPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { data: cursos, isLoading: isLoadingCursos } = useCursos()
  const { data: teachers, isLoading: isLoadingTeachers } = useTeachers()
  const { data: banca, isLoading: isBancaLoading } = useBanca(id!)
  const updateBancaMutation = useUpdateBanca(id!)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      avaliadores: [{ usuarioId: "" }],
    },
    values: banca
      ? {
          tituloTrabalho: banca.tituloTrabalho,
          palavrasChave: banca.palavrasChave,
          resumo: banca.resumo,
          abstract: banca.abstract,
          dataRealizacao: new Date(banca.dataRealizacao),
          local: banca.local || "",
          turma: banca.turma || "",
          cursoId: banca.cursoId?.toString() || "",
          orientadorId: banca.orientadorId?.toString() || "",
          autor: banca.autor || "",
          matricula: banca.matricula || "",
          avaliadores: (() => {
            const avaliadores =
              banca.membros
                ?.filter((m) => m.role === "avaliador")
                .map((m) => ({
                  usuarioId: m.usuario.id.toString(),
                })) || []

            return avaliadores.length > 0 ? avaliadores : [{ usuarioId: "" }]
          })(),
        }
      : undefined,
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "avaliadores",
  })

  const onSubmit = (data: FormValues) => {
    const submitData: updateBanca = {
      tituloTrabalho: data.tituloTrabalho,
      resumo: data.resumo,
      abstract: data.abstract,
      palavrasChave: data.palavrasChave,
      dataRealizacao: new Date(data.dataRealizacao),
      local: data.local,
      turma: data.turma,
      cursoId: Number(data.cursoId),
      orientadorId: Number(data.orientadorId),
      membros: data.avaliadores.map((a) => ({ id: a.usuarioId })),
      alunoId: banca!.alunoId,
    }

    updateBancaMutation.mutate(submitData, {
      onSuccess: () => {
        toast({
          title: "Sucesso",
          description: "Banca atualizada com sucesso!",
        })
        navigate(`/banca/${id}`)
      },
    })
  }

  if (isLoadingCursos || isLoadingTeachers || isBancaLoading) {
    return <BancaSkeleton />
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Header className="mb-6" />
      <h1 className="text-2xl font-bold mb-6">Editar Defesa de TCC</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, console.error)} className="space-y-8">
          <FormField
            control={form.control}
            name="tituloTrabalho"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título do Trabalho</FormLabel>
                <FormControl>
                  <Input placeholder="Título do Trabalho" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="resumo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Resumo</FormLabel>
                <FormControl>
                  <Textarea rows={8} placeholder="Resumo do trabalho" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="abstract"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Abstract</FormLabel>
                <FormControl>
                  <Textarea rows={8} placeholder="Abstract" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="palavrasChave"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Palavras-chave</FormLabel>
                <FormControl>
                  <Input placeholder="Palavras-chave separadas por vírgula" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
              control={form.control}
              name="autor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Autor</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do autor" {...field} />
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
                    <Input placeholder="Matrícula do autor" {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
              control={form.control}
              name="turma"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Turma</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 2024.1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cursoId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Curso</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o curso" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cursos?.map((curso) => (
                        <SelectItem key={curso.id} value={String(curso.id)}>
                          {curso.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
              control={form.control}
              name="orientadorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Orientador</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o orientador" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {teachers?.map((user) => (
                        <SelectItem key={user.id} value={String(user.id)}>
                          {user.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dataRealizacao"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Realização</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Selecione a data</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="local"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Local</FormLabel>
                <FormControl>
                  <Input placeholder="Local da defesa ou link da sala virtual" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <FormLabel>Membros da Banca Avaliadora</FormLabel>
            <div className="space-y-4 mt-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-4">
                  <FormField
                    control={form.control}
                    name={`avaliadores.${index}.usuarioId`}
                    render={({ field }) => (
                      <FormItem className="flex-grow">
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um avaliador" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {teachers?.map((user) => (
                              <SelectItem key={user.id} value={String(user.id)}>
                                {user.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)}>
                    Remover
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => append({ usuarioId: "" })}>
                Adicionar Avaliador
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateBancaMutation.isPending}>
              {updateBancaMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
