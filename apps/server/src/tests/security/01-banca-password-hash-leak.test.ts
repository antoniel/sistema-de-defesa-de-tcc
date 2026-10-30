/**
 * Vulnerabilidade 1 — Vazamento de hash de senha em respostas de banca.
 *
 * As queries relacionais `membros: { with: { usuario: true } }` retornam o
 * usuário INTEIRO (incluindo `passwordHash`) e as rotas devolvem esse objeto
 * direto ao cliente, sem passar por `toPublicUser/publicUserColumns`.
 *
 * Especificação: nenhuma resposta da API pode conter `passwordHash` nem um
 * hash bcrypt (`$2a$/$2b$/$2y$`) em qualquer campo, com ou sem autenticação.
 *
 * Como explorar hoje (com servidor na porta 9000):
 *   curl http://localhost:9000/banca/1  → membros com "passwordHash": "$2b$..."
 */
import { beforeAll, describe, expect, it } from "vitest"

import { E2E_ACCOUNTS, E2E_BANCAS } from "@tcc/tests"

import {
  buildSecurityApp,
  loginAs,
  type SecurityTestContext,
} from "./app"

const BCRYPT_HASH_PATTERN = /\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}/

const expectNoPasswordLeak = (text: string) => {
  expect(text).not.toContain("passwordHash")
  expect(text).not.toMatch(BCRYPT_HASH_PATTERN)
}

describe("securidade: vazamento de passwordHash em respostas de banca", () => {
  let ctx: SecurityTestContext

  beforeAll(async () => {
    ctx = await buildSecurityApp()
  })

  it("GET /banca/:id (pública, anônimo) não pode conter hashes", async () => {
    const res = await ctx.app.request(`/banca/${E2E_BANCAS.upcomingPublic.id}`)
    expect(res.status).toBe(200)
    expectNoPasswordLeak(await res.text())
  })

  it("GET /banca (listagem, anônimo) não pode conter hashes", async () => {
    const res = await ctx.app.request("/banca")
    expect(res.status).toBe(200)
    expectNoPasswordLeak(await res.text())
  })

  it("GET /banca/:id (privada) não pode conter hashes mesmo quando visível para o dono", async () => {
    const token = await loginAs(ctx, {
      email: E2E_ACCOUNTS.admin.email,
      password: "senha-e2e-123",
    })
    const res = await ctx.app.request(`/banca/${E2E_BANCAS.upcomingPrivate.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status).toBe(200)
    expectNoPasswordLeak(await res.text())
  })

  it("GET /banca/usuario/:userId (anônimo) não pode conter hashes", async () => {
    const res = await ctx.app.request(`/banca/usuario/${E2E_ACCOUNTS.teacher.id}`)
    expect(res.status).toBe(200)
    expectNoPasswordLeak(await res.text())
  })

  it("GET /usuario/:id/bancas (anônimo) não pode conter hashes", async () => {
    const res = await ctx.app.request(`/usuario/${E2E_ACCOUNTS.teacher.id}/bancas`)
    expect(res.status).toBe(200)
    expectNoPasswordLeak(await res.text())
  })

  it("GET /banca/upcoming e /banca/past (anônimo) não podem conter hashes", async () => {
    for (const path of ["/banca/upcoming", "/banca/past"]) {
      const res = await ctx.app.request(path)
      expect(res.status).toBe(200)
      expectNoPasswordLeak(await res.text())
    }
  })
})
