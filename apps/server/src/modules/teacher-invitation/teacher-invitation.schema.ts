import { z } from "zod"

export const createTeacherInvitationSchema = z.object({
  email: z.string().email("Email inválido"),
  nome: z.string().min(1, "Nome é obrigatório")
})

export const verifyTeacherInvitationSchema = z.object({
  hash: z.string().min(1, "Hash é obrigatório")
})

export const acceptTeacherInvitationSchema = z.object({
  invitationHash: z.string().min(1, "Hash de convite é obrigatório"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  school: z.string().min(1, "Escola é obrigatória"),
  academicTitle: z.string().min(1, "Título acadêmico é obrigatório"),
  matricula: z.string().min(1, "Matrícula é obrigatória")
})

export type CreateTeacherInvitationInput = z.infer<typeof createTeacherInvitationSchema>
export type VerifyTeacherInvitationInput = z.infer<typeof verifyTeacherInvitationSchema>
export type AcceptTeacherInvitationInput = z.infer<typeof acceptTeacherInvitationSchema>