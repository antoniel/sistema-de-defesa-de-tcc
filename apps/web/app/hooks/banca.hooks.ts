import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router"
import apiClient from "@/services/apiClient"
import { rpcReturn } from "@/lib/utils"
import { useToast } from "./use-toast"
import { useUser } from "@/services/useUser"
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

// Hook to fetch upcoming bancas with filtering and pagination
export const useUpcomingBancasDefesa = (
  orderBy?: string,
  order?: "asc" | "desc",
  page?: number,
  limit?: number,
  searchQuery?: string
) => {
  return useQuery({
    queryKey: ["bancas", "upcoming", orderBy, order, page, limit, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (orderBy) params.set("orderBy", orderBy)
      if (order) params.set("order", order)
      if (page) params.set("page", page.toString())
      if (limit) params.set("limit", limit.toString())
      if (searchQuery) params.set("searchQuery", searchQuery)

      const res = await apiClient.banca.upcoming.$get({
        query: Object.fromEntries(params),
      })
      return rpcReturn(res)
    },
  })
}

// Hook to fetch past bancas with filtering and pagination
export const usePastBancasDefesa = (
  orderBy?: string,
  order?: "asc" | "desc",
  page?: number,
  limit?: number,
  searchQuery?: string
) => {
  return useQuery({
    queryKey: ["bancas", "past", orderBy, order, page, limit, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (orderBy) params.set("orderBy", orderBy)
      if (order) params.set("order", order)
      if (page) params.set("page", page.toString())
      if (limit) params.set("limit", limit.toString())
      if (searchQuery) params.set("searchQuery", searchQuery)

      const res = await apiClient.banca.past.$get({
        query: Object.fromEntries(params),
      })
      return rpcReturn(res)
    },
  })
}

// Hook to fetch all bancas with filtering and pagination (legacy - will be deprecated)
export const useBancasDefesa = (
  orderBy?: string,
  order?: "asc" | "desc",
  page?: number,
  limit?: number,
  searchQuery?: string
) => {
  return useQuery({
    queryKey: ["bancas", orderBy, order, page, limit, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (orderBy) params.set("orderBy", orderBy)
      if (order) params.set("order", order)
      if (page) params.set("page", page.toString())
      if (limit) params.set("limit", limit.toString())
      if (searchQuery) params.set("searchQuery", searchQuery)

      const res = await apiClient.banca.$get({
        query: Object.fromEntries(params),
      })
      return rpcReturn(res)
    },
  })
}

// Hook to fetch user's own defesas (for teachers and admins)
export const useMyDefesas = (
  orderBy?: string,
  order?: "asc" | "desc",
  page?: number,
  limit?: number,
  searchQuery?: string
) => {
  const userQuery = useUser()

  return useQuery({
    queryKey: ["user", userQuery.data?.id, "my-defesas", orderBy, order, page, limit, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (orderBy) params.set("orderBy", orderBy)
      if (order) params.set("order", order)
      if (page) params.set("page", page.toString())
      if (limit) params.set("limit", limit.toString())
      if (searchQuery) params.set("searchQuery", searchQuery)

      const res = await apiClient.banca["my-defenses"].$get({
        query: Object.fromEntries(params),
      })
      return rpcReturn(res)
    },
    enabled: !!userQuery.data && (userQuery.data.role === "TEACHER" || userQuery.data.role === "ADMIN"),
  })
}

// Hook to assign grade to a committee member
export const useAssignGradeMutation = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ bancaId, userId, nota }: { bancaId: string; userId: string; nota: string }) => {
      const response = await apiClient.banca[":bancaId"].usuarios[":userId"].nota.$post({
        param: { bancaId, userId },
        json: { nota },
      })
      return rpcReturn(response)
    },
    onSuccess: (_, { bancaId }) => {
      // Invalidate banca query to refresh the data
      void queryClient.invalidateQueries({ queryKey: ["banca", bancaId] })
      toast({
        title: "Nota atribuída",
        description: "A nota foi atribuída com sucesso.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atribuir nota",
        description: error?.message || "Erro desconhecido ao atribuir nota. Tente novamente.",
        variant: "destructive",
      })
    },
  })
}