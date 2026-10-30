import { createInsertSchema } from "drizzle-zod"
import { z } from "zod"
import { Users } from "../../database"

export const insertUserSchema = createInsertSchema(Users)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    passwordHash: true,
    role: true,
  })
  .extend({
    password: z.string().min(8, { message: "Senha deve ter no mínimo 8 caracteres." }),
  })
  .strip()
export type RegisterUserInput = z.infer<typeof insertUserSchema>
