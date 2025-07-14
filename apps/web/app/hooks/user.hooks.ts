import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useToast } from "./use-toast"
import apiClient from "@/services/apiClient"
import { rpcReturn } from "@/lib/utils"
import { z } from "zod"

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
      return rpcReturn(response) as unknown as any[]
    },
  })
}

// Hook to fetch students
export const useStudents = () => {
  return useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const response = await apiClient.usuario.students.$get()
      return rpcReturn(response) as {
        id: number
        nome: string
        matricula: string
        academicTitle: string
        school: string
        email: string
      }[]
    },
  })
}