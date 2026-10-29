/**
 * Vulnerabilidade 9 — Tokens de reset em plaintext e sem invalidação.
 *
 * Metade A (plaintext): `requestPasswordReset` (usuario.service.ts ~601) e
 * `requestPasswordResetService` (auth.service.ts ~123) gravam o token cru
 * (`crypto.randomBytes(32).toString("hex")`) em `reset_password.reset_password_hash`
 * — a coluna diz "hash", mas guarda o texto puro. Qualquer vazamento de
 * banco/dump/log vira troca de senha imediata da conta. No fluxo /auth, o
 * token ainda é impresso no stdout ("Reset URL (Email Placeholder)").
 *
 * Metade B (acumulação): o fluxo /usuario insere um novo token a cada request
 * SEM apagar os anteriores (o /auth apaga primeiro — inconsistente). Interromper
 * os antigos: pedidos de reset de quedas múltiplas deixam OTP... deve deixar
 * apenas ONE token ativo por usuário.
 *
 * Especificação:
 * a) /usuario: o valor persistido NUNCA é igual ao token entregue ao usuário
 *    (extraído do html do e-mail) — armazenamento tem que ser derivado (hash).
 * b) /auth: nada do token pode ir para o stdout (console.log spy).
 * c) /usuario: segundo pedido de reset INVALIDA o primeiro token (400 ao usá-lo).
 * controle: o fluxo legítimo continua ponta a ponta (request → reset com o
 * token mais recente → 200 "Senha redefinida com sucesso").
 */
import { beforeAll, describe, expect, it, vi } from "vitest"
import { sql } from "drizzle-orm"

import { E2E_ACCOUNTS } from "@tcc/tests"

import { buildSecurityApp, jsonRequest, type SecurityTestContext } from "./app"

const captured = vi.hoisted(() => ({ emails: [] as { to: string; html: string }[] }))

vi.mock("../../services/email.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../services/email.service")>()),
  sendEmail: vi.fn(async (input: { to: string; html: string }) => {
    captured.emails.push(input)
    return { ok: true, data: undefined } as const
  }),
}))

const TOKEN_URL_PATTERN = /reset-password\/([0-9a-f]{40,})/

const capturedTokenFor = (email: string) => {
  const emailSent = [...captured.emails].reverse().find((e) => e.to === email)
  if (!emailSent) {
    throw new Error(`Nenhum e-mail capturado para ${email}`)
  }
  const match = emailSent.html.match(TOKEN_URL_PATTERN)
  if (!match) {
    throw new Error(`Link de reset não encontrado no html do e-mail: ${emailSent.html.slice(0, 200)}`)
  }
  return match[1]
}

const latestResetRowFor = async (ctx: SecurityTestContext, userId: number) => {
  const result = await ctx.db.execute(
    sql`SELECT reset_password_hash, expires_at FROM reset_password WHERE user_id = ${userId} ORDER BY id DESC LIMIT 1`,
  )
  return result.rows[0] as { reset_password_hash: string; expires_at: Date } | undefined
}

const REQUEST_RESET = (email: string) => ({ path: "/usuario/request-password-reset", email })
const AUTH_REQUEST_RESET = (email: string) => ({ path: "/auth/reset-password", email })

describe("segurança: tokens de reset de senha", () => {
  let ctx: SecurityTestContext

  beforeAll(async () => {
    ctx = await buildSecurityApp()
  })

  it("a) /usuario: token persistido nunca é o texto puro entregue ao usuário", async () => {
    const email = E2E_ACCOUNTS.teacher.email
    captured.emails.length = 0
    const res = await jsonRequest({ app: ctx.app, path: REQUEST_RESET(email).path }, "POST", { email })
    expect(res.status).toBe(200)

    const token = capturedTokenFor(email)
    expect(token.length).toBeGreaterThanOrEqual(40)

    const row = await latestResetRowFor(ctx, E2E_ACCOUNTS.teacher.id)
    expect(row).toBeDefined()

    // A coluna diz "hash": o valor armazenado não pode ser o token cru.
    expect(row!.reset_password_hash).not.toBe(token)
    expect(row!.reset_password_hash).not.toContain(token)
  })

  it("b) /auth: nenhum token de reset aparece no stdout", async () => {
    const consoleSpy = vi.spyOn(console, "log")
    const res = await jsonRequest({ app: ctx.app, path: AUTH_REQUEST_RESET(E2E_ACCOUNTS.admin.email).path }, "POST", {
      email: E2E_ACCOUNTS.admin.email,
    })
    expect(res.status).toBe(200)
    const logs = consoleSpy.mock.calls.map((args) => args.join(" "))
    consoleSpy.mockRestore()
    const leaked = logs.filter((line) => line.includes("reset-password/") || line.includes("Reset URL"))
    expect(leaked).toEqual([])
  })

  it("c) /usuario: o segundo pedido de reset invalida o primeiro token", async () => {
    const email = E2E_ACCOUNTS.teacher2.email
    captured.emails.length = 0
    await jsonRequest({ app: ctx.app, path: REQUEST_RESET(email).path }, "POST", { email })
    const firstToken = capturedTokenFor(email)

    await jsonRequest({ app: ctx.app, path: REQUEST_RESET(email).path }, "POST", { email })
    const secondToken = capturedTokenFor(email)
    expect(secondToken).not.toBe(firstToken)

    // O token antigo DEVE estar invalidado: 400/404 e sem trocar a senha.
    const oldTokenRes = await jsonRequest({ app: ctx.app, path: "/usuario/reset-password" }, "POST", {
      token: firstToken,
      newPassword: "senha-nova-segura-1",
    })
    expect([400, 404]).toContain(oldTokenRes.status)
  })

  it("controle: fluxo legítimo request → reset com o token mais recente → 200", async () => {
    const email = E2E_ACCOUNTS.teacher3.email
    captured.emails.length = 0
    await jsonRequest({ app: ctx.app, path: REQUEST_RESET(email).path }, "POST", { email })
    const token = capturedTokenFor(email)

    const res = await jsonRequest({ app: ctx.app, path: "/usuario/reset-password" }, "POST", {
      token,
      newPassword: "senha-nova-segura-1",
    })
    expect(res.status).toBe(200)
    expect(await res.text()).toContain("Senha redefinida com sucesso")

    // O mesmo token não pode funcionar de novo (single-use sequencial).
    const reuse = await jsonRequest({ app: ctx.app, path: "/usuario/reset-password" }, "POST", {
      token,
      newPassword: "senha-nova-segura-2",
    })
    expect(reuse.status).toBeGreaterThanOrEqual(400)
  })
})
