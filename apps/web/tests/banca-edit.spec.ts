import { E2E_ACCOUNTS, E2E_BANCAS, E2E_CURSOS } from "@tcc/tests"
import { expect, test } from "./fixtures/test"
import { searchBancas, visit } from "./support/navigation"

/**
 * Edição da defesa.
 *
 * O primeiro teste é a regressão do bug em que os `Select` do Radix zeravam
 * curso/orientador ao montar, e o formulário só validava depois que o usuário
 * tocava em algum campo — ou seja, salvar uma banca intocada dava 500.
 */

test.describe("Edição da defesa", () => {
  test("carrega os valores atuais e salva sem precisar tocar em nenhum campo", async ({ asAdmin }) => {
    const id = E2E_BANCAS.upcomingPublic.id

    await visit(asAdmin, `/banca/${id}/edit`)
    await expect(asAdmin.getByRole("heading", { name: "Editar Defesa de TCC" })).toBeVisible()

    /* Regressão: os selects precisam estar preenchidos logo após o load. */
    await expect(asAdmin.getByLabel("Curso", { exact: true })).toHaveText(E2E_CURSOS.bcc.nome)
    await expect(asAdmin.getByLabel("Orientador", { exact: true })).toContainText(E2E_ACCOUNTS.teacher.nome)
    await expect(asAdmin.getByLabel("Coorientador", { exact: true })).toHaveText("Nenhum")

    /* Salvar sem interagir com nenhum campo. */
    await asAdmin.getByRole("button", { name: "Salvar Alterações" }).click()

    await expect(asAdmin).toHaveURL((url) => url.pathname === `/banca/${id}`)
    await expect(asAdmin.getByText("Banca atualizada com sucesso!").first()).toBeVisible()
    await expect(asAdmin.getByRole("heading", { name: E2E_BANCAS.upcomingPublic.tituloTrabalho })).toBeVisible()
  })

  test("atualiza o link do PDF e o link aparece para visitante anônimo", async ({
    asAdmin,
    page,
    factory,
    unique,
  }) => {
    const student = await factory.createStudent()
    const banca = await factory.createBanca({
      alunoId: student.id,
      orientadorId: E2E_ACCOUNTS.teacher.id,
    })
    const link = `https://repositorio.ufba.br/handle/ri/${unique}-editado`

    await visit(asAdmin, `/banca/${banca.id}/edit`)
    await asAdmin.getByLabel(/Link do PDF do TCC/).fill(link)
    await asAdmin.getByRole("button", { name: "Salvar Alterações" }).click()

    await expect(asAdmin).toHaveURL((url) => url.pathname === `/banca/${banca.id}`)
    await expect(asAdmin.getByRole("link", { name: "Baixar PDF do TCC" })).toHaveAttribute("href", link)

    /* Visão anônima confirma que o link é público. */
    await visit(page, `/banca/${banca.id}`)
    await expect(page.getByRole("link", { name: "Baixar PDF do TCC" })).toHaveAttribute("href", link)
  })

  test("remove o link do PDF quando o campo é esvaziado", async ({ asAdmin, page, factory, unique }) => {
    const student = await factory.createStudent()
    const banca = await factory.createBanca({
      alunoId: student.id,
      orientadorId: E2E_ACCOUNTS.teacher.id,
      linkTrabalho: `https://repositorio.ufba.br/handle/ri/${unique}-antigo`,
    })

    await visit(asAdmin, `/banca/${banca.id}/edit`)
    await asAdmin.getByLabel(/Link do PDF do TCC/).fill("")
    await asAdmin.getByRole("button", { name: "Salvar Alterações" }).click()

    await expect(asAdmin).toHaveURL((url) => url.pathname === `/banca/${banca.id}`)
    await visit(page, `/banca/${banca.id}`)
    await expect(page.getByRole("heading", { name: "Trabalho Completo" })).toBeHidden()
  })

  test("não persiste um link que não é URL válida", async ({ asAdmin, api, factory }) => {
    const student = await factory.createStudent()
    const banca = await factory.createBanca({
      alunoId: student.id,
      orientadorId: E2E_ACCOUNTS.teacher.id,
    })

    await visit(asAdmin, `/banca/${banca.id}/edit`)
    await asAdmin.getByLabel(/Link do PDF do TCC/).fill("repositorio.ufba.br/sem-protocolo")
    await asAdmin.getByRole("button", { name: "Salvar Alterações" }).click()

    /*
     * O input é `type="url"`, então a validação nativa do browser barra o submit antes
     * do zodResolver. O comportamento observável é: não navega e não persiste.
     */
    await expect(asAdmin).toHaveURL((url) => url.pathname === `/banca/${banca.id}/edit`)
    const validade = await asAdmin
      .getByLabel(/Link do PDF do TCC/)
      .evaluate((el) => (el as HTMLInputElement).checkValidity())
    expect(validade, "o input de link deveria estar inválido para o browser").toBe(false)

    const res = await api.get(`/banca/${banca.id}`)
    expect(((await res.json()) as { linkTrabalho: string | null }).linkTrabalho).toBeNull()
  })

  test("aluno não vê o botão de editar", async ({ asStudent }) => {
    await visit(asStudent, `/banca/${E2E_BANCAS.upcomingPublic.id}`)

    await expect(asStudent.getByRole("heading", { name: E2E_BANCAS.upcomingPublic.tituloTrabalho })).toBeVisible()
    await expect(asStudent.getByRole("button", { name: "Editar" })).toBeHidden()
  })
})
