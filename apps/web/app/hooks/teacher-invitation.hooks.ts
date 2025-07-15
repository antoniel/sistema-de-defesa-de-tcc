import { rpcReturn } from "@/lib/utils"
import apiClient from "@/services/apiClient"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"
import { useToast } from "./use-toast"

// Schema for creating teacher invitation
const createTeacherInvitationSchema = z.object({
  email: z.string().email("Email inválido"),
  nome: z.string().min(1, "Nome é obrigatório"),
})

// Schema for accepting teacher invitation
const acceptTeacherInvitationSchema = z.object({
  invitationHash: z.string().min(1, "Hash de convite é obrigatório"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  school: z.string().min(1, "Escola é obrigatória"),
  academicTitle: z.string().min(1, "Título acadêmico é obrigatório"),
  matricula: z.string().min(1, "Matrícula é obrigatória"),
})

export type CreateTeacherInvitationData = z.infer<typeof createTeacherInvitationSchema>
export type AcceptTeacherInvitationData = z.infer<typeof acceptTeacherInvitationSchema>

// Hook to fetch all teacher invitations (admin only)
export const useTeacherInvitations = () => {
  return useQuery({
    queryKey: ["teacher-invitations"],
    queryFn: async () => {
      const res = await apiClient["teacher-invitation"].$get()
      return rpcReturn(res)
    },
  })
}

// Hook to create a teacher invitation
export const useCreateTeacherInvitation = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: CreateTeacherInvitationData) => {
      const res = await apiClient["teacher-invitation"].$post({
        json: data,
      })
      return rpcReturn(res)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-invitations"] })
      toast({
        title: "Convite enviado ✅",
        description: "O convite para professor foi enviado com sucesso",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar convite ❌",
        description: error.message || "Ocorreu um erro ao enviar o convite",
        variant: "destructive",
      })
    },
  })
}

// Hook to verify teacher invitation
export const useVerifyTeacherInvitation = (hash: string) => {
  return useQuery({
    queryKey: ["teacher-invitation", "verify", hash],
    queryFn: async () => {
      const res = await apiClient["teacher-invitation"]["verify"][":hash"].$get({
        param: { hash },
      })
      return rpcReturn(res)
    },
    enabled: !!hash,
  })
}

// Hook to accept teacher invitation
export const useAcceptTeacherInvitation = () => {
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: AcceptTeacherInvitationData) => {
      const res = await apiClient["teacher-invitation"]["accept"].$post({
        json: data,
      })
      return rpcReturn(res)
    },
    onSuccess: () => {
      toast({
        title: "Conta criada com sucesso ✅",
        description: "Sua conta de professor foi criada. Você pode fazer login agora.",
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
