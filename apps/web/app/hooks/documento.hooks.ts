import { rpcReturn, type RpcType } from "@/lib/utils"
import apiClient from "@/services/apiClient"
import { useQuery } from "@tanstack/react-query"

export const useBancaDocumentInfo = (bancaId: number) => {
  return useQuery({
    queryKey: ["banca-document-info", bancaId],
    queryFn: async () => {
      if (!bancaId) throw new Error("ID da banca não fornecido")
      const response = await apiClient.documentos.info[":bancaId"].$get({
        param: { bancaId: bancaId.toString() },
      })
      return rpcReturn(response)
    },
    enabled: !!bancaId,
  })
}
export type DocumentInfo = Awaited<
  ReturnType<RpcType<(typeof apiClient.documentos.info)[":bancaId"]["$get"]>["output"]>
>
