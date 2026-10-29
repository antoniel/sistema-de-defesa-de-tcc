/**
 * Vulnerabilidade 3 — Escalação de privilégio TEACHER → ADMIN.
 *
 * `POST /usuario` aceita TEACHER (checkRole ["ADMIN","TEACHER"]) e o
 * `createUserSchema` é o insert inteiro SEM omitir `role`; o serviço aplica
 * `role: userData.role`. Um professor cria contas ADMIN à vontade.
 *
 * Especificação: apenas ADMIN pode criar usuários com role elevada (ADMIN).
 * Se a rota permitir a criação, a role do usuário criado NUNCA pode ser
 * superior à do chamador — em particular, TEACHER não pode criar ADMIN.
 * Não se especifica aqui qual mecanismo (403, ignorar o campo, etc.).
 *
 * Como explorar hoje (com token de professor):
 *   curl -X POST http://localhost:9000/usuario \
 *     -H "Authorization: Bearer <jwt-teachers>" -H "Content-Type: application/json" \
 *     -d '{"email":"evil@x.com","nome":"Evil","password":"12345678",
 *          "matricula":"1","role":"ADMIN","school":"x","academicTitle":"x"}'
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { E2E_ACCOUNTS } from "@tcc/tests"

import { buildSecurityApp, jsonRequest, loginAs, type SecurityTestContext } from "./app"

const TEACHER_CREDENTIALS = {
  email: E2E_ACCOUNTS.teacher.email,
  password: "senha-e2e-123",
}

describe("segurança: TEACHER não pode criar usuário ADMIN", () => {
  let ctx: SecurityTestContext
  let teacherToken: string
  const createdUserIds: number[] = []

  beforeAll(async () => {
    ctx = await buildSecurityApp()
    teacherToken = await loginAs(ctx, TEACHER_CREDENTIALS)
  })

  afterAll(async () => {
    for (const id of createdUserIds) {
      await ctx.db.execute(`DELETE FROM usuario WHERE id = ${id}`)
    }
  })

  it("POST /usuario com role ADMIN por TEACHER não pode resultar em conta ADMIN", async () => {
    const payload = {
      email: "escalada-professor@security-test.local",
      nome: "Escalada Professor",
      password: "senha-segura-123",
      matricula: "SEC-ESCALADA-1",
      school: "Instituto de Computação",
      academicTitle: "Graduando",
      role: "ADMIN",
    }
    const res = await jsonRequest({ app: ctx.app, path: "/usuario" }, "POST", payload, teacherToken)
    const text = await res.text()
    const data = text ? (JSON.parse(text) as { id?: number; role?: string }) : null

    // A rota pode recusar a operação OU criar ignorando o campo role.
    // O proibido é um único resultado: usuário ADMIN existindo no fim.
    if (res.status < 400 && data?.id) {
      createdUserIds.push(data.id)
      expect(data.role).not.toBe("ADMIN")
    } else {
      expect(res.status).toBe(403)
    }
  })

  it("controle: TEACHER continua podendo criar usuário TEACHER", async () => {
    const payload = {
      email: "professor-legitimo@security-test.local",
      nome: "Professor Legitimo",
      password: "senha-segura-123",
      matricula: "SEC-LEGITIMO-1",
      school: "Instituto de Computação",
      academicTitle: "Doutorado",
      role: "TEACHER",
    }
    const res = await jsonRequest({ app: ctx.app, path: "/usuario" }, "POST", payload, teacherToken)
    expect(res.status).toBe(201)
    const data = (await res.json()) as { id: number; role: string }
    createdUserIds.push(data.id)
    expect(data.role).toBe("TEACHER")
  })
})
