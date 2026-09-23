import { expect, type Page } from "@playwright/test"
import { visit } from "./navigation"

/**
 * Helpers do wizard de cadastro de defesa (`/add-banca`).
 *
 * Cada helper espera pelo efeito visível do passo (título da seção ou valor do campo)
 * em vez de `waitForTimeout` — é isso que evita flake.
 */

const STEP_HEADINGS = {
  0: "Informações Básicas",
  1: "Informações do Autor",
  2: "Metadados e Agendamento",
  3: "Avaliadores",
  4: "Revisão e Confirmação",
} as const

/** Abre um `Select` do Radix pelo `data-testid` do trigger. */
async function openSelect(page: Page, testId: string) {
  await page.getByTestId(testId).click()
  await expect(page.getByRole("listbox")).toBeVisible()
}

/** Clica numa opção pelo nome acessível e espera o dropdown fechar. */
async function pickOption(page: Page, name: string | RegExp) {
  const option = page.getByRole("option", { name })
  await expect(option).toBeVisible()
  await option.click()
  await expect(page.getByRole("listbox")).toBeHidden()
}

export async function gotoWizard(page: Page) {
  await visit(page, "/add-banca")
  await expect(page.getByRole("heading", { name: STEP_HEADINGS[0] })).toBeVisible()
}

export async function goToStep(page: Page, step: 0 | 1 | 2 | 3 | 4) {
  await page.getByRole("button", { name: "Próximo" }).click()
  await expect(page.getByRole("heading", { name: STEP_HEADINGS[step] })).toBeVisible()
}

export async function fillBasicInfo(
  page: Page,
  { titulo, resumo, abstract }: { titulo: string; resumo: string; abstract: string },
) {
  await page.getByLabel("Título do Trabalho").fill(titulo)
  await page.getByLabel("Resumo", { exact: true }).fill(resumo)
  await page.getByLabel("Abstract", { exact: true }).fill(abstract)
}

export async function selectAluno(page: Page, student: { nome: string; email: string }) {
  await openSelect(page, "select-aluno")
  /* A lista de "alunos disponíveis" cresce a cada execução: filtrar pelo e-mail único é obrigatório. */
  await page.getByTestId("search-aluno").fill(student.email)
  await pickOption(page, new RegExp(escapeRegExp(student.email)))
}

export async function selectOrientador(page: Page, nome: string) {
  await openSelect(page, "select-orientador")
  await page.getByTestId("search-orientador").fill(nome)
  await pickOption(page, new RegExp(`^${escapeRegExp(nome)}$`))
}

export async function selectCurso(page: Page, nome: string) {
  await page.getByLabel("Curso").click()
  await pickOption(page, new RegExp(`^${escapeRegExp(nome)}$`))
}

export async function selectAvaliador(page: Page, index: 2 | 3, nome: string) {
  await openSelect(page, `select-avaliador-${index}`)
  await pickOption(page, new RegExp(escapeRegExp(nome)))
}

export interface MetadataInput {
  palavrasChave: string
  turma: string
  curso: string
  periodoAcademico: string
  /** `yyyy-mm-dd` (input type=date). */
  data: string
  /** `hh:mm` (input type=time). */
  hora: string
  modalidade: "Presencial" | "Remoto"
  local: string
  /** Campo opcional novo: link do PDF do TCC. */
  linkTrabalho?: string
}

export async function fillMetadata(page: Page, input: MetadataInput) {
  await page.getByLabel("Palavras Chave").fill(input.palavrasChave)
  await page.getByLabel("Turma").fill(input.turma)
  await selectCurso(page, input.curso)
  await page.getByLabel("Período Acadêmico").fill(input.periodoAcademico)

  if (input.linkTrabalho !== undefined) {
    await page.locator("#linkTrabalho").fill(input.linkTrabalho)
  }

  await page.locator("#dataRealizacao").fill(input.data)
  await page.locator("#hora").fill(input.hora)

  /* A modalidade muda o rótulo do campo de local, então escolha antes de preencher. */
  await page.getByRole("radio", { name: input.modalidade }).check()
  const localLabel = input.modalidade === "Remoto" ? "Link da Reunião" : "Local Físico"
  await page.getByLabel(localLabel).fill(input.local)
}

/** Confere o que a revisão (passo 5) está mostrando. */
export async function expectReview(page: Page, expected: { titulo: string; aluno: string; linkTrabalho?: string }) {
  await expect(page.getByText(expected.titulo).first()).toBeVisible()
  await expect(page.getByText(expected.aluno).first()).toBeVisible()
  if (expected.linkTrabalho) {
    await expect(page.getByText(expected.linkTrabalho).first()).toBeVisible()
  }
}

/** Submete e espera o redirect para a lista (comportamento atual do app). */
export async function submitWizard(page: Page) {
  await page.getByRole("button", { name: "Salvar Defesa" }).click()
  /* O app volta para `/?activeTab=...`, então comparamos só o pathname. */
  await expect(page).toHaveURL((url) => url.pathname === "/")
  await expect(page.getByText("Defesa cadastrada com sucesso ✅").first()).toBeVisible()
}

export function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
