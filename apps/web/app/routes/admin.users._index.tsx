import { Header } from "@/components/layout/Header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser } from "@/services/useUser"
import { zodResolver } from "@hookform/resolvers/zod"
import type { SelectUser } from "@tcc/server"
import { AlertTriangle, Eye, MoreHorizontal, Search, Trash2, UserPlus } from "lucide-react"
import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { Navigate, useNavigate } from "react-router"
import { match } from "ts-pattern"
import { z } from "zod"
import type { Route } from "./+types/admin.users._index"

export const meta: Route.MetaFunction = () => [{ title: "SISDEF - Gerenciar Usuários" }]

export default function AdminUsersIndexPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [editingUser, setEditingUser] = useState<UserType | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null)

  const userQuery = useUser()
  const allUsersQuery = useAllUsers()

  const filteredUsers = React.useMemo(() => {
    const users = allUsersQuery.data || []

    return users.filter(
      (user) =>
        user.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.matricula.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [allUsersQuery.data, searchQuery])

  const getUsersByRole = React.useCallback(
    (role?: SelectUser["role"]) => {
      if (!role) return filteredUsers
      return filteredUsers.filter((user) => user.role === role)
    },
    [filteredUsers],
  )

  const isAdmin = userQuery.data?.role === "ADMIN"

  if (userQuery.isSuccess && !isAdmin) {
    return <Navigate to="/" />
  }

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

  const handleEditUser = (user: UserType) => {
    setEditingUser(user)
    setEditDialogOpen(true)
  }

  const handleDeleteUser = (user: UserType) => {
    setUserToDelete(user)
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
        <Button onClick={() => navigate("/admin/cursos")} variant="outline">
          Coordenadores de Curso
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Todos ({filteredUsers.length})</TabsTrigger>
          <TabsTrigger value="ADMIN">Administrador ({getUsersByRole("ADMIN").length})</TabsTrigger>
          <TabsTrigger value="TEACHER">Professor ({getUsersByRole("TEACHER").length})</TabsTrigger>
          <TabsTrigger value="STUDENT">Aluno ({getUsersByRole("STUDENT").length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <UserTable
            users={filteredUsers}
            searchQuery={searchQuery}
            currentUserId={userQuery.data?.id}
            onViewUser={(user) => navigate(`/admin/users/${user.id}`)}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
          />
        </TabsContent>

        <TabsContent value="ADMIN" className="mt-6">
          <UserTable
            users={getUsersByRole("ADMIN")}
            searchQuery={searchQuery}
            onViewUser={(user) => navigate(`/admin/users/${user.id}`)}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
          />
        </TabsContent>

        <TabsContent value="TEACHER" className="mt-6">
          <UserTable
            users={getUsersByRole("TEACHER")}
            searchQuery={searchQuery}
            onViewUser={(user) => navigate(`/admin/users/${user.id}`)}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
          />
        </TabsContent>

        <TabsContent value="STUDENT" className="mt-6">
          <UserTable
            users={getUsersByRole("STUDENT")}
            searchQuery={searchQuery}
            onViewUser={(user) => navigate(`/admin/users/${user.id}`)}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
          />
        </TabsContent>
      </Tabs>

      <EditUserDialog user={editingUser} open={editDialogOpen} onOpenChange={setEditDialogOpen} />
      <DeleteUserDialog
        user={userToDelete}
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
      />
    </div>
  )
}

type UserType = Omit<SelectUser, "createdAt" | "updatedAt"> & {
  createdAt: string
  updatedAt: string
}

function UserTable({
  users,
  searchQuery,
  currentUserId,
  onViewUser,
  onDeleteUser,
  onEditUser,
}: {
  users: UserType[]
  searchQuery: string
  currentUserId?: number
  onViewUser?: (user: UserType) => void
  onEditUser: (user: UserType) => void
  onDeleteUser: (user: UserType) => void
}) {
  return (
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
          {users.length > 0 ? (
            users.map((user) => (
              <TableRow
                key={user.id}
                className={onViewUser ? "cursor-pointer hover:bg-muted/50" : undefined}
                onClick={onViewUser ? () => onViewUser(user) : undefined}
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
                      {onViewUser && (
                        <DropdownMenuItem onClick={() => onViewUser(user)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalhes
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onEditUser(user)}>Editar</DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        disabled={user.id === currentUserId}
                        onClick={() => onDeleteUser(user)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                {searchQuery ? "Nenhum usuário encontrado para esta busca." : "Nenhum usuário cadastrado."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

import { useAllUsers, useDeleteUser, useUpdateUser, useUserAssociations } from "@/hooks"

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
      },
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

const roleLabels: Record<string, string> = {
  orientador: "Orientador",
  coorientador: "Coorientador",
  aluno: "Aluno",
  avaliador: "Avaliador",
}

function DeleteUserDialog({
  user,
  open,
  onOpenChange,
}: {
  user: UserType | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [showAssociations, setShowAssociations] = useState(false)
  const deleteUserMutation = useDeleteUser()
  const associationsQuery = useUserAssociations(showAssociations && user ? user.id : null)

  React.useEffect(() => {
    if (!open) setShowAssociations(false)
  }, [open])

  function handleConfirm(cascade = false) {
    if (!user) return
    deleteUserMutation.mutate(
      { id: user.id, cascade },
      {
        onSuccess: () => {
          onOpenChange(false)
        },
        onError: (error: Error & { status?: number }) => {
          if (error.status === 400) setShowAssociations(true)
        },
      },
    )
  }

  if (!user) return null

  const associations = associationsQuery.data
  const hasAssociations =
    associations &&
    (associations.bancasAsOrientador.length > 0 ||
      associations.bancasAsAluno.length > 0 ||
      associations.membrosEmBancas.length > 0)

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
          <AlertDialogDescription>
            {showAssociations
              ? "Este usuário possui as seguintes associações no sistema:"
              : `Tem certeza que deseja excluir ${user.nome} (${user.email})? Esta ação não pode ser desfeita.`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {showAssociations && (
          <div className="space-y-4">
            {associationsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando associações...</p>
            ) : hasAssociations ? (
              <Alert variant="destructive">
                <AlertTitle>Associações encontradas</AlertTitle>
                <AlertDescription>
                  <ul className="mt-2 list-inside space-y-2 text-sm">
                    {associations.bancasAsOrientador.length > 0 && (
                      <li>
                        <span className="font-medium">
                          Orientador em {associations.bancasAsOrientador.length} banca(s):
                        </span>
                        <ul className="ml-4 mt-1 list-disc">
                          {associations.bancasAsOrientador.map((b) => (
                            <li key={b.id}>
                              {b.tituloTrabalho} ({b.autor})
                            </li>
                          ))}
                        </ul>
                      </li>
                    )}
                    {associations.bancasAsAluno.length > 0 && (
                      <li>
                        <span className="font-medium">Aluno em {associations.bancasAsAluno.length} banca(s):</span>
                        <ul className="ml-4 mt-1 list-disc">
                          {associations.bancasAsAluno.map((b) => (
                            <li key={b.id}>
                              {b.tituloTrabalho} ({b.autor})
                            </li>
                          ))}
                        </ul>
                      </li>
                    )}
                    {associations.membrosEmBancas.length > 0 && (
                      <li>
                        <span className="font-medium">Membro em {associations.membrosEmBancas.length} banca(s):</span>
                        <ul className="ml-4 mt-1 list-disc">
                          {associations.membrosEmBancas.map((m) => (
                            <li key={`${m.bancaId}-${m.role}`}>
                              {m.tituloTrabalho} ({roleLabels[m.role] ?? m.role})
                            </li>
                          ))}
                        </ul>
                      </li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma associação encontrada.</p>
            )}
            {hasAssociations && (
              <Alert variant="destructive" className="border-2">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle className="font-semibold">Atenção: exclusão em cascata</AlertTitle>
                <AlertDescription>
                  <p className="font-medium">
                    Ao clicar em &quot;Excluir mesmo assim&quot;, todas as bancas onde este usuário é orientador ou
                    aluno serão removidas permanentemente.
                  </p>
                  <p className="mt-2">
                    As participações como avaliador ou coorientador serão apenas desvinculadas (as bancas permanecem).
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setShowAssociations(false)}>Cancelar</AlertDialogCancel>
          {showAssociations && hasAssociations ? (
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault()
                handleConfirm(true)
              }}
            >
              {deleteUserMutation.isPending ? "Excluindo..." : "Excluir mesmo assim"}
            </AlertDialogAction>
          ) : (
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault()
                handleConfirm(false)
              }}
            >
              {deleteUserMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
