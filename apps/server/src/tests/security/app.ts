import { app } from "../../index"
import { seedTestData } from "../seed-test-data"
import { fakeDeps, getFakeDb } from "../utils"
import type { Database } from "../../database"

export type SecurityTestContext = {
  app: ReturnType<typeof app>
  db: Database
}

/**
 * Monta o app Hono completo sobre PGlite com o seed determinístico do E2E.
 * Nenhuma porta é aberta — as requisições são feitas via `app.request()`.
 */
export const buildSecurityApp = async (): Promise<SecurityTestContext> => {
  const db = await getFakeDb()
  await seedTestData(db)
  return { app: app(fakeDeps(db)), db: db as unknown as Database }
}

export const jsonRequest = (
  target: { app: SecurityTestContext["app"]; path: string },
  method: "POST" | "GET" | "PUT" | "DELETE",
  body?: unknown,
  token?: string,
) => {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return target.app.request(target.path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

export const loginAs = async (
  ctx: SecurityTestContext,
  credentials: { email: string; password: string },
) => {
  const res = await ctx.app.request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  })
  if (res.status !== 200) {
    throw new Error(`Login falhou no setup do teste (${res.status}): ${await res.text()}`)
  }
  const data = (await res.json()) as { token: string }
  return data.token
}

export const expectAuthError = (status: number) => {
  expect([401, 403]).toContain(status)
}
