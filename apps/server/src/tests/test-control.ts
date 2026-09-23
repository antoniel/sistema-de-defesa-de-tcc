import { Hono } from "hono"
import type { Database } from "../database"
import { resetTestData } from "./seed-test-data"

/**
 * Rotas de controle usadas apenas pelo E2E.
 *
 * NÃO são montadas na aplicação de produção: só o `test-server.ts` as registra, e ele
 * recusa subir quando `NODE_ENV !== "test"`.
 */
export const createTestControlRoutes = (db: Database) =>
  new Hono()
    /** Readiness probe. O Playwright usa isso como `url` do webServer. */
    .get("/health", (c) => c.json({ ok: true, env: process.env.NODE_ENV ?? null }))
    /**
     * Zera e repopula o banco com os dados determinísticos do seed.
     * Use só em suítes que não rodam em paralelo (a suíte E2E não usa: cada spec cria os seus dados).
     */
    .post("/reset", async (c) => {
      await resetTestData(db)
      return c.json({ ok: true })
    })
