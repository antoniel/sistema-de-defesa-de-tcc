import { useMutation } from "@tanstack/react-query"
import apiClient from "@/services/apiClient"
import { rpcReturn } from "@/lib/utils"
import { useToast } from "./use-toast"

interface SendCalendarInviteData {
  email: string
  recipientName?: string
}

// Hook to get Google Calendar URL
export const useGoogleCalendarUrl = () => {
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (bancaId: string) => {
      const response = await apiClient.calendar[":bancaId"].google.$get({
        param: { bancaId }
      })
      return rpcReturn(response)
    },
    onSuccess: (data) => {
      window.open(data.url, '_blank')
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao abrir Google Calendar",
        description: error?.message || "Erro desconhecido ao gerar link do calendário",
        variant: "destructive",
      })
    },
  })
}

// Hook to get Outlook Calendar URL
export const useOutlookCalendarUrl = () => {
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (bancaId: string) => {
      const response = await apiClient.calendar[":bancaId"].outlook.$get({
        param: { bancaId }
      })
      return rpcReturn(response)
    },
    onSuccess: (data) => {
      window.open(data.url, '_blank')
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao abrir Outlook Calendar",
        description: error?.message || "Erro desconhecido ao gerar link do calendário",
        variant: "destructive",
      })
    },
  })
}

// Hook to send calendar invite via email
export const useSendCalendarInvite = () => {
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ bancaId, email, recipientName }: { bancaId: string } & SendCalendarInviteData) => {
      const response = await apiClient.calendar[":bancaId"].email.$post({
        param: { bancaId },
        json: { email, recipientName }
      })
      return rpcReturn(response)
    },
    onSuccess: () => {
      toast({
        title: "Convite enviado!",
        description: "O convite para o calendário foi enviado por email com sucesso.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar convite",
        description: error?.message || "Erro desconhecido ao enviar convite por email",
        variant: "destructive",
      })
    },
  })
}