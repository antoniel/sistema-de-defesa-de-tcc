import { useMutation, useQuery } from "@tanstack/react-query"
import { rpcReturn, type RpcType } from "../lib/utils"
import apiClient from "./apiClient"

export const useSubmitFeedbackMutation = () => {
  type Query = RpcType<typeof apiClient.feedback.$post>
  return useMutation({
    mutationFn: async (request: Query["input"]) => {
      const response = await apiClient.feedback.$post(request)
      return rpcReturn(response)
    },
  })
}

export const useFeedbackStatisticsQuery = () => {
  return useQuery({
    queryKey: ["feedback", "statistics"],
    queryFn: async () => {
      const response = await apiClient.feedback.statistics.$get()
      return rpcReturn(response)
    },
  })
}

export const useCreateFeatureRequestMutation = () => {
  type Query = RpcType<(typeof apiClient)["feature-request"]["$post"]>
  return useMutation({
    mutationFn: async (request: Query["input"]) => {
      const response = await apiClient["feature-request"].$post(request)
      return rpcReturn(response)
    },
  })
}

export const useFeatureRequestsQuery = () => {
  return useQuery({
    queryKey: ["feature-requests"],
    queryFn: async () => {
      const response = await apiClient["feature-request"].$get()
      return rpcReturn(response)
    },
  })
}

export const useVoteFeatureRequestMutation = () => {
  type Query = RpcType<(typeof apiClient)["feature-request"]["vote"]["$post"]>
  return useMutation({
    mutationFn: async (request: Query["input"]) => {
      const response = await apiClient["feature-request"].vote.$post(request)
      return rpcReturn(response)
    },
  })
}
