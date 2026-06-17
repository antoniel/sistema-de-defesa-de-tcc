import { QueryClient, useQuery, useQueryClient, type SetDataOptions, type Updater } from "@tanstack/react-query"
import React from "react"
import { rpcReturn } from "../lib/utils"
import apiClient from "./apiClient"
import { getAuthToken, removeAuthToken } from "./authService"

export type AppUser = Awaited<ReturnType<typeof useUser>>["data"]

export const useUser = () => {
  const queryClient = useQueryClient()
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const hasToken = isMounted && !!getAuthToken()

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
    enabled: hasToken,
    refetchOnWindowFocus: false,
  })

  React.useEffect(() => {
    if (query.isError) {
      removeAuthToken()
      useUser.setData(queryClient, null)
    }
  }, [query.isError, queryClient])

  const isLoading = !isMounted || (hasToken && query.isLoading)
  const isAuthReady = isMounted && (!hasToken || query.isFetched)

  return {
    ...query,
    isLoading,
    isAuthReady,
  }
}
useUser.queryKey = () => ["user"]
useUser.setData = (
  queryClient: QueryClient,
  data: Updater<ReturnType<typeof useUser>["data"] | null, ReturnType<typeof useUser>["data"] | null>,
  options?: SetDataOptions
) => {
  return queryClient.setQueryData(useUser.queryKey(), data, options)
}
useUser.removeQueries = (queryClient: QueryClient) => {
  return queryClient.setQueryData(useUser.queryKey(), null)
}
