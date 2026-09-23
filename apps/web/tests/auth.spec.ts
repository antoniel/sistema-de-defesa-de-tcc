import { E2E_ACCOUNTS, E2E_PASSWORD } from "@tcc/tests"
import { expect, test } from "./fixtures/test"
import { searchBancas, visit } from "./support/navigation"

/**
 * O único lugar que exercita o login pela interface.
 * As outras specs usam `asAdmin`/`asTeacher`/`asStudent`, que injetam o token
 * direto no `localStorage` — mais rápido e sem depender do dialog.
 */

async function openLoginDialog(page: import("@playwright/test").Page) {
  await visit(page, "/")
  await page.getByRole("button", { name: "Login" }).click()
  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible()
}

test.describe("Autenticação", () => {
  test("faz login pela interface e passa a ver o menu do usuário", async ({ page }) => {
    await openLoginDialog(page)

    await page.getByLabel("Email").fill(E2E_ACCOUNTS.admin.email)
    await page.locator("#login-password").fill(E2E_PASSWORD)
    await page.getByRole("button", { name: "Entrar" }).click()

    await expect(
      page.getByRole("button", { name: `Menu do usuário: ${E2E_ACCOUNTS.admin.nome}` }),
    ).toBeVisible()
    await expect(page.getByRole("button", { name: "Login" })).toBeHidden()
  })

  test("recusa credenciais inválidas e mantém o usuário deslogado", async ({ page }) => {
    await openLoginDialog(page)

    await page.locator("#login-email").fill(E2E_ACCOUNTS.admin.email)
    await page.locator("#login-password").fill("senha-errada-123")
    await page.getByRole("button", { name: "Entrar" }).click()

    /* O dialog continua aberto, com a mensagem de erro do backend. */
    await expect(page.getByText("Usuário ou senha inválidos.")).toBeVisible()

    /* E nenhuma sessão foi criada (o header fica escondido pelo Radix enquanto o dialog está aberto). */
    const token = await page.evaluate(() => localStorage.getItem("authToken"))
    expect(token, "não deveria existir token após falha de login").toBeNull()
  })

  test("faz logout e volta ao estado anônimo", async ({ asAdmin }) => {
    await visit(asAdmin, "/")
    await asAdmin.getByRole("button", { name: `Menu do usuário: ${E2E_ACCOUNTS.admin.nome}` }).click()
    await asAdmin.getByRole("menuitem", { name: "Sair" }).click()

    await expect(asAdmin.getByRole("button", { name: "Login" })).toBeVisible()
    await expect(
      asAdmin.getByRole("button", { name: `Menu do usuário: ${E2E_ACCOUNTS.admin.nome}` }),
    ).toBeHidden()
  })

  test("a sessão sobrevive a um reload", async ({ asAdmin }) => {
    await visit(asAdmin, "/")
    await expect(
      asAdmin.getByRole("button", { name: `Menu do usuário: ${E2E_ACCOUNTS.admin.nome}` }),
    ).toBeVisible()

    await asAdmin.reload()
    await expect(
      asAdmin.getByRole("button", { name: `Menu do usuário: ${E2E_ACCOUNTS.admin.nome}` }),
    ).toBeVisible()
  })
})
