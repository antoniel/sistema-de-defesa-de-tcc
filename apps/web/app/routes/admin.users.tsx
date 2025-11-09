import { Header } from "@/components/layout/Header"
import type { Route } from "./+types/admin.users"

export const meta: Route.MetaFunction = () => [
  { title: "SISDEF - Gerenciar Usuários" },
]
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useUser } from "@/services/useUser"
import { zodResolver } from "@hookform/resolvers/zod"
import type { SelectUser } from "@tcc/server"
import { MoreHorizontal, Search, UserPlus } from "lucide-react"
import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { Navigate, useNavigate } from "react-router"
import { match } from "ts-pattern"
import { z } from "zod"

export default function AdminUsersPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [editingUser, setEditingUser] = useState<UserType | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const userQuery = useUser()
  const allUsersQuery = useAllUsers()

  // Verifica se o usuário é um administrador
  const isAdmin = userQuery.data?.role === "ADMIN"

  // Redireciona se o usuário não for um administrador
  if (userQuery.isSuccess && !isAdmin) {
    return <Navigate to="/" />
  }

  // Estado de carregamento
  if (userQuery.isLoading || allUsersQuery.isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 space-y-4">
        <Header className="mb-6" />
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
          <Skeleton className="h-10 w-full sm:w-1/2" />
        </div>
        <div className="border rounded-md p-4">
          <Skeleton className="h-8 w-full mb-2" />
          <Skeleton className="h-12 w-full mb-2" />
          <Skeleton className="h-12 w-full mb-2" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    )
  }

  if (userQuery.isError || allUsersQuery.isError) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Header className="mb-6" />
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          <h2 className="text-xl font-bold mb-2">Erro ao carregar dados</h2>
          <p>Ocorreu um erro ao carregar a lista de usuários. Por favor, tente novamente mais tarde.</p>
        </div>
      </div>
    )
  }

  const filteredUsers =
    allUsersQuery.data?.filter(
      (user) =>
        user.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.matricula.toLowerCase().includes(searchQuery.toLowerCase())
    ) || []

  const handleEditUser = (user: UserType) => {
    setEditingUser(user)
    setEditDialogOpen(true)
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Header className="mb-6" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Gerenciamento de Usuários</h1>
        <p className="text-muted-foreground">Visualize e gerencie todos os usuários do sistema.</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou matrícula..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => navigate("/admin/teacher-invitations")} variant="outline">
          <UserPlus className="h-4 w-4 mr-2" />
          Convites para Professores
        </Button>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Matrícula</TableHead>
              <TableHead>Função</TableHead>
              <TableHead className="w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow
                  key={user.id}
                  onClick={() => navigate(`/users/${user.id}`)}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell className="font-medium">{user.nome}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.matricula}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {match(user.role)
                        .with("TEACHER", () => "Professor")
                        .with("STUDENT", () => "Aluno")
                        .with("ADMIN", () => "Administrador")
                        .otherwise(() => user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditUser(user)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/users/${user.id}`)}>
                          Ver perfil
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {searchQuery ? "Nenhum usuário encontrado para esta busca." : "Nenhum usuário cadastrado."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <EditUserDialog user={editingUser} open={editDialogOpen} onOpenChange={setEditDialogOpen} />
    </div>
  )
}

type UserType = Omit<SelectUser, "createdAt" | "updatedAt"> & {
  createdAt: string
  updatedAt: string
}

import { useAllUsers, useUpdateUser } from "@/hooks"

// Schema for updating user
const updateUserSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  school: z.string().min(1, "Escola é obrigatória"),
  academicTitle: z.string().min(1, "Título acadêmico é obrigatório"),
  role: z.enum(["STUDENT", "TEACHER", "ADMIN"], {
    required_error: "Função é obrigatória",
  }),
})

type UpdateUserFormData = z.infer<typeof updateUserSchema>

function EditUserDialog({
  user,
  open,
  onOpenChange,
}: {
  user: UserType | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const updateUserMutation = useUpdateUser()

  const form = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      nome: user?.nome || "",
      school: user?.school || "",
      academicTitle: user?.academicTitle || "",
      role: user?.role || "STUDENT",
    },
  })

  // Reset form when user changes
  React.useEffect(() => {
    if (user) {
      form.reset({
        nome: user.nome,
        school: user.school,
        academicTitle: user.academicTitle,
        role: user.role,
      })
    }
  }, [user, form])

  const onSubmit = (data: UpdateUserFormData) => {
    if (!user) return

    updateUserMutation.mutate(
      { id: user.id, data },
      {
        onSuccess: () => {
          onOpenChange(false)
        },
      }
    )
  }

  const handleCancel = () => {
    form.reset()
    onOpenChange(false)
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>
            Edite as informações do usuário {user.nome}. Clique em salvar quando terminar.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo" {...field} />
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
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Função</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a função" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="STUDENT">Aluno</SelectItem>
                      <SelectItem value="TEACHER">Professor</SelectItem>
                      <SelectItem value="ADMIN">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateUserMutation.isPending}>
                {updateUserMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
