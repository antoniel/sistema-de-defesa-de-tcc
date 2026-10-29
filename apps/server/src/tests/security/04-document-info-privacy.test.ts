/**
 * Vulnerabilidade 6 — Professor lê dados de bancas privadas.
 *
 * `GET /documentos/info/:bancaId` → `getBancaInfoForDocument` consulta por id
 * sem checagem de visibilidade nem de membership (o `checkUserAccessToBanca`
 * existe no documento.service mas não tem callers). Qualquer TEACHER itera os
 * ids e extrai abstract, membros, contatos de TODAS as bancas, incluindo
 * `visible: false`, contornando o modelo de privacidade de getBancaById.
 *
 * Especificação: dados de banca privada (visible=false) só podem ser lidos
 * por membro da banca ou ADMIN; TEACHER sem relação recebe erro (403/404),
 * nunca os dados da banca.
 *
 * Como explorar hoje (token de qualquer professor):
 *   curl http://localhost:9000/documentos/info/3 -H "Authorization: Bearer <jwt-prof>"
 */
import { beforeAll, describe, expect, it } from "vitest"

import { E2E_ACCOUNTS, E2E_BANCAS } from "@tcc/tests"

import { buildSecurityApp, jsonRequest, loginAs, type SecurityTestContext } from "./app"

const PRIVATE_BANCA_TITLE = E2E_BANCAS.upcomingPrivate.tituloTrabalho

describe("segurança: documentos/info respeita a privacidade da banca", () => {
  let ctx: SecurityTestContext

  beforeAll(async () => {
    ctx = await buildSecurityApp()
  })

  it("TEACHer sem relação com a banca privada não pode ler os dados", async () => {
    const teacherToken = await loginAs(ctx, {
      email: E2E_ACCOUNTS.teacher2.email, // orientador só da pública id 2; fora da privada id 3
      password: "senha-e2e-123",
    })
    const res = await jsonRequest(
      { app: ctx.app, path: `/documentos/info/${E2E_BANCAS.upcomingPrivate.id}` },
      "GET",
      undefined,
      teacherToken,
    )
    expect([403, 404]).toContain(res.status)
    expect(await res.text()).not.toContain(PRIVATE_BANCA_TITLE)
  })

  it("controle: o orientador MEMBRO da banca privada continua podendo ler", async () => {
    const orientadorToken = await loginAs(ctx, {
      email: E2E_ACCOUNTS.teacher.email, // orientador da privada id 3
      password: "senha-e2e-123",
    })
    const res = await jsonRequest(
      { app: ctx.app, path: `/documentos/info/${E2E_BANCAS.upcomingPrivate.id}` },
      "GET",
      undefined,
      orientadorToken,
    )
    expect(res.status).toBe(200)
    expect(await res.text()).toContain(PRIVATE_BANCA_TITLE)
  })

  it("controle: ADMIN continua podendo ler a banca privada", async () => {
    const adminToken = await loginAs(ctx, {
      email: E2E_ACCOUNTS.admin.email,
      password: "senha-e2e-123",
    })
    const res = await jsonRequest(
      { app: ctx.app, path: `/documentos/info/${E2E_BANCAS.upcomingPrivate.id}` },
      "GET",
      undefined,
      adminToken,
    )
    expect(res.status).toBe(200)
    expect(await res.text()).toContain(PRIVATE_BANCA_TITLE)
  })
})
