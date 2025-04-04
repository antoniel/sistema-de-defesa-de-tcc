import { createInsertSchema } from "drizzle-zod"
import { z } from "zod"
import { Users } from "../../database"

export const insertUserSchema = createInsertSchema(Users)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    passwordHash: true,
    status: true,
    role: true,
  })
  .extend({
    password: z.string(),
  })
  .strip()
export type RegisterUserInput = z.infer<typeof insertUserSchema>
