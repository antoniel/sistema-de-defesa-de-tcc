import type { Page } from "@playwright/test"
import { E2E_ACCOUNTS, E2E_CURSOS } from "@tcc/tests"
import { expect, test, type CreatedUser } from "./fixtures/test"
import { searchBancas, visit } from "./support/navigation"
import {
  expectReview,
  fillBasicInfo,
  fillMetadata,
  goToStep,
  selectAvaliador,
  selectOrientador,
  submitWizard,
} from "./support/wizard"

// Cada cenário usa um aluno novo: não consome o aluno compartilhado do seed.
// Login, formulário e submissão passam pela interface; nenhuma resposta é mockada.
async function prepareStudentDefense(page: Page, student: CreatedUser, titulo: string) {
  await visit(page, "/")
  await page.getByRole("button", { name: "Login" }).click()
  await page.locator("#login-email").fill(student.email)
  await page.locator("#login-password").fill(student.password)
  await page.getByRole("button", { name: "Entrar" }).click()
  await expect(page.getByRole("button", { name: `Menu do usuário: ${student.nome}` })).toBeVisible()
  await page.getByRole("button", { name: "Cadastrar Defesa de TCC" }).click()

  await fillBasicInfo(page, {
    titulo,
    resumo: "Regressão do cadastro de defesa pelo próprio aluno.",
    abstract: "Regression test for a student registering their own defense.",
  })
  await goToStep(page, 1)
  await expect(page.locator("#autor")).toHaveValue(student.nome)
  await expect(page.locator("#autor")).toBeDisabled()
  await expect(page.getByLabel("Matrícula")).toHaveValue(student.matricula)
  await selectOrientador(page, E2E_ACCOUNTS.teacher.nome)
  await goToStep(page, 2)
  await fillMetadata(page, {
    palavrasChave: "e2e, aluno, cadastro",
    turma: "GICC0002 PROJETO FINAL DE CURSO II",
    curso: E2E_CURSOS.bcc.nome,
    periodoAcademico: "2026.2",
    data: "2099-11-17",
    hora: "09:00",
    modalidade: "Remoto",
    local: "https://meet.google.com/e2e-aluno",
  })
  await goToStep(page, 3)
  await selectAvaliador(page, 2, E2E_ACCOUNTS.teacher2.nome)
  await goToStep(page, 4)
  await expectReview(page, { titulo, aluno: student.nome })
}

function waitForCreation(page: Page) {
  return page.waitForResponse(
    (response) => new URL(response.url()).pathname === "/banca" && response.request().method() === "POST",
  )
}

test.describe("Regressão do cadastro pelo aluno", () => {
  test("cadastra a própria defesa e a encontra na lista principal após recarregar", async ({
    page, factory, api, unique,
  }) => {
    const student = await factory.createStudent()
    const titulo = `Defesa do aluno ${unique}`
    await prepareStudentDefense(page, student, titulo)

    const responsePromise = waitForCreation(page)
    await submitWizard(page)
    const response = await responsePromise
    expect(response.status(), await response.text()).toBe(201)
    expect(response.request().postDataJSON()).toMatchObject({ alunoId: student.id })
    const created = await response.json()

    // O toast sozinho aceitava o bug original: exigimos persistência e uma linha real.
    const detail = await api.get(`/banca/${created.id}`)
    expect(detail.ok()).toBeTruthy()
    expect(await detail.json()).toMatchObject({ tituloTrabalho: titulo, alunoId: student.id })
    await searchBancas(page, titulo)
    const row = page.getByTestId("table-upcoming").locator("tbody tr").filter({ hasText: titulo })
    await expect(row).toHaveCount(1)
    await expect(row).toContainText(student.nome)
    await page.reload()
    await expect(page.locator('html[data-hydrated="true"]')).toHaveCount(1)
    await searchBancas(page, titulo)
    await expect(row).toHaveCount(1)
    await expect(row).toContainText(student.nome)
  })

  test("exibe o erro real da API sem falso sucesso e preserva o formulário", async ({
    page, factory, api, unique,
  }) => {
    const student = await factory.createStudent()
    const titulo = `Defesa rejeitada ${unique}`
    await prepareStudentDefense(page, student, titulo)

    // Simula outro cadastro concluído enquanto o aluno preenchia o formulário.
    // A restrição aluno/curso produz um 409 real, sem interceptar a API.
    await factory.createBanca({ alunoId: student.id, orientadorId: E2E_ACCOUNTS.teacher.id })
    const responsePromise = waitForCreation(page)
    await page.getByRole("button", { name: "Salvar Defesa" }).click()
    const response = await responsePromise
    expect(response.status()).toBe(409)
    const error = await response.json()
    expect(error.message).toBe("Este aluno já possui uma banca cadastrada para este curso.")
    await expect(page.getByText(error.message, { exact: true })).toBeVisible()
    await expect(page.getByText("Erro ao cadastrar defesa ❌", { exact: true })).toBeVisible()
    await expect(page.getByText("Defesa cadastrada com sucesso ✅", { exact: true })).toBeHidden()
    await expect(page).toHaveURL((url) => url.pathname === "/add-banca")
    await expectReview(page, { titulo, aluno: student.nome })
    await expect(page.getByRole("button", { name: "Salvar Defesa" })).toBeEnabled()

    const listing = await api.get(`/banca?searchQuery=${encodeURIComponent(titulo)}&limit=100`)
    expect(listing.ok()).toBeTruthy()
    expect(await listing.json()).toMatchObject({ upcoming: [], past: [] })
  })
})
