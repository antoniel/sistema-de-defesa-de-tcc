import { z } from "zod"

export const createTeacherInviteSchema = z.object({
  email: z.string().email("Email inválido"),
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  school: z.string().min(2, "Instituição deve ter pelo menos 2 caracteres"),
  academicTitle: z.string().min(2, "Título acadêmico deve ter pelo menos 2 caracteres"),
})

export const acceptTeacherInviteSchema = z.object({
  token: z.string().min(1, "Token é obrigatório"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirmação de senha é obrigatória"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
})

export const validateInviteTokenSchema = z.object({
  token: z.string().min(1, "Token é obrigatório"),
})

export type CreateTeacherInviteInput = z.infer<typeof createTeacherInviteSchema>
export type AcceptTeacherInviteInput = z.infer<typeof acceptTeacherInviteSchema>
export type ValidateInviteTokenInput = z.infer<typeof validateInviteTokenSchema>