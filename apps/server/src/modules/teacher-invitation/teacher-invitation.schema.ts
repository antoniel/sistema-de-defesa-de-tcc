import { z } from "zod"

const baseCreateInvitationSchema = z.object({
  email: z.string().email("Email inválido"),
  nome: z.string().min(1, "Nome é obrigatório")
})

export const createTeacherInvitationSchema = baseCreateInvitationSchema
export const createStudentInvitationSchema = baseCreateInvitationSchema

export const verifyInvitationSchema = z.object({
  hash: z.string().min(1, "Hash é obrigatório")
})

export const acceptTeacherInvitationSchema = z.object({
  invitationHash: z.string().min(1, "Hash de convite é obrigatório"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  school: z.string().min(1, "Escola é obrigatória"),
  academicTitle: z.string().min(1, "Título acadêmico é obrigatório"),
  matricula: z.string().min(1, "Matrícula é obrigatória")
})

export const acceptStudentInvitationSchema = z.object({
  invitationHash: z.string().min(1, "Hash de convite é obrigatório"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  school: z.string().min(1, "Escola é obrigatória"),
  academicTitle: z.string().min(1, "Título acadêmico é obrigatório"),
  matricula: z.string().min(1, "Matrícula é obrigatória")
})

// Legacy exports for backward compatibility
export const verifyTeacherInvitationSchema = verifyInvitationSchema

export type CreateTeacherInvitationInput = z.infer<typeof createTeacherInvitationSchema>
export type CreateStudentInvitationInput = z.infer<typeof createStudentInvitationSchema>
export type VerifyInvitationInput = z.infer<typeof verifyInvitationSchema>
export type VerifyTeacherInvitationInput = VerifyInvitationInput
export type AcceptTeacherInvitationInput = z.infer<typeof acceptTeacherInvitationSchema>
export type AcceptStudentInvitationInput = z.infer<typeof acceptStudentInvitationSchema>