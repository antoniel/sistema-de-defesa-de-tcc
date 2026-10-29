/**
 * Vulnerabilidade 7 — Zero rate limiting.
 *
 * Nenhum endpoint limita tentativas: `/auth/login` aceita brute force
 * indefinido (bcrypt ~25ms/tentativa = milhares de tentativas/min) e
 * `/usuario/request-password-reset` permite e-mail bombing ilimitado via
 * SMTP institucional.
 *
 * Especificação (testavel, determinística — especifica a PROPRIEDADE, não o
 * limiar exato):
 * a) Ao inundar `/auth/login` com senhas erradas, dentro de 25 tentativas a
 *    resposta DEVE virar 429 (não 403/500) — o endpoint para de aceitar.
 * b) Ao inundar `/usuario/request-password-reset`, dentro de 25 requests a
 *    resposta DEVE virar 429.
 * c) Controle: um login de credenciais corretas, ANTES de qualquer inundação
 *    para sua chave, responde 200 — o limitador não quebra o fluxo normal.
 * (A estratégia de chaveamento — IP, conta, janela, armazenamento — não é
 * especificada; 429 com AppError é o contrato.)
 */
import { beforeAll, describe, expect, it, vi } from "vitest"

import { E2E_ACCOUNTS } from "@tcc/tests"

import { buildSecurityApp, jsonRequest, type SecurityTestContext } from "./app"

vi.mock("../../services/email.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../services/email.service")>()),
  sendEmail: vi.fn(async () => ({ ok: true, data: undefined }) as const),
}));

const WRONG_PASSWORD = "senha-definitivamente-errada"

describe("segurança: rate limiting protege endpoints sensíveis", () => {
  let ctx: SecurityTestContext

  beforeAll(async () => {
    ctx = await buildSecurityApp()
  })

  it("controle: login com credenciais corretas funciona em estado limpo", async () => {
    const res = await jsonRequest({ app: ctx.app, path: "/auth/login" }, "POST", {
      email: E2E_ACCOUNTS.teacher3.email,
      password: "senha-e2e-123",
    })
    expect(res.status).toBe(200)
  })

  it("a) /auth/login inunda todas as tentativas erradas após dentro de 25 tentativas", async () => {
    const statuses: number[] = []
    for (let i = 0; i < 25; i++) {
      const res = await jsonRequest({ app: ctx.app, path: "/auth/login" }, "POST", {
        email: E2E_ACCOUNTS.teacher2.email,
        password: `${WRONG_PASSWORD}-${i}`,
      })
      statuses.push(res.status)
    }
    expect(statuses).toContain(429)
    expect(statuses[statuses.length - 1]).toBe(429)
  })

  it("b) /usuario/request-password-reset inunda com 429 dentro de 25 requests", async () => {
    const statuses: number[] = []
    for (let i = 0; i < 25; i++) {
      const res = await jsonRequest(
        { app: ctx.app, path: "/usuario/request-password-reset" },
        "POST",
        { email: "vitima-flood@security-test.local" },
      )
      statuses.push(res.status)
    }
    expect(statuses).toContain(429)
    expect(statuses[statuses.length - 1]).toBe(429)
  })
})
