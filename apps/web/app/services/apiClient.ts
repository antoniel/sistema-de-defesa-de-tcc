import { AUTH_TOKEN_KEY, env } from "@/config/env"
import type { AppType } from "@tcc/server"
import { hc } from "hono/client"

const client = hc<AppType>(env.VITE_API_URL, {
  headers() {
    const token = typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null
    return {
      Authorization: `Bearer ${token}`,
    }
  },
})

export default client
