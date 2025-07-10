import { z } from "zod"

export const AUTH_TOKEN_KEY = "authToken"
export const envSchema = z.object({
  VITE_API_URL: z.string().url().default("http://localhost:9000"),
})

export const __DEV__ = !import.meta.env.PROD

export const env = envSchema.parse(import.meta.env)
