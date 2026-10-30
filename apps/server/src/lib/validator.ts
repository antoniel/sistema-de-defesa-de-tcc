import { zValidator } from "@hono/zod-validator"
import type { Env, Input, MiddlewareHandler, ValidationTargets } from "hono"
import type { ZodSchema, z } from "zod"

type HasUndefined<T> = undefined extends T ? true : false

/**
 * Wrapper de `zValidator` com sanitização anti-fingerprinting:
 * em payload inválido responde 400 com mensagem genérica — sem os
 * `issues[].path` do Zod, que revelam o schema (e a stack) ao cliente.
 *
 * Mesma assinatura/typing do `zValidator` original; trocar o import é a
 * única mudança nos call sites.
 */
export const validator = <
  T extends ZodSchema<any, z.ZodTypeDef, any>,
  Target extends keyof ValidationTargets,
  E extends Env,
  P extends string,
  In = z.input<T>,
  Out = z.output<T>,
  I extends Input = {
    in: HasUndefined<In> extends true
      ? {
          [K in Target]?: (In extends ValidationTargets[K]
            ? In
            : { [K2 in keyof In]?: ValidationTargets[K][K2] | undefined }) | undefined
        }
      : { [K_1 in Target]: In extends ValidationTargets[K_1] ? In : { [K2_1 in keyof In]: ValidationTargets[K_1][K2_1] } }
    out: { [K_2 in Target]: Out }
  },
  V extends I = I,
>(target: Target, schema: T): MiddlewareHandler<E, P, V> => {
  return zValidator<T, Target, E, P, In, Out, I, V>(target, schema, (result, c) => {
    if (!result.success) {
      // Ação segura: a MENSAGEM humana do schema (pt-BR, escrita por nós) é
      // acionável e não revela estrutura; o `path`/shape do Zod é que
      // fornecera o fingerprint — esses nunca vão ao cliente. Defaults do
      // Zod em inglês ("Required") viram mensagem acionável em português.
      const firstIssue = result.error.issues[0]
      const message =
        firstIssue?.message === "Required" ? "Campo obrigatório não preenchido." : (firstIssue?.message ?? "Dados inválidos")
      return c.json({ message }, 400)
    }
  })
}
