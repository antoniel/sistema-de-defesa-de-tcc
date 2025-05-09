import { z } from "zod"

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
})
console.log(process.env.DATABASE_URL)

export const env = envSchema.parse(process.env)
