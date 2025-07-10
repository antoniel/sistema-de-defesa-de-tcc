import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router"
import apiClient from "@/services/apiClient"
import { rpcReturn } from "@/lib/utils"
import { useToast } from "./use-toast"
import type { RpcType } from "@/lib/utils"

// Types
type updateBanca = RpcType<(typeof apiClient.banca)[":id"]["$put"]>["input"]["json"]

// Hook to fetch a specific banca by ID
export const useBanca = (id: string) => {
  return useQuery({
    queryKey: ["banca", id],
    queryFn: async () => {
      if (!id) throw new Error("ID da banca não fornecido")
      const response = await apiClient.banca[":id"].$get({ param: { id } })
      return rpcReturn(response)
    },
    enabled: !!id,
  })
}

// Hook to delete a banca
export const useDeleteBanca = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.banca[":id"].$delete({ param: { id } })
      return rpcReturn(res as any)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bancas"] })
      navigate("/")
    },
  })
}

// Hook to toggle banca visibility
export const useToggleBancaVisibility = (bancaId: string) => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.banca[":id"]["toggle-visibility"].$patch({
        param: { id: bancaId },
      })
      return rpcReturn(res)
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["banca", bancaId], data)
      toast({
        title: "Visibilidade alterada",
        description: `A banca agora está ${data.visible ? "visível" : "oculta"}.`,
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao alterar visibilidade",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

// Hook to update a banca
export const useUpdateBanca = (id: string) => {
  const queryClient = useQueryClient()
  const banca = useBanca(id)
  const navigate = useNavigate()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: updateBanca) => {
      const res = await apiClient.banca[":id"].$put({
        json: data,
        param: { id },
      })
      return rpcReturn(res)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bancas"] })
      void queryClient.invalidateQueries({ queryKey: ["banca", id] })
      navigate(`/banca/${id}`)
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar banca. Tente novamente.",
        variant: "destructive",
      })
    },
  })
}

// Hook to add a new banca
export const useAddBancaMutation = () => {
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.banca.$post(data)
      const body = await response.json()
      if (!response.ok) {
        throw body // Throw the error body
      }
      return body
    },
  })
}