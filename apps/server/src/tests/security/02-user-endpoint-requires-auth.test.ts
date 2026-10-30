/**
 * Vulnerabilidade 2 — Diretório de usuários público.
 *
 * `GET /usuario/:id` responde nome, email, matrícula, bio e role de qualquer
 * id sem exigir autenticação — enumeração em loop colhe a base inteira.
 *
 * Especificação: leitura de usuário por id exige usuário autenticado; anônimo
 * recebe 401/403 em vez dos dados.
 *
 * Como explorar hoje: `curl http://localhost:9000/usuario/1`
 */
import { beforeAll, describe, expect, it } from "vitest"

import { E2E_ACCOUNTS } from "@tcc/tests"

import { buildSecurityApp, expectAuthError, type SecurityTestContext } from "./app"

describe("segurança: diretório de usuários exige autenticação", () => {
  let ctx: SecurityTestContext

  beforeAll(async () => {
    ctx = await buildSecurityApp()
  })

  it("anônimo não pode ler perfil de usuário por id", async () => {
    const res = await ctx.app.request(`/usuario/${E2E_ACCOUNTS.admin.id}`)
    expectAuthError(res.status)
  })

  it("anônimo não pode ler perfil de outro usuário por id", async () => {
    const res = await ctx.app.request(`/usuario/${E2E_ACCOUNTS.teacher.id}`)
    expectAuthError(res.status)
  })
})
