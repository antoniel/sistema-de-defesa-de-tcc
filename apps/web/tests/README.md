# Testes E2E (Playwright)

Suíte que exercita os fluxos principais pela interface real, para que um `push` não quebre
o sistema sem aviso. O foco é **cadastro de defesa** (o fluxo central), mas também cobre
edição, visibilidade, busca/paginação, permissões e administração de usuários.

## Rodando

```bash
# da raiz
npm run test:e2e

# dentro de apps/web
npm run test            # roda tudo
npm run test:ui         # modo interativo
npm run test:headed     # com browser visível
npm run test:debug      # passo a passo
npm run test:report     # relatório HTML da última execução

# um arquivo / um teste
npx playwright test tests/banca-create.spec.ts
npx playwright test -g "cadastra uma defesa completa"

# caçar flake
npx playwright test --repeat-each=3
```

Na primeira vez (ou depois de atualizar o Playwright):

```bash
npx playwright install chromium
```

## Arquitetura

| Peça | Onde | Por quê |
| --- | --- | --- |
| API de teste | `apps/server/src/test-server.ts` | Banco **em memória** (PGlite), nunca toca o PostgreSQL de dev |
| Rotas de controle | `apps/server/src/tests/test-control.ts` | `/__test__/health` (readiness) e `/__test__/reset` |
| Seed determinístico | `apps/server/src/tests/seed-test-data.ts` | IDs e datas fixos; compartilhado com as specs |
| Contas/entidades do E2E | `packages/tests/src/fixtures/e2e.ts` | Fonte única: servidor e specs importam daqui |
| Fixtures | `apps/web/tests/fixtures/test.ts` | `api`, `factory`, `unique`, `asAdmin`/`asTeacher`/`asStudent` |
| Helpers | `apps/web/tests/support/` | `visit` (espera hidratação), `searchBancas`, wizard |

**Portas dedicadas: API `9100`, web `5273`.** O `npm run dev` (9000/5173) não é tocado, e
`reuseExistingServer: false` faz o Playwright falhar se a porta estiver ocupada — em vez de
testar contra o servidor errado (que pode apontar para dados de produção).

A suíte roda contra o **build de produção** (`npm run build && npm run start`), não contra o
dev server. Motivo concreto: o dev server do Vite re-otimiza dependências quando descobre algo
novo, o que invalida os chunks e recarrega a página — com cache frio (CI) e workers em paralelo
isso derrubava a hidratação com `Cannot read properties of null (reading 'useState')`. Buildar
custa ~5s, elimina a classe do problema e ainda valida que o build funciona.

## Regras para não ter flake

Estas regras não são estilo: cada uma resolve uma flake real que apareceu durante a construção.

1. **Cada teste cria os seus dados.** Use `factory.createStudent()` / `factory.createBanca()`.
   Nunca dependa de uma entidade do seed que outro teste possa consumir. A regra
   `aluno_curso_unique` permite uma banca por aluno/curso, então aluno do seed + dois testes = 409.
2. **Nunca afirme sobre contagem global.** A lista cresce a cada execução. Busque por um
   prefixo único e conte o resultado da busca.
3. **Datas absolutas no seed** (`2099`/`2020`), nunca `agora ± N dias` — senão "próximas" e
   "anteriores" mudam conforme o dia.
4. **`visit(page, path)` em vez de `page.goto`.** A página é renderizada no servidor; digitar
   antes da hidratação faz o React descartar o valor. O helper espera `html[data-hydrated]`.
   Se esse seletor der timeout, o app provavelmente quebrou ao hidratar — leia o
   `error-context.md` do `test-results/`, que traz a página em modo texto.
5. **Escopo por `data-testid`.** A lista tem duas tabelas na mesma página e a seção vazia
   renderiza uma linha — `tbody tr` sem escopo conta a coisa errada.
6. **Sem `waitForTimeout`.** Use asserções que re-tentam (`toHaveCount`, `toContainText`,
   `toHaveValue`) e `toPass` quando precisar repetir uma ação.
7. **`retries: 0`.** Retry esconde flake. Se quebrar, quebre — e o `trace`/`video` do
   `test-results/` mostra o porquê.

## Escrevendo uma spec nova

```ts
import { E2E_ACCOUNTS } from "@tcc/tests"
import { expect, test } from "./fixtures/test"
import { visit } from "./support/navigation"

test("descreve o comportamento observável", async ({ asAdmin, factory, api, unique }) => {
  const aluno = await factory.createStudent()
  const banca = await factory.createBanca({ alunoId: aluno.id, orientadorId: E2E_ACCOUNTS.teacher.id })

  await visit(asAdmin, `/banca/${banca.id}`)
  await expect(asAdmin.getByRole("heading", { name: banca.tituloTrabalho })).toBeVisible()

  /* Confirme a persistência pela API, não só pela tela. */
  const res = await api.get(`/banca/${banca.id}`)
  expect(res.ok()).toBeTruthy()
})
```

Fixtures disponíveis:

| Fixture | Para que serve |
| --- | --- |
| `page` | Página anônima (sem sessão) |
| `asAdmin` / `asTeacher` / `asStudent` | Página já autenticada (token injetado no `localStorage`) |
| `api` | Cliente HTTP na API de teste |
| `adminToken` | Token do admin, para cenários via API |
| `factory` | `createStudent`, `createTeacher`, `createBanca`, `login` |
| `unique` | Sufixo único do teste, para e-mails/títulos/matrículas |

Preferência de seletor: `getByRole` / `getByLabel` primeiro; `data-testid` quando o nome
acessível é ambíguo ou dinâmico. Se precisar de um `testid` novo, adicione-o ao componente
(o caso dos selects do wizard, que não tinham nome acessível).

## Cobertura atual

| Arquivo | Fluxos |
| --- | --- |
| `banca-create.spec.ts` | **Cadastro completo pelo wizard (5 passos)**, campo opcional do link do PDF, bloqueio por validação, navegação entre passos |
| `banca-edit.spec.ts` | Salvar sem tocar em campo (regressão dos selects), link do PDF (criar/limpar/inválido), aluno sem botão de editar |
| `banca-detail.spec.ts` | Banca pública para anônimo, privada escondida, admin enxerga, seção de download |
| `banca-list.spec.ts` | Busca por título/discente/orientador, paginação, ordenação, visibilidade |
| `auth.spec.ts` | Login pela interface, credenciais inválidas, logout, sessão após reload |
| `admin-users.spec.ts` | Lista, detalhe, associações e bloqueio para aluno |

## Depurando uma falha

O Playwright guarda `test-results/<teste>/` com screenshot, vídeo e `trace.zip`:

```bash
npx playwright show-trace test-results/<pasta>/trace.zip
npx playwright show-report
```

Se um teste falhar só no CI, compare o ambiente: a suíte assume `NODE_ENV=test` no servidor
de API e `VITE_API_URL` apontando para a porta 9100 (o `playwright.config.ts` injeta os dois).

## Limitações conhecidas

- O banco é um PGlite de conexão única, por isso `workers` é baixo (2 no CI, 3 local).
- `/__test__/reset` existe mas **não** é usado entre specs (reset + paralelismo se anulam).
  Use-o para depurar localmente.
- O link do PDF é validado pelo browser (`type="url"`) antes do zod — a mensagem do app só
  aparece para chamadas diretas à API.
- `npm run build` roda a cada execução (o build não é cacheado de propósito: cache velho
  faria a suíte passar testando código antigo).
