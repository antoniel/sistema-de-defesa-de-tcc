# Procedimento de verificação — SISDEF (UFBA)

App de agendamento de bancas de defesa (monorepo npm/turborepo). Interface principal:
web (React Router v7, SSR) + API Hono. Evidência de fluxo de usuário é quase sempre
navegador; API pode ser verificada direto nos endpoints públicos.

## Regras do repositório (sempre valem)

- **Nunca rode `git commit` nem `git push`.** Quem commita é o usuário (ver `AGENTS.md`).
- Mudança de comportamento exige `npm run tscheck` e `npm test` (raiz) antes de dar por concluído.
- E2E só vale nas condições do CI: `cd apps/web && rm -rf node_modules/.vite build && npx playwright test --workers=2`.
- Não existe login "de produção" para verificar: tudo é ambiente local.

## Canal preferido: stack isolada do E2E (PGlite)

Nunca verifique fluxo de usuário no `npm run dev`: a API dev aponta para o PostgreSQL
do Docker Compose (`npm run docker:up`, host `5443`, container `sistema-de-banca`),
que **pode conter dados reais de produção**. A stack do Playwright é isolada por
design (`apps/web/playwright.config.ts`):

- **API de teste:** `cd apps/server && npm run start:test` com `NODE_ENV=test PORT=9100`.
  Banco PGlite em memória, parte sempre do seed determinístico. Recusa subir fora de `NODE_ENV=test`.
- **Web de teste:** `cd apps/web && npm run build && npm run start` com
  `VITE_API_URL=http://localhost:9100 PORT=5273`. Roda o build de produção, não o dev server.
- **Health:** `GET http://localhost:9100/__test__/health`. Web em `http://localhost:5273`.
- **Portas são exclusivas** (9100/5273): se estiverem ocupadas, falhe — não reutilize o processo
  de outro contexto.
- **Dados de teste:** fixtures em `packages/tests/src/fixtures/` (`teacher@test.com`,
  `student@test.com`, `admin@test.com`, senha `Password123!`). As specs E2E (`apps/web/tests/`)
  criam os próprios dados com identificadores únicos e rodam em paralelo — replicar esse padrão
  em verificação manual: crie dados pelo fluxo do usuário ou via rotas `/__test__/*` do test server.

Se a feature alvo já tem spec Playwright (`apps/web/tests/*.spec.ts`), reprove os passos
dela na verificação manual; o spec descreve o caminho de usuário real e os seletores estáveis.

Verificação de API: base `http://localhost:9100/api/*`, JWT `Authorization: Bearer`
obtido via `POST /api/auth/login`. Procure o shape exato em `apps/server/src/modules/<modulo>/<modulo>.route.ts`.

## Canal alternativo: stack de desenvolvimento

Só para verificação de dados/desenvolvimento, com o banco dev zerado previamente:

- `npm run docker:up` → `npm run migration:run` (em `apps/server`) → `npm run seed`
- Seed cria contas sintéticas (`admin@synthetic.test`, `orientador@synthetic.test`,
  `avaliador1@synthetic.test`, `avaliadora2@synthetic.test`, `aluno@synthetic.test`,
  `aluna@synthetic.test`), todas com senha `senha-de-teste-123`.
- Dev: `npm run dev` na raiz sobe web (5173) e API (9000).

## Evidência

- Capture em diretório de tarefa fora do rastreamento (ex.: `/var/folders/.../T/opencode` ou um diretório gitignored).
- Playwright já gera trace/vídeo/screenshot de falha em `apps/web/test-results/` — pode servir de
  evidência complementar, mas não substitui captura dirigida do passo verificado.
- Preferir agente-browser para browser checks; o helper do skill (`scripts/evidence.py`) valida mídia
  com `check` antes de compartilhar (requisito do skill, inclusive para screenshots).

## Limpeza

- Pare apenas os processos que você iniciou (test server, web server, navegador da verificação).
- **Não** pare o container `sistema-de-banca` nem processos de outra sessão.
- Evidência preservada após o cleanup; confirme que os arquivos continuam existindo.
- Não remova dados de `apps/web/test-results/` de falhas de spec alheias.
