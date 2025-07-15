import { createInsertSchema } from "drizzle-zod"
import { z } from "zod"
import { Users } from "../../database"
export const createUserSchema = createInsertSchema(Users)
  .omit({
    passwordHash: true,
  })
  .extend({
    password: z.string().min(8),
  })
export const preRegisterUserSchema = createUserSchema.pick({
  email: true,
  role: true,
})

export const idParamSchema = z.object({
  param: z.object({ id: z.coerce.number() }),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Senha atual é obrigatória"),
  newPassword: z.string().min(8, "Nova senha deve ter pelo menos 8 caracteres"),
})

export const requestPasswordResetSchema = z.object({
  email: z.string().email("Email inválido"),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token é obrigatório"),
  newPassword: z.string().min(8, "Nova senha deve ter pelo menos 8 caracteres"),
})

export const updateUserSchema = z.object({
  param: idParamSchema.shape.param,
  body: createUserSchema
    .pick({
      nome: true,
      school: true,
      academicTitle: true,
      role: true,
    })
    .partial(),
})
