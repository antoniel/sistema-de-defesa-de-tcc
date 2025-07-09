import { QueryClient, useQuery, useQueryClient, type Updater } from "@tanstack/react-query"
import React from "react"
import { rpcReturn } from "../lib/utils"
import apiClient from "./apiClient"
import { getAuthToken, removeAuthToken } from "./authService"

export const useUser = () => {
  const queryClient = useQueryClient()

  const query = useQuery({
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
    refetchOnWindowFocus: false,
  })
  React.useEffect(() => {
    if (query.isError) {
      removeAuthToken()
      useUser.setData(queryClient, null)
    }
  }, [query.isError])
  return query
}
useUser.queryKey = () => ["user"]
useUser.setData = (
  queryClient: QueryClient,
  data: Updater<ReturnType<typeof useUser>["data"] | null, ReturnType<typeof useUser>["data"] | null>
) => {
  return queryClient.setQueryData(useUser.queryKey(), data)
}
useUser.removeQueries = (queryClient: QueryClient) => {
  return queryClient.setQueryData(useUser.queryKey(), null)
}
