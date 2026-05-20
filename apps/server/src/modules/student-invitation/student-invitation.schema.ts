import { z } from "zod"

export const createStudentInvitationSchema = z.object({
  email: z.string().email("Email inválido"),
  nome: z.string().min(1, "Nome é obrigatório"),
  matricula: z.string().min(1, "Matrícula é obrigatória"),
})

export const verifyStudentInvitationSchema = z.object({
  hash: z.string().min(1, "Hash é obrigatório"),
})

export const acceptStudentInvitationSchema = z.object({
  invitationHash: z.string().min(1, "Hash de convite é obrigatório"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  school: z.string().min(1, "Escola é obrigatória"),
  academicTitle: z.string().optional(),
})

export type CreateStudentInvitationInput = z.infer<typeof createStudentInvitationSchema>
export type VerifyStudentInvitationInput = z.infer<typeof verifyStudentInvitationSchema>
export type AcceptStudentInvitationInput = z.infer<typeof acceptStudentInvitationSchema>
