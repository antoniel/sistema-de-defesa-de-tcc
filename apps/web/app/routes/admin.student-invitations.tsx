import { Header } from "@/components/layout/Header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useCreateStudentInvitation, useStudentInvitations, type CreateStudentInvitationData } from "@/hooks"
import { useUser } from "@/services/useUser"
import { zodResolver } from "@hookform/resolvers/zod"
import { Mail, Plus, RefreshCw, Search } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Navigate } from "react-router"
import { z } from "zod"
import type { Route } from "./+types/admin.student-invitations"

export const meta: Route.MetaFunction = () => [{ title: "SISDEF - Convites de Alunos" }]

const createStudentInvitationSchema = z.object({
  email: z.string().email("Email inválido"),
  nome: z.string().min(1, "Nome é obrigatório"),
})

export default function AdminStudentInvitationsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)

  const userQuery = useUser()
  const invitationsQuery = useStudentInvitations()
  const createInvitationMutation = useCreateStudentInvitation()

  const form = useForm<CreateStudentInvitationData>({
    resolver: zodResolver(createStudentInvitationSchema),
    defaultValues: {
      email: "",
      nome: "",
    },
  })

  // Verifica se o usuário é um administrador
  const isAdmin = userQuery.data?.role === "ADMIN"

  // Redireciona se o usuário não for um administrador
  if (userQuery.isSuccess && !isAdmin) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = (data: CreateStudentInvitationData) => {
    createInvitationMutation.mutate(data, {
      onSuccess: () => {
        setDialogOpen(false)
        form.reset()
      },
    })
  }

  const filteredInvitations =
    invitationsQuery.data?.data.filter(
      (invitation) =>
        invitation.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invitation.nome.toLowerCase().includes(searchQuery.toLowerCase())
    ) || []

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "used":
        return "bg-green-100 text-green-800"
      case "expired":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendente"
      case "used":
        return "Aceito"
      case "expired":
        return "Expirado"
      default:
        return status
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Convites de Alunos</h1>
            <p className="text-gray-600">Gerencie os convites enviados para alunos</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Novo Convite
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Convidar Aluno</DialogTitle>
                <DialogDescription>Envie um convite para um aluno criar sua conta no sistema.</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="email@exemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do aluno" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createInvitationMutation.isPending}>
                      {createInvitationMutation.isPending ? "Enviando..." : "Enviar Convite"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por email ou nome..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => invitationsQuery.refetch()}
                disabled={invitationsQuery.isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${invitationsQuery.isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Expira em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitationsQuery.isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-48" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredInvitations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      {searchQuery ? "Nenhum convite encontrado para essa busca" : "Nenhum convite encontrado"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-medium">{invitation.nome}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          {invitation.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(invitation.status)}>{getStatusLabel(invitation.status)}</Badge>
                      </TableCell>
                      <TableCell>{new Date(invitation.createdAt).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>{new Date(invitation.expiresAt).toLocaleDateString("pt-BR")}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  )
}
