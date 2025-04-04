import { QueryClient, useQuery, useQueryClient, type Updater } from "@tanstack/react-query"
import { rpcReturn } from "../lib/utils"
import apiClient from "./apiClient"
import { getAuthToken, removeAuthToken } from "./authService"

export const useUser = () => {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: useUser.queryKey(),
    queryFn: async () => {
      try {
        const response = await apiClient.usuario.me.$get()
        return rpcReturn(response)
      } catch (error) {
        console.error("Auth error fetching user, removing token:", error)
        removeAuthToken()
        queryClient.invalidateQueries({ queryKey: ["user"] })
        throw error
      }
    },
    enabled: !!getAuthToken(),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })
}
useUser.queryKey = () => ["user"]
useUser.setData = (
  queryClient: QueryClient,
  data: Updater<ReturnType<typeof useUser>["data"], ReturnType<typeof useUser>["data"]>
) => {
  return queryClient.setQueryData(useUser.queryKey(), data)
}
useUser.removeQueries = (queryClient: QueryClient) => {
  return queryClient.setQueryData(useUser.queryKey(), null)
}
