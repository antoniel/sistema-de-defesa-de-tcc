import { E2E_ACCOUNTS, E2E_BANCAS, E2E_CURSOS } from "@tcc/tests"
import { expect, test } from "./fixtures/test"
import { searchBancas, visit } from "./support/navigation"

/**
 * Lista de defesas: busca, paginação e ordenação.
 *
 * Cuidados que evitam flake:
 * - A página tem DUAS tabelas ("Próximas defesas" e "Defesas anteriores"), e a seção
 *   vazia renderiza uma linha de "nenhuma defesa". Por isso todo assert de linha é
 *   escopado pelo `data-testid` da tabela certa.
 * - As contagens são sempre sobre bancas criadas pelo próprio teste (prefixo único),
 *   nunca sobre o total global — que cresce a cada execução.
 */

const linhasDaTabela = (page: import("@playwright/test").Page, tabela: "table-upcoming" | "table-past") =>
  page.getByTestId(tabela).locator("tbody tr")

test.describe("Lista de defesas", () => {
  test("visitante anônimo vê a lista pública", async ({ page }) => {
    await visit(page, "/")

    await expect(page.getByRole("heading", { name: "Próximas defesas" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Defesas anteriores" })).toBeVisible()

    /* A banca passada do seed é a única do passado, então essa contagem é estável. */
    await expect(linhasDaTabela(page, "table-past")).toHaveCount(1)
    await expect(linhasDaTabela(page, "table-past").first()).toContainText(E2E_BANCAS.pastPublic.tituloTrabalho)

    /* A lista de próximas cresce a cada execução: busca antes de contar. */
    await searchBancas(page, E2E_BANCAS.upcomingPublic.tituloTrabalho)
    await expect(linhasDaTabela(page, "table-upcoming")).toHaveCount(1)
    await expect(linhasDaTabela(page, "table-upcoming").first()).toContainText(
      E2E_BANCAS.upcomingPublic.tituloTrabalho,
    )

    /* Banca privada não aparece para anônimo, nem na busca.
       (Não use getByText aqui: o termo buscado é ecoado no texto da paginação.) */
    await searchBancas(page, E2E_BANCAS.upcomingPrivate.tituloTrabalho)
    await expect(linhasDaTabela(page, "table-upcoming")).toHaveCount(0)
  })

  test("a busca filtra pelo título do trabalho", async ({ page, factory, unique }) => {
    const alvo = await factory.createBanca({
      alunoId: (await factory.createStudent()).id,
      orientadorId: E2E_ACCOUNTS.teacher.id,
      tituloTrabalho: `Busca E2E ${unique} alvo`,
    })
    await factory.createBanca({
      alunoId: (await factory.createStudent()).id,
      orientadorId: E2E_ACCOUNTS.teacher.id,
      tituloTrabalho: `Busca E2E ${unique} outro`,
    })

    await visit(page, "/")
    await searchBancas(page, `Busca E2E ${unique}`)

    const linhas = linhasDaTabela(page, "table-upcoming")
    await expect(linhas).toHaveCount(2)
    await expect(linhas.filter({ hasText: alvo.tituloTrabalho })).toHaveCount(1)
    await expect(page.getByTestId("pagination-upcoming")).toContainText("Exibindo 2 de 2 resultados")
  })

  test("a busca encontra pelo nome do discente", async ({ page, factory, unique }) => {
    const student = await factory.createStudent()
    const banca = await factory.createBanca({
      alunoId: student.id,
      orientadorId: E2E_ACCOUNTS.teacher.id,
      autor: student.nome,
      tituloTrabalho: `Busca por discente ${unique}`,
    })

    await visit(page, "/")
    await searchBancas(page, student.nome)

    await expect(linhasDaTabela(page, "table-upcoming").filter({ hasText: banca.tituloTrabalho })).toHaveCount(1)
  })

  /**
   * Regressão: a contagem sempre fazia JOIN com `usuario`, mas a listagem só fazia JOIN
   * quando a ordenação era por campo relacionado. Buscar pelo nome do orientador devolvia
   * `total > 0` com zero linhas.
   *
   * Usa um orientador recém-criado com nome único: buscar por um professor do seed traria
   * bancas de outros testes rodando em paralelo, e o resultado deixaria de ser determinístico.
   */
  test("a busca encontra pelo nome do orientador", async ({ page, factory, unique }) => {
    const orientador = await factory.createTeacher({ nome: `Orientador Busca ${unique}` })
    const banca = await factory.createBanca({
      alunoId: (await factory.createStudent()).id,
      orientadorId: orientador.id,
      tituloTrabalho: `Defesa busca orientador ${unique}`,
    })

    await visit(page, "/")
    await searchBancas(page, orientador.nome)

    const linhas = linhasDaTabela(page, "table-upcoming")
    await expect(linhas).toHaveCount(1)
    await expect(linhas.first()).toContainText(banca.tituloTrabalho)

    /* O total reportado tem que bater com o que foi listado. */
    await expect(page.getByTestId("pagination-upcoming")).toContainText("Exibindo 1 de 1 resultado")
  })

  test("pagina os resultados e respeita o tamanho de página", async ({ page, factory, unique }) => {
    /* 7 bancas com o mesmo prefixo: mais que o tamanho de página mínimo (5). */
    const prefixo = `Paginacao E2E ${unique}`
    for (let i = 0; i < 7; i++) {
      await factory.createBanca({
        alunoId: (await factory.createStudent()).id,
        orientadorId: E2E_ACCOUNTS.teacher.id,
        tituloTrabalho: `${prefixo} #${i}`,
      })
    }

    await visit(page, "/")
    await searchBancas(page, prefixo)

    const paginacao = page.getByTestId("pagination-upcoming")
    await expect(paginacao).toContainText("Exibindo 7 de 7 resultados")

    /* 5 por página → 2 páginas. */
    await page.getByTestId("rows-per-page").click()
    await page.getByRole("option", { name: "5" }).click()
    await expect(paginacao).toContainText("Exibindo 5 de 7 resultados")
    await expect(paginacao).toContainText("Paginação 1 de 2")
    await expect(linhasDaTabela(page, "table-upcoming")).toHaveCount(5)

    await paginacao.getByRole("button", { name: "Próximo" }).click()
    await expect(paginacao).toContainText("Exibindo 2 de 7 resultados")
    await expect(paginacao).toContainText("Paginação 2 de 2")
    await expect(linhasDaTabela(page, "table-upcoming")).toHaveCount(2)

    /* Na última página, "Próximo" fica desabilitado e "Anterior" volta. */
    await expect(paginacao.getByRole("button", { name: "Próximo" })).toBeDisabled()
    await paginacao.getByRole("button", { name: "Anterior" }).click()
    await expect(paginacao).toContainText("Paginação 1 de 2")
  })

  test("ordena pelo título do trabalho", async ({ page, factory, unique }) => {
    const prefixo = `Ordenacao E2E ${unique}`
    await factory.createBanca({
      alunoId: (await factory.createStudent()).id,
      orientadorId: E2E_ACCOUNTS.teacher.id,
      tituloTrabalho: `${prefixo} AAA`,
    })
    await factory.createBanca({
      alunoId: (await factory.createStudent()).id,
      orientadorId: E2E_ACCOUNTS.teacher.id,
      tituloTrabalho: `${prefixo} ZZZ`,
    })

    await visit(page, "/")
    await searchBancas(page, prefixo)

    const linhas = linhasDaTabela(page, "table-upcoming")
    await expect(linhas).toHaveCount(2)

    const cabecalhoTitulo = page.getByRole("columnheader", { name: /Título do Trabalho/ }).first()
    await cabecalhoTitulo.click()
    await expect(linhas.first()).toContainText(`${prefixo} AAA`)
    await cabecalhoTitulo.click()
    await expect(linhas.first()).toContainText(`${prefixo} ZZZ`)
  })

  test("o admin tem o atalho de cadastro e o filtro de curso", async ({ asAdmin }) => {
    await visit(asAdmin, "/")

    await expect(asAdmin.getByRole("button", { name: "Cadastrar Defesa de TCC" })).toBeVisible()
    await expect(asAdmin.getByRole("tab", { name: "Minhas defesas" })).toBeVisible()
    await expect(asAdmin.getByText(E2E_CURSOS.bcc.sigla).first()).toBeVisible()
  })
})
