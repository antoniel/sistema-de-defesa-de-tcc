import { z } from "zod"

export const createTeacherInviteSchema = z.object({
  body: z.object({
    email: z.string().email("Email inválido"),
    nome: z.string().min(1, "Nome é obrigatório"),
    school: z.string().min(1, "Instituição é obrigatória"),
    academicTitle: z.string().min(1, "Título acadêmico é obrigatório"),
  }),
})

export const acceptTeacherInviteSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Token é obrigatório"),
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  }),
})

export const validateTeacherInviteSchema = z.object({
  params: z.object({
    token: z.string().min(1, "Token é obrigatório"),
  }),
})

export type CreateTeacherInviteInput = z.infer<typeof createTeacherInviteSchema.shape.body>
export type AcceptTeacherInviteInput = z.infer<typeof acceptTeacherInviteSchema.shape.body>