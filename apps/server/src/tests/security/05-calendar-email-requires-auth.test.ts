/**
 * Vulnerabilidade 4 — Relay de e-mail aberto em /calendar/:bancaId/email.
 *
 * `POST /calendar/:bancaId/email` não tem requireAuth/checkRole. Qualquer
 * anônimo dispara e-mails (com dados reais da banca) a endereços arbitrários
 * via o SMTP da instituição, em loop — spam e phishing remetido pelo sistema.
 *
 * Especificação: enviar convite por e-mail exige usuário autenticado; anônimo
 * recebe 401/403 e o serviço de e-mail NUNCA é chamado. Controle: docentes
 * continuam podendo enviar (não restringimos aqui por membership).
 *
 * Como explorar hoje: `curl -X POST http://localhost:9000/calendar/1/email \
 *   -H 'content-type: application/json' \
 *   -d '{"email":"vítima@exemplo.com","recipientName":"X"}'`
 */
import { beforeAll, describe, expect, it, vi } from "vitest"

import { E2E_ACCOUNTS, E2E_BANCAS } from "@tcc/tests"

import { buildSecurityApp, expectAuthError, jsonRequest, loginAs, type SecurityTestContext } from "./app"

// O envio real sai por rede; para o teste da FRONTALHA de auth, o resultado do envio é irrelevante.
vi.mock("../../services/email.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../services/email.service")>()),
  sendCalendarInviteEmail: vi.fn(async () => ({ ok: true, data: undefined }) as const),
}))

describe("segurança: envio de convite de calendário exige autenticação", () => {
  let ctx: SecurityTestContext

  beforeAll(async () => {
    ctx = await buildSecurityApp()
  })

  it("anônimo não pode disparar e-mail e o serviço de e-mail não é acionado", async () => {
    const { sendCalendarInviteEmail } = await import("../../services/email.service")
    const res = await jsonRequest(
      { app: ctx.app, path: `/calendar/${E2E_BANCAS.upcomingPublic.id}/email` },
      "POST",
      { email: "vitima@security-test.local", recipientName: "Vitima Anonima" },
    )
    expectAuthError(res.status)
    expect(sendCalendarInviteEmail).not.toHaveBeenCalled()
  })

  it("controle: TEACHER autenticado continua podendo enviar na banca pública", async () => {
    const teacherToken = await loginAs(ctx, {
      email: E2E_ACCOUNTS.teacher.email,
      password: "senha-e2e-123",
    })
    const res = await jsonRequest(
      { app: ctx.app, path: `/calendar/${E2E_BANCAS.upcomingPublic.id}/email` },
      "POST",
      { email: "membro@security-test.local", recipientName: "Membro Autenticado" },
      teacherToken,
    )
    expect(res.status).toBe(200)
    expect(await res.text()).toContain("Convite enviado com sucesso")
  })
})
