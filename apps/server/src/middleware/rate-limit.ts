import type { Context } from "hono"
import { createMiddleware } from "hono/factory"
import { sql } from "drizzle-orm"
import { AppError } from "../error"
import { type AppVariables } from "../types"

/**
 * Rate limiting persistido no banco (KV com TTL) — módulo dos-hardening.
 *
 * Um upsert atômico por request: linha por chave (`rota:ip` ou `rota:sub`),
 * com janela fixa. Sobrevive a restart e é seguro entre instâncias (o
 * incremento é transacional no Postgres).
 *
 * - Parâmetros: `max` (20/janela por padrão) e `windowMs` (60s).
 * - `keyByUser`: conta por identidade (jwtPayload.sub) em vez de IP — use
 *   em rotas autenticadas atrás de `checkRole`/`requireAuth` (NAT de campus
 *   não pune colegas; abuso é identidade).
 * - `clearOnSuccess`: status < 400 limpa o balde (login legítimo não conta
 *   contra o brute force; desligado por padrão — em rotas de criação o
 *   SUCESSO é justamente o que se limita).
 * - TTL e ring: cada linha carrega `expires_at` (fim da janela) e a purga
 *   oportunista (2% das requests) apaga expirados — a tabela nunca cresce
 *   indefinidamente.
 * - Excedeu: `AppError(429)` (nunca 500).
 *
 * Limitação conhecida: precisa do `db` no contexto (montar DEPOIS do
 * `depsMiddleware`). Backup/cópia do banco carrega os contadores — janelas
 * curtas tornam isso irrelevante.
 */

export const RATE_LIMIT_WINDOW_MS = 60_000
export const RATE_LIMIT_MAX = 20

interface RateLimitOptions {
  /** Nome do bucket (por rota) — a chave final é `name:ip` ou `name:sub`. */
  name: string
  max?: number
  windowMs?: number
  message?: string
  keyByUser?: boolean
  clearOnSuccess?: boolean
}

const clientKey = (c: Context<{ Variables: AppVariables }>): string => {
  // X-Forwarded-For: o ATACANTE controla o primeiro valor (spoof testado:
  // 15 registros rotacionando o header). O proxy confiável (nginx do Dokku)
  // acrescenta o IP real no FIM da lista — por isso o ÚLTIMO valor é o
  // digno de confiança. Sem header (rede interna/testes): "unknown".
  const forwarded = c.req.raw.headers.get("x-forwarded-for")?.split(",").map((s) => s.trim()).filter(Boolean)
  const last = forwarded?.[forwarded.length - 1]
  return last && last.length > 0 ? last : "unknown"
}

export const rateLimit = (options: RateLimitOptions) => {
  const max = options.max ?? RATE_LIMIT_MAX
  const windowMs = options.windowMs ?? RATE_LIMIT_WINDOW_MS
  const message = options.message ?? "Muitas tentativas. Tente novamente mais tarde."
  const keyByUser = options.keyByUser ?? false
  const clearOnSuccess = options.clearOnSuccess ?? false

  return createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
    const db = c.get("db")
    const identity = keyByUser ? String(c.get("jwtPayload")?.sub ?? "anonymous") : clientKey(c)
    const key = `${options.name}:${identity}`
    const windowSeconds = Math.ceil(windowMs / 1000)

    try {
      // Upsert atômico: janela expirada zera o balde; senão incrementa.
      const result = await db.execute(sql`
        INSERT INTO rate_limit_bucket (key, count, expires_at)
        VALUES (${key}, 1, now() + (${windowSeconds} || ' seconds')::interval)
        ON CONFLICT (key) DO UPDATE SET
          count = CASE WHEN rate_limit_bucket.expires_at <= now() THEN 1 ELSE rate_limit_bucket.count + 1 END,
          expires_at = CASE WHEN rate_limit_bucket.expires_at <= now()
            THEN EXCLUDED.expires_at
            ELSE rate_limit_bucket.expires_at END
        RETURNING count
      `)
      const count = Number((result.rows[0] as { count: number })?.count ?? 1)
      if (count > max) {
        throw new AppError(429, message)
      }

      // Purga oportunista (ring): 2% das requests limpam linhas expiradas.
      if (Math.random() < 0.02) {
        await db.execute(sql`DELETE FROM rate_limit_bucket WHERE expires_at < now()`)
      }

      try {
        await next()
        if (clearOnSuccess && c.res.status < 400) {
          await db.execute(sql`DELETE FROM rate_limit_bucket WHERE key = ${key}`)
        }
      } catch (error) {
        throw error
      }
    } catch (error) {
      if (error instanceof AppError) throw error
      // Banco fora do ar: fail-closed em rotas de abuso custoso seria pior
      // que um degrade controlado — loga e deixa passar (a janela é curta).
      console.error("Rate limiter DB error (fail-open):", error)
      await next()
    }
  })
}
