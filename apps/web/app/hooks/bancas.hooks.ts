import { useQuery } from "@tanstack/react-query"
import apiClient from "@/services/apiClient"
import { rpcReturn } from "@/lib/utils"
import { useUser } from "@/services/useUser"

// Hook to fetch all bancas with filtering and pagination
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