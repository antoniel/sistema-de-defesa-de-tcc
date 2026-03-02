import { rpcReturn } from "@/lib/utils"
import apiClient from "@/services/apiClient"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"
import { useToast } from "./use-toast"

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

// Hook to fetch all users (admin only)
export const useAllUsers = () => {
  return useQuery({
    queryKey: ["users", "all"],
    queryFn: async () => {
      const res = await apiClient.usuario.all.$get()
      return rpcReturn(res)
    },
  })
}

// Hook to update a user
export const useUpdateUser = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateUserFormData }) => {
      const res = await apiClient.usuario[":id"].$put({
        param: { id: id.toString() },
        json: data,
      })
      return rpcReturn(res)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "all"] })
      toast({
        title: "Usuário atualizado ✅",
        description: "Os dados do usuário foram atualizados com sucesso",
      })
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar usuário ❌",
        description: "Ocorreu um erro ao atualizar os dados do usuário",
        variant: "destructive",
      })
    },
  })
}

// Hook to fetch teachers
export const useTeachers = () => {
  return useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const response = await apiClient.usuario.teachers.$get()
      return rpcReturn(response)
    },
  })
}

export const useStudents = () => {
  return useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const response = await apiClient.usuario.students.$get()
      return rpcReturn(response)
    },
  })
}

export const useStudentsAvailableForBanca = () => {
  return useQuery({
    queryKey: ["students", "available-for-banca"],
    queryFn: async () => {
      const response = await apiClient.usuario.students["available-for-banca"].$get()
      return rpcReturn(response)
    },
  })
}

export type UserAssociations = {
  bancasAsOrientador: { id: number; tituloTrabalho: string; autor: string }[]
  bancasAsAluno: { id: number; tituloTrabalho: string; autor: string }[]
  membrosEmBancas: { bancaId: number; tituloTrabalho: string; role: string }[]
}

export const useUserAssociations = (userId: number | null) => {
  return useQuery({
    queryKey: ["users", "associations", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID required")
      const res = await apiClient.usuario[":id"].associations.$get({
        param: { id: userId.toString() },
      })
      return rpcReturn(res) as Promise<UserAssociations>
    },
    enabled: !!userId,
  })
}

// Hook to fetch a user by ID
export const useUserById = (id: string | undefined) => {
  return useQuery({
    queryKey: ["user", id],
    queryFn: async () => {
      if (!id) throw new Error("User ID não fornecido")
      const res = await apiClient.usuario[":id"].$get({
        param: { id },
      })
      return rpcReturn(res)
    },
    enabled: !!id,
  })
}

// Hook to fetch bancas for a user
export const useUserBancas = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["user", userId, "bancas"],
    queryFn: async () => {
      if (!userId) throw new Error("User ID não fornecido")
      const res = await apiClient.usuario[":id"].bancas.$get({
        param: { id: userId },
      })
      return rpcReturn(res)
    },
    enabled: !!userId,
  })
}

export const useDeleteUser = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, cascade }: { id: number; cascade?: boolean }) => {
      const res = await apiClient.usuario[":id"].$delete({
        param: { id: id.toString() },
        query: { cascade: cascade ? "true" : "false" },
      })
      if (!res.ok) {
        const data = (await res.json()) as { message?: string }
        const message = data?.message ?? "Erro ao excluir usuário"
        const error = new Error(message) as Error & { status?: number }
        error.status = res.status
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "all"] })
      toast({
        title: "Usuário excluído",
        description: "O usuário foi removido do sistema com sucesso",
      })
    },
    onError: (error: Error & { status?: number }) => {
      if (error.status === 400) return
      const isNotFound = error.status === 404
      toast({
        title: isNotFound ? "Usuário não encontrado" : "Erro ao excluir usuário",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}
