import { rpcReturn } from "@/lib/utils"
import apiClient from "@/services/apiClient"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"
import { useToast } from "./use-toast"

const updateCursoCoordenadorSchema = z.object({
  cursoId: z.number(),
  nomeCoordenador: z.string().min(1, "Nome do coordenador é obrigatório"),
})

export type UpdateCursoCoordenadorData = z.infer<typeof updateCursoCoordenadorSchema>

export const useCursos = () => {
  return useQuery({
    queryKey: ["cursos"],
    queryFn: async () => {
      const response = await apiClient.cursos.$get()
      return rpcReturn(response)
    },
  })
}

export const useUpdateCursoCoordenador = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: UpdateCursoCoordenadorData) => {
      const res = await apiClient.cursos[":id"].$patch({
        param: { id: data.cursoId.toString() },
        json: { nomeCoordenador: data.nomeCoordenador },
      })
      return rpcReturn(res)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cursos"] })
      toast({
        title: "Coordenador atualizado",
        description: "O nome do coordenador foi salvo com sucesso.",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível atualizar o coordenador do curso.",
        variant: "destructive",
      })
    },
  })
}
