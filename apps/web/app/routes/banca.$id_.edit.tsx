import { Header } from "@/components/layout/Header"
import { InviteExternalMemberDialog } from "@/components/banca/InviteExternalMemberDialog"
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
import React, { useState } from "react"
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
  periodoAcademico: z.string().min(1, "Período acadêmico é obrigatório").regex(/^\d{4}\.[12]$/, "Formato inválido. Use YYYY.S (S=1 ou 2)"),
  cursoId: z.string().min(1, "Curso é obrigatório"),
  orientadorId: z.string().min(1, "Orientador é obrigatório"),
  coorientadorId: z.string().optional(),
  autor: z.string().min(1, "Autor é obrigatório"),
  matricula: z.string().min(1, "Matrícula é obrigatória"),
  avaliadores: z.array(
    z.object({
      usuarioId: z.string().min(1, "Usuário é obrigatório"),
    })
  ),
})

type FormValues = z.infer<typeof formSchema>

function formatTeacherOptionLabel(user: { nome: string; academicTitle?: string | null }) {
  if (user.nome === "Membro externo (convite pendente)") return user.nome
  return user.academicTitle ? `${user.nome} - ${user.academicTitle}` : user.nome
}

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
          periodoAcademico: banca.periodoAcademico || "",
          cursoId: banca.cursoId?.toString() || "",
          orientadorId: banca.orientadorId?.toString() || "",
          coorientadorId: (() => {
            const coorientador = banca.membros?.find((m) => m.role === "coorientador")
            return coorientador ? coorientador.usuario.id.toString() : "none"
          })(),
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

  const orientadorId = form.watch("orientadorId")
  const coorientadorId = form.watch("coorientadorId")
  const avaliadoresValues = form.watch("avaliadores")
  const [coorientadorSearchTerm, setCoorientadorSearchTerm] = useState("")
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteTargetIndex, setInviteTargetIndex] = useState<number | null>(null)
  const [openSelectIndex, setOpenSelectIndex] = useState<number | null>(null)

  const teachersList = React.useMemo(() => {
    const list = teachers ?? []
    const selectedIds = (avaliadoresValues ?? []).map((a) => Number(a.usuarioId)).filter(Boolean)
    const missing = selectedIds.filter((id) => !list.some((t) => t.id === id))
    if (missing.length === 0) return list

    return [
      ...list,
      ...missing.map((id) => ({
        id,
        nome: "Membro externo (convite pendente)",
        email: "",
        academicTitle: "",
        matricula: "",
        school: "",
        role: "TEACHER" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    ]
  }, [teachers, avaliadoresValues])

  const availableTeachers = teachersList.filter(
    (teacher) => String(teacher.id) !== orientadorId && String(teacher.id) !== coorientadorId,
  )

  const coorientadorCandidates = React.useMemo(() => {
    if (!teachers) return []
    return teachersList.filter((teacher) => String(teacher.id) !== orientadorId)
  }, [teachers, teachersList, orientadorId])

  const filteredCoorientadores = React.useMemo(() => {
    if (!coorientadorSearchTerm) return coorientadorCandidates
    const term = coorientadorSearchTerm.toLowerCase()
    return coorientadorCandidates.filter(
      (teacher) =>
        teacher.nome.toLowerCase().includes(term) || teacher.email?.toLowerCase().includes(term),
    )
  }, [coorientadorCandidates, coorientadorSearchTerm])

  function openInviteDialog(index: number) {
    setInviteTargetIndex(index)
    setOpenSelectIndex(null)
    setInviteDialogOpen(true)
  }

  function getAvaliadorOptions(index: number, currentValue: string) {
    const otherSelectedIds = (avaliadoresValues ?? [])
      .map((avaliador, i) => (i !== index ? avaliador.usuarioId : null))
      .filter(Boolean)

    return availableTeachers.filter(
      (teacher) => String(teacher.id) === currentValue || !otherSelectedIds.includes(String(teacher.id)),
    )
  }

  // Handler for masking inputs with YYYY.S format
  const handleYearSemesterFormat = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^\d.]/g, "") // Remove non-digit and non-dot characters

    // Handle backspace correctly (if the dot is the last character, remove it)
    if (e.nativeEvent instanceof InputEvent && e.nativeEvent.inputType === "deleteContentBackward") {
      if (value.endsWith(".")) {
        value = value.slice(0, -1)
      }
    }

    // If we have more than 4 digits and no dot yet, insert it
    if (value.length > 4 && !value.includes(".")) {
      value = value.slice(0, 4) + "." + value.slice(4)
    }

    // Limit the input after the dot to one digit
    if (value.includes(".")) {
      const [year, semester] = value.split(".")
      // Keep only first 4 digits for year
      const formattedYear = year.slice(0, 4)
      // Keep only first digit for semester
      const formattedSemester = semester.slice(0, 1)
      // Only allow 1 or 2 for semester
      if (formattedSemester && !["1", "2"].includes(formattedSemester)) {
        value = formattedYear + "."
      } else {
        value = formattedYear + (formattedSemester ? "." + formattedSemester : "")
      }
    } else {
      // Limit year to 4 digits
      value = value.slice(0, 4)
    }

    form.setValue("periodoAcademico", value)
  }

  const onSubmit = (data: FormValues) => {
    const submitData: updateBanca = {
      tituloTrabalho: data.tituloTrabalho,
      resumo: data.resumo,
      abstract: data.abstract,
      palavrasChave: data.palavrasChave,
      dataRealizacao: new Date(data.dataRealizacao),
      local: data.local,
      turma: data.turma,
      periodoAcademico: data.periodoAcademico,
      cursoId: Number(data.cursoId),
      orientadorId: Number(data.orientadorId),
      coorientadorId:
        data.coorientadorId && data.coorientadorId !== "none" ? Number(data.coorientadorId) : null,
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
              name="periodoAcademico"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Período Acadêmico</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: 2024.2"
                      value={field.value || ""}
                      onChange={(e) => {
                        field.onChange(e)
                        handleYearSemesterFormat(e)
                      }}
                      onBlur={field.onBlur}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
              control={form.control}
              name="orientadorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Orientador</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      if (value === coorientadorId) {
                        form.setValue("coorientadorId", "none")
                      }
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o orientador" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="w-[var(--radix-select-trigger-width)] max-w-[var(--radix-select-trigger-width)]">
                      {teachers?.map((user) => {
                        const label = formatTeacherOptionLabel(user)
                        return (
                          <SelectItem key={user.id} value={String(user.id)} title={label} className="overflow-hidden">
                            <span className="truncate">{label}</span>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="coorientadorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coorientador</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      setCoorientadorSearchTerm("")
                    }}
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o coorientador" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="w-[var(--radix-select-trigger-width)] max-w-[var(--radix-select-trigger-width)]">
                      <div className="p-2 border-b sticky top-0 bg-background z-10">
                        <Input
                          placeholder="Buscar coorientador..."
                          value={coorientadorSearchTerm}
                          onChange={(e) => setCoorientadorSearchTerm(e.target.value)}
                          onKeyDown={(e) => e.stopPropagation()}
                          className="bg-background"
                        />
                      </div>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {filteredCoorientadores.map((user) => {
                        const label = formatTeacherOptionLabel(user)
                        return (
                          <SelectItem key={user.id} value={String(user.id)} title={label} className="overflow-hidden">
                            <span className="truncate">{label}</span>
                          </SelectItem>
                        )
                      })}
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
            <p className="text-sm text-muted-foreground mt-1 mb-2">
              Selecione os avaliadores ou convide um membro externo diretamente em cada campo.
            </p>
            <div className="space-y-4 mt-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-4">
                  <FormField
                    control={form.control}
                    name={`avaliadores.${index}.usuarioId`}
                    render={({ field: avaliadorField }) => (
                      <FormItem className="flex-grow">
                        <Select
                          open={openSelectIndex === index}
                          onOpenChange={(open) => setOpenSelectIndex(open ? index : null)}
                          onValueChange={avaliadorField.onChange}
                          value={avaliadorField.value || undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um avaliador" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="w-[var(--radix-select-trigger-width)] max-w-[var(--radix-select-trigger-width)]">
                            <button
                              type="button"
                              className="relative flex w-full cursor-pointer items-center rounded-sm py-1.5 pl-2 pr-8 text-sm font-medium text-primary outline-none hover:bg-accent hover:text-accent-foreground"
                              onClick={() => openInviteDialog(index)}
                            >
                              + Convidar membro externo
                            </button>
                            {getAvaliadorOptions(index, avaliadorField.value).map((user) => {
                              const label = formatTeacherOptionLabel(user)
                              return (
                                <SelectItem key={user.id} value={String(user.id)} title={label} className="overflow-hidden">
                                  <span className="truncate">{label}</span>
                                </SelectItem>
                              )
                            })}
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

          <InviteExternalMemberDialog
            open={inviteDialogOpen}
            onOpenChange={setInviteDialogOpen}
            idPrefix="edit-invite-external"
            onInvited={(member) => {
              if (inviteTargetIndex === null) return
              form.setValue(`avaliadores.${inviteTargetIndex}.usuarioId`, String(member.id), {
                shouldValidate: true,
              })
              setInviteTargetIndex(null)
            }}
          />

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
