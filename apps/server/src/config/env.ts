import { z } from "zod"

const mode = process.env.NODE_ENV
const TEST_MODE = mode === "test"

export const envSchema = z.object({
  NODE_ENV: z.string().optional(),
  PORT: z.string().optional().default("9000"),
  // REQUIRED
  DATABASE_URL: TEST_MODE ? z.string().url().optional() : z.string().url(),
  FRONTEND_URL: TEST_MODE ? z.string().url().optional() : z.string().url(),
  SMTP_PASSWORD: TEST_MODE ? z.string().optional() : z.string(),
  SMTP_USER: TEST_MODE ? z.string().optional() : z.string(),
})

export const env = envSchema.parse(process.env)
