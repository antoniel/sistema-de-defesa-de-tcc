import { useMutation } from "@tanstack/react-query"
import { rpcReturn, type RpcType } from "../lib/utils"
import apiClient from "./apiClient"

export const useLoginMutation = () => {
  type query = RpcType<typeof apiClient.auth.login.$post>
  return useMutation({
    mutationFn: async (request: query["input"]) => {
      const response = await apiClient.auth.login.$post(request)
      return rpcReturn(response)
    },
  })
}

export const storeAuthToken = (token: string): void => {
  try {
    localStorage.setItem("authToken", token)
  } catch (error) {
    console.error("Failed to store auth token:", error)
  }
}

export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem("authToken")
  } catch (error) {
    console.error("Failed to retrieve auth token:", error)
    return null
  }
}

export const removeAuthToken = (): void => {
  try {
    localStorage.removeItem("authToken")
  } catch (error) {
    console.error("Failed to remove auth token:", error)
  }
}
