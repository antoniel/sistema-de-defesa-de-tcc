import { z } from "zod"

const mode = process.env.NODE_ENV
const TEST_MODE = mode === "test"

export const envSchema = z.object({
  DATABASE_URL: TEST_MODE ? z.string().url().optional() : z.string().url(),
})

export const env = envSchema.parse(process.env)
