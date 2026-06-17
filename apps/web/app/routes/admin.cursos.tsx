import { Header } from "@/components/layout/Header"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  useCreateCurso,
  useCursos,
  useDeleteCurso,
  useTeachers,
  useUpdateCurso,
  type CursoFormData,
} from "@/hooks"
import { useUser } from "@/services/useUser"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Link, Navigate } from "react-router"
import { z } from "zod"
import type { Route } from "./+types/admin.cursos"

export const meta: Route.MetaFunction = () => [{ title: "SISDEF - Cursos" }]

const cursoFormSchema = z.object({
  nome: z.string().min(1, "Nome do curso é obrigatório"),
  sigla: z.string().min(1, "Sigla é obrigatória"),
  coordenadorId: z.string().optional(),
})

type CursoFormValues = z.infer<typeof cursoFormSchema>

interface CursoRecord {
  id: number
  nome: string
  sigla: string
  coordenadorId: number | null
  coordenador: {
    id: number
    nome: string
  } | null
}

interface CursoFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  curso?: CursoRecord
}

function CursoFormDialog(props: CursoFormDialogProps) {
  const createMutation = useCreateCurso()
  const updateMutation = useUpdateCurso()
  const teachersQuery = useTeachers()
  const isEditing = props.curso !== undefined

  const form = useForm<CursoFormValues>({
    resolver: zodResolver(cursoFormSchema),
    defaultValues: {
      nome: "",
      sigla: "",
      coordenadorId: "none",
    },
  })

  useEffect(() => {
    if (!props.open) return

    form.reset({
      nome: props.curso?.nome ?? "",
      sigla: props.curso?.sigla ?? "",
      coordenadorId: props.curso?.coordenadorId ? String(props.curso.coordenadorId) : "none",
    })
  }, [props.open, props.curso, form])

  function handleOpenChange(open: boolean) {
    props.onOpenChange(open)
  }

  function toPayload(values: CursoFormValues): CursoFormData {
    return {
      nome: values.nome.trim(),
      sigla: values.sigla.trim().toUpperCase(),
      coordenadorId: values.coordenadorId && values.coordenadorId !== "none" ? Number(values.coordenadorId) : null,
    }
  }

  function handleSubmit(values: CursoFormValues) {
    const payload = toPayload(values)

    if (isEditing && props.curso) {
      updateMutation.mutate(
        { cursoId: props.curso.id, data: payload },
        {
          onSuccess: () => {
            props.onOpenChange(false)
          },
        }
      )
      return
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        props.onOpenChange(false)
      },
    })
  }

  const isPending = createMutation.isPending || updateMutation.isPending
  const teachers = teachersQuery.data ?? []

  return (
    <Dialog open={props.open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar curso" : "Novo curso"}</DialogTitle>
          <DialogDescription>
            Cadastre o curso e associe o usuário responsável como coordenador nas declarações PDF.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do curso</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: Ciência da Computação" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sigla"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sigla</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: BCC" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="coordenadorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coordenador</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o coordenador..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={String(teacher.id)}>
                          {teacher.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar curso"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminCursosPage() {
  const userQuery = useUser()
  const cursosQuery = useCursos()
  const deleteMutation = useDeleteCurso()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCurso, setEditingCurso] = useState<CursoRecord | undefined>()
  const [cursoToDelete, setCursoToDelete] = useState<CursoRecord | null>(null)

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

  const cursos = (cursosQuery.data ?? []) as CursoRecord[]

  function handleDialogOpenChange(open: boolean) {
    setDialogOpen(open)
    if (!open) {
      setEditingCurso(undefined)
    }
  }

  function handleCreateClick() {
    setEditingCurso(undefined)
    setDialogOpen(true)
  }

  function handleEditClick(curso: CursoRecord) {
    setEditingCurso(curso)
    setDialogOpen(true)
  }

  function handleDeleteConfirm() {
    if (!cursoToDelete) {
      return
    }

    deleteMutation.mutate(cursoToDelete.id, {
      onSuccess: () => {
        setCursoToDelete(null)
      },
    })
  }

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">Cursos</h1>
            <p className="text-muted-foreground">
              Gerencie os cursos disponíveis no sistema e associe cada um ao seu coordenador.
            </p>
          </div>
          <Button onClick={handleCreateClick}>
            <Plus className="h-4 w-4 mr-2" />
            Novo curso
          </Button>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sigla</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Coordenador</TableHead>
              <TableHead className="w-[120px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cursos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Nenhum curso cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              cursos.map((curso) => (
                <TableRow key={curso.id}>
                  <TableCell className="font-medium">{curso.sigla}</TableCell>
                  <TableCell>{curso.nome}</TableCell>
                  <TableCell>{curso.coordenador?.nome ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleEditClick(curso)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => setCursoToDelete(curso)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CursoFormDialog open={dialogOpen} onOpenChange={handleDialogOpenChange} curso={editingCurso} />

      <AlertDialog open={cursoToDelete !== null} onOpenChange={(open) => !open && setCursoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir curso</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o curso {cursoToDelete?.sigla}? Esta ação não pode ser desfeita. Cursos com
              defesas cadastradas não podem ser removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
