/**
 * Vulnerabilidade 8 — Enumeração de usuários por respostas distintas.
 *
 * Duas superfícies:
 * a) `POST /usuario/request-password-reset` responde 404 "Usuário não
 *    encontrado" quando o e-mail não existe e 200 quando existe — oráculo
 *    direto de existência. `/auth/reset-password` já responde de forma
 *    uniforme e deve continuar.
 * b) `POST /auth/login` distingue conta inativa ("Seu usuário está inativo.")
 *    de credenciais inválidas — confirma que o e-mail existe.
 *
 * Especificação: para e-mail existente vs. inexistente, resposta deve ter o
 * MESMO status e mensagem — nada pode revelar se a conta existe. Para login
 * existe ainda outra superfície: senha errada em conta ativa vs. e-mail
 * desconhecido — não a amarramos aqui (uniformes hoje); o teste é de reg.:Uniform.
 *
 * Como explorar hoje:
 *   curl -X POST http://localhost:9000/usuario/request-password-reset \
 *     -H 'content-type: application/json' -d '{"email":"naoexiste@exemple.com"}' → 404
 */
import { beforeAll, describe, expect, it, vi } from "vitest"

import { E2E_ACCOUNTS } from "@tcc/tests"

import { buildSecurityApp, jsonRequest, type SecurityTestContext } from "./app"

vi.mock("../../services/email.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../services/email.service")>()),
  sendEmail: vi.fn(async () => ({ ok: true, data: undefined }) as const),
}))

const KNOWN_EMAIL = E2E_ACCOUNTS.teacher.email
const UNKNOWN_EMAIL = "inexistente@security-test.local"

describe("segurança: respostas de reset/login não revelam existência de conta", () => {
  let ctx: SecurityTestContext

  beforeAll(async () => {
    ctx = await buildSecurityApp()
  })

  it("POST /usuario/request-password-reset: e-mail existente e inexistente respondem IGUAL", async () => {
    const knowRes = await jsonRequest(
      { app: ctx.app, path: "/usuario/request-password-reset" },
      "POST",
      { email: KNOWN_EMAIL },
    )
    const unknownRes = await jsonRequest(
      { app: ctx.app, path: "/usuario/request-password-reset" },
      "POST",
      { email: UNKNOWN_EMAIL },
    )
    expect(knowRes.status).toBe(unknownRes.status)
  })

  it("POST /usuario/request-password-reset: nunca diz explicitamente que o usuário não existe", async () => {
    const res = await jsonRequest(
      { app: ctx.app, path: "/usuario/request-password-reset" },
      "POST",
      { email: UNKNOWN_EMAIL },
    )
    const text = await res.text()
    expect(text.toLowerCase()).not.toContain("não encontrado")
    expect(text.toLowerCase()).not.toContain("nao encontrado")
  })

  it("POST /usuario/reset-password: token inexistente não discrimina formato do inexistente", async () => {
    const res = await jsonRequest({ app: ctx.app, path: "/usuario/reset-password" }, "POST", {
      token: "0000000000000000000000000000000000000000000000000000000000000000",
      newPassword: "nova-senha-123",
    })
    const text = await res.text()
    expect([400, 404]).toContain(res.status)
    expect(text.toLowerCase()).not.toContain("usuário não encontrado")
    expect(text.toLowerCase()).not.toContain("usuario nao encontrado")
  })

  it("POST /auth/login: senha errada em conta ativa vs. e-mail desconhecido respondem IGUAL e NÃO revelam inatividade com senha errada", async () => {
    const knowRes = await jsonRequest({ app: ctx.app, path: "/auth/login" }, "POST", {
      email: KNOWN_EMAIL,
      password: "senha-definitivamente-errada",
    })
    const unknownRes = await jsonRequest({ app: ctx.app, path: "/auth/login" }, "POST", {
      email: UNKNOWN_EMAIL,
      password: "senha-definitivamente-errada",
    })
    expect(knowRes.status).toBe(unknownRes.status)
    const knowBody = await knowRes.text()
    const unknownBody = await unknownRes.text()
    expect(knowBody).toBe(unknownBody)

    const inactiveProbe = await jsonRequest({ app: ctx.app, path: "/auth/login" }, "POST", {
      email: KNOWN_EMAIL,
      password: "senha-definitivamente-errada-incativa-probe",
    })
    expect((await inactiveProbe.text()).toLowerCase()).not.toContain("inativo")
  })

  it("controle: /auth/reset-password continua uniforme (referência do bom padrão)", async () => {
    const knowRes = await jsonRequest({ app: ctx.app, path: "/auth/reset-password" }, "POST", {
      email: KNOWN_EMAIL,
    })
    const unknownRes = await jsonRequest({ app: ctx.app, path: "/auth/reset-password" }, "POST", {
      email: UNKNOWN_EMAIL,
    })
    expect(knowRes.status).toBe(unknownRes.status)
    expect(await knowRes.text()).toBe(await unknownRes.text())
  })
})
