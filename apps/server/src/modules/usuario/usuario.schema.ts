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
  param: z.object({
    id: z
      .string()
      .refine((val) => !isNaN(Number(val)), { message: "ID must be a number" })
      .transform(Number),
  }),
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
