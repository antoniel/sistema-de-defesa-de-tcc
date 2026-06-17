import { rpcReturn } from "@/lib/utils"
import apiClient from "@/services/apiClient"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"
import { useToast } from "./use-toast"

const cursoFormSchema = z.object({
  nome: z.string().min(1, "Nome do curso é obrigatório"),
  sigla: z.string().min(1, "Sigla é obrigatória"),
  coordenadorId: z.number().int().positive().nullable().optional(),
})

export type CursoFormData = z.infer<typeof cursoFormSchema>

export const useCursos = () => {
  return useQuery({
    queryKey: ["cursos"],
    queryFn: async () => {
      const response = await apiClient.cursos.$get()
      return rpcReturn(response)
    },
  })
}

export const useCreateCurso = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: CursoFormData) => {
      const res = await apiClient.cursos.$post({ json: data })
      return rpcReturn(res)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cursos"] })
      toast({
        title: "Curso criado",
        description: "O curso foi cadastrado com sucesso.",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar curso",
        description: error.message || "Não foi possível criar o curso.",
        variant: "destructive",
      })
    },
  })
}

export const useUpdateCurso = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ cursoId, data }: { cursoId: number; data: CursoFormData }) => {
      const res = await apiClient.cursos[":id"].$patch({
        param: { id: cursoId.toString() },
        json: data,
      })
      return rpcReturn(res)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cursos"] })
      toast({
        title: "Curso atualizado",
        description: "As alterações foram salvas com sucesso.",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar curso",
        description: error.message || "Não foi possível atualizar o curso.",
        variant: "destructive",
      })
    },
  })
}

export const useDeleteCurso = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (cursoId: number) => {
      const res = await apiClient.cursos[":id"].$delete({
        param: { id: cursoId.toString() },
      })
      if (!res.ok) {
        const errorBody = (await res.json().catch(() => ({ message: "Erro ao excluir curso" }))) as {
          message?: string
        }
        throw new Error(errorBody.message || "Erro ao excluir curso")
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cursos"] })
      toast({
        title: "Curso excluído",
        description: "O curso foi removido com sucesso.",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir curso",
        description: error.message || "Não foi possível excluir o curso.",
        variant: "destructive",
      })
    },
  })
}
