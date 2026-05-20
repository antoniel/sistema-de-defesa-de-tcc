import { rpcReturn } from "@/lib/utils"
import apiClient from "@/services/apiClient"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"
import { useToast } from "./use-toast"

const createStudentInvitationSchema = z.object({
  email: z.string().email("Email inválido"),
  nome: z.string().min(1, "Nome é obrigatório"),
  matricula: z.string().min(1, "Matrícula é obrigatória"),
})

const acceptStudentInvitationSchema = z.object({
  invitationHash: z.string().min(1, "Hash de convite é obrigatório"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  school: z.string().min(1, "Escola é obrigatória"),
  academicTitle: z.string().optional(),
})

export type CreateStudentInvitationData = z.infer<typeof createStudentInvitationSchema>
export type AcceptStudentInvitationData = z.infer<typeof acceptStudentInvitationSchema>

export const useStudentInvitations = () => {
  return useQuery({
    queryKey: ["student-invitations"],
    queryFn: async () => {
      const res = await apiClient["student-invitation"].$get()
      return rpcReturn(res)
    },
  })
}

export const useCreateStudentInvitation = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: CreateStudentInvitationData) => {
      const res = await apiClient["student-invitation"].$post({ json: data })
      return rpcReturn(res)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-invitations"] })
      queryClient.invalidateQueries({ queryKey: ["students-available-for-banca"] })
      toast({
        title: "Convite enviado ✅",
        description: "O aluno receberá um email para completar o cadastro",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao convidar aluno ❌",
        description: error.message || "Ocorreu um erro ao enviar o convite",
        variant: "destructive",
      })
    },
  })
}

export const useVerifyStudentInvitation = (hash: string) => {
  return useQuery({
    queryKey: ["student-invitation", "verify", hash],
    queryFn: async () => {
      const res = await apiClient["student-invitation"]["verify"][":hash"].$get({ param: { hash } })
      return rpcReturn(res)
    },
    enabled: !!hash,
  })
}

export const useAcceptStudentInvitation = () => {
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: AcceptStudentInvitationData) => {
      const res = await apiClient["student-invitation"]["accept"].$post({ json: data })
      return rpcReturn(res)
    },
    onSuccess: () => {
      toast({
        title: "Cadastro concluído ✅",
        description: "Sua conta foi ativada. Você pode fazer login agora.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao aceitar convite ❌",
        description: error.message || "Ocorreu um erro ao aceitar o convite",
        variant: "destructive",
      })
    },
  })
}
