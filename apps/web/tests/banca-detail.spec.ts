import { E2E_ACCOUNTS, E2E_BANCAS } from "@tcc/tests"
import { expect, test } from "./fixtures/test"
import { searchBancas, visit } from "./support/navigation"

/**
 * Página de detalhes da defesa: visibilidade e o link de download do PDF.
 *
 * Os IDs vêm do seed determinístico (`E2E_BANCAS`), então dá para afirmar
 * sobre bancas públicas/privadas sem descobri-las em runtime.
 */

test.describe("Detalhes da defesa", () => {
  test("visitante anônimo vê uma banca pública", async ({ page }) => {
    await visit(page, `/banca/${E2E_BANCAS.upcomingPublic.id}`)

    await expect(page.getByRole("heading", { name: E2E_BANCAS.upcomingPublic.tituloTrabalho })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Detalhes da Defesa" })).toBeVisible()
    await expect(page.getByText(E2E_ACCOUNTS.busyStudent.nome)).toBeVisible()
    /* Sem sessão, o botão de editar não aparece. */
    await expect(page.getByRole("button", { name: "Editar" })).toBeHidden()
  })

  test("visitante anônimo não consegue abrir uma banca privada", async ({ page }) => {
    await visit(page, `/banca/${E2E_BANCAS.upcomingPrivate.id}`)

    await expect(page.getByText("Erro ao carregar dados da banca")).toBeVisible()
    await expect(page.getByRole("heading", { name: E2E_BANCAS.upcomingPrivate.tituloTrabalho })).toBeHidden()
  })

  test("o admin enxerga a banca privada", async ({ asAdmin }) => {
    await visit(asAdmin, `/banca/${E2E_BANCAS.upcomingPrivate.id}`)

    await expect(asAdmin.getByRole("heading", { name: E2E_BANCAS.upcomingPrivate.tituloTrabalho })).toBeVisible()
    await expect(asAdmin.getByRole("button", { name: "Editar" })).toBeVisible()
  })

  test("mostra o botão de download quando a banca tem link do PDF", async ({ page, factory, api, unique }) => {
    const student = await factory.createStudent()
    const link = `https://repositorio.ufba.br/handle/ri/${unique}`
    const banca = await factory.createBanca({
      alunoId: student.id,
      orientadorId: E2E_ACCOUNTS.teacher.id,
      linkTrabalho: link,
    })

    /* Visão anônima: o link tem que estar disponível para qualquer um. */
    await visit(page, `/banca/${banca.id}`)
    await expect(page.getByRole("heading", { name: "Trabalho Completo" })).toBeVisible()
    const download = page.getByRole("link", { name: "Baixar PDF do TCC" })
    await expect(download).toBeVisible()
    await expect(download).toHaveAttribute("href", link)
    await expect(download).toHaveAttribute("target", "_blank")

    /* Confere que a API persistiu exatamente o que foi enviado. */
    const res = await api.get(`/banca/${banca.id}`)
    expect(res.ok()).toBeTruthy()
    expect(((await res.json()) as { linkTrabalho: string | null }).linkTrabalho).toBe(link)
  })

  test("não mostra a seção de download quando a banca não tem link", async ({ page, factory }) => {
    const student = await factory.createStudent()
    const banca = await factory.createBanca({
      alunoId: student.id,
      orientadorId: E2E_ACCOUNTS.teacher.id,
    })

    await visit(page, `/banca/${banca.id}`)
    await expect(page.getByRole("heading", { name: banca.tituloTrabalho })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Trabalho Completo" })).toBeHidden()
    await expect(page.getByRole("link", { name: "Baixar PDF do TCC" })).toBeHidden()
  })
})
