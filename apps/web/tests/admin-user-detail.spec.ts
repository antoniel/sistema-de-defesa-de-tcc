import { expect, test } from "@playwright/test"

const ADMIN_EMAIL = "admin@test.com"
const ADMIN_PASSWORD = "Password123!"
const TEACHER_EMAIL = "teacher@test.com"

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/")
  await page.getByRole("button", { name: /login|entrar/i }).first().click()
  await page.getByLabel(/email/i).fill(ADMIN_EMAIL)
  await page.locator("#login-password").fill(ADMIN_PASSWORD)
  await page.getByRole("button", { name: /entrar/i }).click()
  await expect(page.getByText(/olá|admin test/i)).toBeVisible({ timeout: 10000 })
}

async function goToAdminUsers(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: /olá|admin test/i }).click()
  await page.getByRole("link", { name: /gerenciar usuários/i }).click()
  await expect(page.getByRole("heading", { name: /gerenciamento de usuários/i })).toBeVisible({ timeout: 5000 })
}

test.describe("[USR-005, USR-006, USR-007, USR-008, USR-009] Admin View User Detail", () => {
  test("[USR-005] Admin navigates to user detail by selecting a user row", async ({ page }) => {
    await loginAsAdmin(page)
    await goToAdminUsers(page)

    await page.getByRole("row", { name: new RegExp(TEACHER_EMAIL, "i") }).click()

    await expect(page).toHaveURL(/\/admin\/users\/\d+/)
    await expect(page.getByText("Professor Test")).toBeVisible()
    await expect(page.getByText(TEACHER_EMAIL)).toBeVisible()
    await expect(page.getByText("PROF123")).toBeVisible()
    await expect(page.getByText("Professor")).toBeVisible()
    await expect(page.getByText("UFBA")).toBeVisible()
    await expect(page.getByText("Doutor")).toBeVisible()
  })

  test("[USR-006] Admin sees user associations on detail screen", async ({ page }) => {
    await loginAsAdmin(page)
    await goToAdminUsers(page)

    await page.getByRole("row", { name: new RegExp(TEACHER_EMAIL, "i") }).click()

    await expect(page).toHaveURL(/\/admin\/users\/\d+/)
    await expect(page.getByText("Associações em Bancas")).toBeVisible()
    await expect(page.getByText("Orientador")).toBeVisible()
    await expect(page.getByText("Sistema de Recomendação para Testes E2E")).toBeVisible()
  })

  test("[USR-007] Admin sees empty associations when user has none", async ({ page }) => {
    await loginAsAdmin(page)
    await goToAdminUsers(page)

    await page.getByRole("row", { name: new RegExp("admin@test.com", "i") }).click()

    await expect(page).toHaveURL(/\/admin\/users\/\d+/)
    await expect(page.getByText("Associações em Bancas")).toBeVisible()
    await expect(page.getByText(/nenhuma banca ou participação encontrada/i)).toBeVisible()
  })

  test("[USR-008] Admin can return from user detail to user list", async ({ page }) => {
    await loginAsAdmin(page)
    await goToAdminUsers(page)

    await page.getByRole("row", { name: new RegExp(TEACHER_EMAIL, "i") }).click()
    await expect(page).toHaveURL(/\/admin\/users\/\d+/)

    await page.getByRole("button", { name: /voltar/i }).click()
    await expect(page).toHaveURL("/admin/users")
    await expect(page.getByRole("heading", { name: /gerenciamento de usuários/i })).toBeVisible()
    await expect(page.getByRole("table")).toBeVisible()
  })

  test("[USR-009] Non-admin cannot access user detail", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: /login|entrar/i }).first().click()
    await page.getByLabel(/email/i).fill(TEACHER_EMAIL)
    await page.locator("#login-password").fill(ADMIN_PASSWORD)
    await page.getByRole("button", { name: /entrar/i }).click()
    await expect(page.getByText(/olá|professor/i)).toBeVisible({ timeout: 10000 })

    await page.goto("/admin/users/1")
    await expect(page).toHaveURL("/")
  })
})
