import { z } from "zod"

const mode = process.env.NODE_ENV
const TEST_MODE = mode === "test"

export const envSchema = z.object({
  DATABASE_URL: TEST_MODE ? z.string().url().optional() : z.string().url(),
  PORT: z.string().optional().default("9000"),
  FRONTEND_URL: z.string().url(),
  SMTP_USER: z.string(),
  SMTP_PASSWORD: z.string(),
  NODE_ENV: z.string().optional().default("development"),
})

export const env = envSchema.parse(process.env)
