import { AUTH_TOKEN_KEY } from "@/config/env"
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
    onSuccess: (response) => {
      storeAuthToken(response.token)
    },
    onError: (error) => {
      console.error("Login mutation failed:", error)
    },
  })
}

export const useRegisterMutation = () => {
  type Query = RpcType<typeof apiClient.auth.register.$post>
  return useMutation({
    mutationFn: async (request: Query["input"]) => {
      const response = await apiClient.auth.register.$post(request)
      return rpcReturn(response)
    },
  })
}

export const storeAuthToken = (token: string): void => {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
  } catch (error) {
    console.error("Failed to store auth token:", error)
  }
}

export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY)
  } catch (error) {
    console.error("Failed to retrieve auth token:", error)
    return null
  }
}

export const removeAuthToken = (): void => {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY)
  } catch (error) {
    console.error("Failed to remove auth token:", error)
  }
}
