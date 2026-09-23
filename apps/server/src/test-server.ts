import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { app } from "./index"
import { seedTestData } from "./tests/seed-test-data"
import { createTestControlRoutes } from "./tests/test-control"
import { fakeDeps, getFakeDb } from "./tests/utils"

/**
 * Servidor de API para o E2E.
 *
 * - Banco em memória (PGlite), sem tocar no PostgreSQL de desenvolvimento.
 * - Dados determinísticos do seed compartilhado (`@tcc/tests`).
 * - Porta dedicada (9100) para nunca colidir com o `npm run dev`.
 *
 * Recusa subir fora de `NODE_ENV=test` — as rotas `/__test__/*` não podem vazar.
 */
const startTestServer = async () => {
  if (process.env.NODE_ENV !== "test") {
    throw new Error(
      `test-server exige NODE_ENV=test (recebido: ${process.env.NODE_ENV ?? "undefined"}). Use \`npm run start:test\`.`,
    )
  }

  const db = await getFakeDb()
  await seedTestData(db)

  // `/__test__` é registrado antes do app real para ganhar o match.
  const root = new Hono()
  root.route("/__test__", createTestControlRoutes(db))
  root.route("/", app(fakeDeps(db)))

  const port = Number(process.env.PORT ?? 9100)
  serve({ fetch: root.fetch, port })

  console.log(`🧪 Test server on http://localhost:${port} (NODE_ENV=test, banco em memória)`)
}

startTestServer().catch((error) => {
  console.error("❌ Falha ao subir o test server:", error)
  process.exit(1)
})
