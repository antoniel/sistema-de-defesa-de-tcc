import { useQuery } from "@tanstack/react-query"
import apiClient from "@/services/apiClient"
import { rpcReturn } from "@/lib/utils"

// Hook to fetch all courses
export const useCursos = () => {
  return useQuery({
    queryKey: ["cursos"],
    queryFn: async () => {
      const response = await apiClient.cursos.$get()
      return rpcReturn(response) as unknown as any[]
    },
  })
}