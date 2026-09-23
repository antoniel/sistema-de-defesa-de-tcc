import { expect, type Page } from "@playwright/test"

/**
 * Navegação que espera o React hidratar.
 *
 * As páginas são renderizadas no servidor, então os inputs controlados já estão no DOM
 * antes de o React assumir o controle. Interagir nesse intervalo faz o valor ser
 * descartado na hidratação — foi a causa de uma flake real no campo de busca.
 * O `Layout` marca `html[data-hydrated="true"]` quando termina de hidratar.
 */
export async function visit(page: Page, path: string) {
  await page.goto(path)
  await expect(page.locator('html[data-hydrated="true"]')).toHaveCount(1)
}

/** Preenche a busca da lista e confirma que o valor permaneceu. */
export async function searchBancas(page: Page, termo: string) {
  const campo = page.getByRole("searchbox")
  await expect(async () => {
    await campo.fill(termo)
    await expect(campo).toHaveValue(termo)
  }).toPass({ timeout: 15_000 })
}
