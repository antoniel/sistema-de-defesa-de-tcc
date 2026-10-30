/**
 * Normaliza a leitura de erros do driver PostgreSQL sob o Drizzle.
 *
 * Desde drizzle-orm 0.45, erros do driver chegam embrulhados em
 * `DrizzleQueryError` (o erro original fica em `error.cause`), então
 * `error.code`/`error.constraint` diretos não existem mais. Este helper
 * percorre a cadeia de `cause` e funciona com ambas as formas.
 */
export interface PgErrorInfo {
  code?: string
  constraint?: string
  message: string
}

export const pgErrorInfo = (error: unknown): PgErrorInfo => {
  let current: unknown = error
  const messageParts: string[] = []
  let code: string | undefined
  let constraint: string | undefined

  for (let depth = 0; current && depth < 5; depth++) {
    if (typeof current === "object" && current !== null) {
      const err = current as { code?: unknown; constraint?: unknown; message?: unknown }
      if (typeof err.code === "string" && code === undefined) code = err.code
      if (typeof err.constraint === "string" && constraint === undefined) constraint = err.constraint
      if (typeof err.message === "string") messageParts.push(err.message)
    }
    current = (current as { cause?: unknown }).cause
  }

  return { code, constraint, message: messageParts.join(" | ") }
}
