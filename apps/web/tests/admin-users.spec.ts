import { E2E_ACCOUNTS, E2E_BANCAS } from "@tcc/tests"
import { expect, test } from "./fixtures/test"
import { searchBancas, visit } from "./support/navigation"

/**
 * Administração de usuários (portado do antigo `admin-user-detail.spec.ts`,
 * agora usando as fixtures de auth em vez de logar pela interface a cada teste).
 */

async function goToAdminUsers(page: import("@playwright/test").Page) {
  await visit(page, "/")
  await page.getByRole("button", { name: `Menu do usuário: ${E2E_ACCOUNTS.admin.nome}` }).click()
  await page.getByRole("menuitem", { name: "Gerenciar Usuários" }).click()
  await expect(page.getByRole("heading", { name: "Gerenciamento de Usuários" })).toBeVisible()
}

test.describe("Admin — usuários", () => {
  test("lista os usuários e abre o detalhe de um deles", async ({ asAdmin }) => {
    await goToAdminUsers(asAdmin)

    await asAdmin.getByRole("row", { name: new RegExp(E2E_ACCOUNTS.teacher.email, "i") }).click()

    await expect(asAdmin).toHaveURL(/\/admin\/users\/\d+/)
    await expect(asAdmin.getByText(E2E_ACCOUNTS.teacher.nome)).toBeVisible()
    await expect(asAdmin.getByText(E2E_ACCOUNTS.teacher.email)).toBeVisible()
    await expect(asAdmin.getByText(E2E_ACCOUNTS.teacher.matricula)).toBeVisible()
    await expect(asAdmin.getByText("Professor", { exact: true }).first()).toBeVisible()
    await expect(asAdmin.getByText("Instituto de Computação")).toBeVisible()
  })

  test("mostra as associações em bancas do orientador", async ({ asAdmin }) => {
    await goToAdminUsers(asAdmin)

    await asAdmin.getByRole("row", { name: new RegExp(E2E_ACCOUNTS.teacher.email, "i") }).click()
    await expect(asAdmin).toHaveURL(/\/admin\/users\/\d+/)

    await expect(asAdmin.getByText("Associações em Bancas")).toBeVisible()
    await expect(asAdmin.getByText(E2E_BANCAS.upcomingPublic.tituloTrabalho).first()).toBeVisible()
  })

  test("o aluno do seed aparece como Aluno no detalhe", async ({ asAdmin }) => {
    await goToAdminUsers(asAdmin)

    await asAdmin.getByRole("row", { name: new RegExp(E2E_ACCOUNTS.freeStudent.email, "i") }).click()

    await expect(asAdmin).toHaveURL(/\/admin\/users\/\d+/)
    await expect(asAdmin.getByText("Aluno", { exact: true }).first()).toBeVisible()
    await expect(asAdmin.getByText(E2E_ACCOUNTS.freeStudent.nome)).toBeVisible()
  })

  test("aluno não tem acesso à área de administração", async ({ asStudent }) => {
    await visit(asStudent, "/")
    await asStudent.getByRole("button", { name: /Menu do usuário/ }).click()

    await expect(asStudent.getByRole("menuitem", { name: "Gerenciar Usuários" })).toBeHidden()
  })
})
