import { useQuery } from '@tanstack/react-query'
import apiClient from '@/services/apiClient'
import { rpcReturn } from '@/lib/utils'
import type { BancaInfoForDocument } from '@/components/pdf/ata-defesa'

export const useBancaDocumentInfo = (bancaId: number) => {
  return useQuery({
    queryKey: ['banca-document-info', bancaId],
    queryFn: async () => {
      if (!bancaId) throw new Error('ID da banca não fornecido')
      const response = await apiClient.documentos.info[':bancaId'].$get({
        param: { bancaId: bancaId.toString() }
      })
      return rpcReturn(response)
    },
    enabled: !!bancaId,
  })
}