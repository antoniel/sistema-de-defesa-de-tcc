import type { MiddlewareHandler } from "hono"

import { AppError } from "../error"
import { type AppVariables } from "../types"

/**
 * Rate limit em memória (zero dependências).
 *
 * Parâmetros:
 * - Janela: 60 segundos (`windowMs`). Janela fixa por chave; ao expirar, a
 *   contagem reinicia na próxima request.
 * - Limite: 20 requests por janela (`max`) — dentro da faixa exigida pela
 *   especificação de segurança (429 em até 25 tentativas).
 * - Chave: IP do cliente (`x-forwarded-for`, primeiro valor, ou "unknown").
 *   O store é criado por montagem do middleware, então a rota já é implícita
 *   na chave — login e reset não compartilham contadores.
 * - Excedeu: `AppError(429)` (nunca 500).
 *
 * Limitação conhecida: armazenamento é por instância/processo. Reinício do
 * servidor ou múltiplas instâncias reiniciam/compartimentalizam as contagens.
 * No deploy atual (single Dokku) isso é aceitável.
 */

export const RATE_LIMIT_WINDOW_MS = 60_000
export const RATE_LIMIT_MAX = 20

type Bucket = { count: number; windowStart: number }

interface RateLimitOptions {
  max?: number
  windowMs?: number
  message?: string
  /**
   * Conta APENAS tentativas malsucedidas: um request que sai com status < 400
   * limpa o balde da chave. Use em endpoints onde o sucesso legítimo é frequente
   * (ex.: login) — brute force é feito de falhas, e o fluxo normal nunca alcança
   * o limite. Default: false (conta todos os requests, ex. reset de senha).
   */
  clearOnSuccess?: boolean
}

const clientKey = (headers: Headers): string => {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  return forwarded && forwarded.length > 0 ? forwarded : "unknown"
}

export const rateLimit = (options: RateLimitOptions = {}): MiddlewareHandler<{ Variables: AppVariables }> => {
  const max = options.max ?? RATE_LIMIT_MAX
  const windowMs = options.windowMs ?? RATE_LIMIT_WINDOW_MS
  const message = options.message ?? "Muitas tentativas. Tente novamente mais tarde."
  const clearOnSuccess = options.clearOnSuccess ?? false
  const buckets = new Map<string, Bucket>()

  return async (c, next) => {
    const key = clientKey(c.req.raw.headers)
    const now = Date.now()
    const bucket = buckets.get(key)

    if (!bucket || bucket.windowStart + windowMs <= now) {
      buckets.set(key, { count: 1, windowStart: now })
    } else {
      bucket.count += 1
      if (bucket.count > max) {
        throw new AppError(429, message)
      }
    }

    // Purga oportunista de janelas expiradas para não crescer sem limite.
    if (buckets.size > 10_000) {
      for (const [bucketKey, entry] of buckets) {
        if (entry.windowStart + windowMs <= now) {
          buckets.delete(bucketKey)
        }
      }
    }

    try {
      await next()
      if (clearOnSuccess && c.res.status < 400) {
        buckets.delete(key)
      }
    } catch (error) {
      // Falha (403 de senha errada etc.) mantém a contagem — é o que o
      // limitador deve cobrar. O sucesso limpa o balde no caminho acima.
      throw error
    }
  }
}
