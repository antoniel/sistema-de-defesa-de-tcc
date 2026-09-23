# SISDEF 3.0 — Sistema de Defesas de TCC (IC-UFBA)

Monorepo do sistema de marcação e organização de defesas de Trabalhos de Conclusão de Curso do
Instituto de Computação da UFBA.

- **Produção (frontend):** https://sistema-de-defesas.app.ic.ufba.br/
- **Produção (API):** https://sistema-de-defesas-api.app.ic.ufba.br/

## Estrutura

```
apps/web                    React Router v7 (SSR) + TailwindCSS + Radix UI
apps/server                 Hono + Drizzle ORM + PostgreSQL
packages/pdf-components     Componentes PDF compartilhados (UFBA)
packages/tests              Fixtures e utilitários de teste
apps/frontend-old           Legado (deprecado)
apps/yii2-organizacao-de-defesas  Legado PHP/Yii2 (deprecado)
```

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React Router v7 (SSR), TypeScript, TailwindCSS v4, Radix UI, TanStack Query |
| Backend | Hono, Drizzle ORM, PostgreSQL, Zod, ts-pattern |
| Auth | JWT + bcryptjs |
| E-mail | Nodemailer (Ethereal em dev, Gmail SMTP em produção) |
| Testes | Vitest (unit), Playwright (E2E) |
| Build/CI | Turborepo |

Importante: este projeto usa o alias `@/` para imports, **não** `~/`.

## Skills de agente

Skills ficam em `.pi/skills/` (descobertas automaticamente pelo pi) e são expostas ao Claude Code
por symlink em `.claude/skills/`. Elas são lidas na inicialização — **reinicie o agente** depois de
mexer nelas.

| Skill | Para que serve |
|---|---|
| `verify-app` | Verificar mudanças pela interface real do app (browser, CLI, API) e guardar evidências. Baseada em [arielconti10/verify-app](https://github.com/arielconti10/verify-app). |

Requisitos do `verify-app` (todos presentes neste ambiente): macOS/Linux, Python 3,
`agent-browser` 0.38.1+, FFmpeg e ffprobe. Para conferir: `agent-browser doctor`.

Testes do helper:

```bash
cd .pi/skills/verify-app
python3 -m unittest discover -s scripts -p 'test_*.py'
```

Uso no pi: `/skill:verify-app` ou pedir "verifica X e salva evidência".

## Setup local (passo a passo)

### 1. Dependências

```bash
npm install
```

> O npm pode avisar que `esbuild`, `bcrypt`, `sharp` têm install scripts não executados
> (`allow-scripts`). Pode ignorar: `esbuild` usa binários via optional deps e `bcrypt` funciona
> via prebuild. Se algo quebrar, rode `npm approve-scripts --allow-scripts-pending`.

### 2. Banco de dados

```bash
npm run docker:up           # PostgreSQL 17 local na porta 5443
```

### 3. `.env` na raiz

Não existe `.env.example` versionado — crie manualmente (veja
[Variáveis de ambiente](#8-variáveis-de-ambiente)):

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5443/sistema-de-banca
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:9000
SMTP_USER=seu-usuario@gmail.com
SMTP_PASSWORD=sua-app-password
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
NODE_ENV=development
```

### 4. Popular o banco

Duas opções — **escolha uma**:

**a) Dados de teste (banco zerado do schema):**

```bash
npm run migration:run       # aplica as 13 migrations
npm run seed                # dados de teste
```

**b) Cópia de produção (recomendado para reproduzir bugs reais):**

```bash
npm run db:pull             # baixa data/prod.dump do Dokku (150 KB)
npm run db:restore          # restaura no container local
```

### 5. Subir a aplicação

```bash
npm run dev                 # web em :5173, API em :9000
```

Verifique:

```bash
curl -s localhost:9000/banca/past?page=1\&limit=1   # deve retornar JSON com dados
curl -s -o /dev/null -w "%{http_code}\n" localhost:5173/
```

Outros comandos:

```bash
npm run tscheck             # type check em todos os workspaces
npm run test                # testes (TUI)
npm run test:e2e            # Playwright
npm run docker:connect      # psql no container
npm run db:studio           # Drizzle Studio
npm run migration:gen       # gerar migration a partir do schema
```

## Trazer dados de produção para o local

O usuário SSH tem permissão de `postgres:export` / `postgres:connect` no app da API, então dá para
baixar o banco de produção inteiro:

```bash
npm run db:pull             # ssh postgres:export → data/prod.dump
npm run db:restore          # pg_restore --clean no container local
```

O `db:restore` usa `--clean --if-exists`, então pode rodar quantas vezes quiser em cima do banco
local. O `data/` já está no `.gitignore`, então o dump nunca vai para o repositório.

Conferir o que veio:

```bash
docker exec sistema-de-banca psql -U postgres -d sistema-de-banca -c "\
  select 'usuario' t, count(*) from usuario
  union all select 'banca', count(*) from banca
  union all select 'cursos', count(*) from cursos;"
```

O dump traz junto a tabela `drizzle.migrations`, então depois de restaurar **não** rode
`npm run migration:run` (ele já vai considerar tudo aplicado).

> ⚠️ **Privacidade:** o dump contém dados reais de alunos, professores e orientadores (e-mails,
> matrículas, hashes de senha). Nunca commite, nunca suba em issue/chat e não use para testes que
> escrevam no banco sem necessidade. Para dados sintéticos, use `npm run seed`.

---

## Testes

Duas camadas, com propósitos diferentes:

| Camada | O que cobre | Como rodar |
| --- | --- | --- |
| Unitário/integração (Vitest) | Regras de negócio, rotas e banco (PGlite) | `npm test` na raiz, ou `npm test` em `apps/server` |
| E2E (Playwright) | Fluxos reais pela interface, com browser | `npm run test:e2e` |

O E2E é o portão que garante que um `push` não quebre os fluxos principais — sobretudo o
**cadastro de defesa**. Ele sobe os próprios servidores em **portas dedicadas** (API 9100,
web 5273), com banco em memória e dados determinísticos, então nunca encosta no seu
ambiente de dev nem em dados de produção.

```bash
npm run test:e2e                        # suíte completa
cd apps/web
npx playwright test --repeat-each=3     # caçar flake
npx playwright test --ui                # modo interativo
npx playwright show-report              # relatório da última execução
```

Se for a primeira vez no seu clone (ou depois de atualizar o Playwright):

```bash
cd apps/web && npx playwright install chromium
```

Cobertura: cadastro de defesa (wizard de 5 passos), edição, link do PDF do TCC,
visibilidade pública/privada, busca/paginação/ordenação, login/logout e administração de
usuários. A estratégia anti-flake (isolamento de dados, espera de hidratação, escopo de
seletores) está documentada em [`apps/web/tests/README.md`](apps/web/tests/README.md) —
leia antes de escrever uma spec nova.

---

# Deploy (infra IC-UFBA / Dokku)

> Esta é a parte que costuma dar dor de cabeça. Leia inteiro antes de mexer.

## 1. Infraestrutura

| | Frontend | Backend |
|---|---|---|
| App Dokku | `sistema-de-defesas` | `sistema-de-defesas-api` |
| Branch de produção | `production-web` | `production-server` |
| Remote git | `dokku-web` | `dokku-server` |
| Porta do container | `5000` | `9000` |
| Banco | — | postgres `sistema-de-defesas-api` |

Host Dokku: `app.ic.ufba.br`, **SSH na porta 9999** (não é a 22!).

## 2. Acesso SSH

Sua chave pública precisa estar cadastrada no Dokku. Para conferir:

```bash
# deve autenticar (mensagem de "Access denied" em algum comando = chave OK, só sem permissão)
ssh -p 9999 dokku@app.ic.ufba.br

# teste rápido de acesso de deploy nos dois apps
GIT_SSH_COMMAND="ssh -p 9999" git ls-remote ssh://dokku@app.ic.ufba.br:9999/sistema-de-defesas
GIT_SSH_COMMAND="ssh -p 9999" git ls-remote ssh://dokku@app.ic.ufba.br:9999/sistema-de-defesas-api
```

Você é um **usuário limitado** (vinculado apenas aos dois apps). Isso significa:

| Comando | Permitido |
|---|---|
| `config:show <app>` | ✅ |
| `logs <app>` | ✅ (sem flags — `logs --num 5` é negado) |
| `ps:report <app>` | ✅ |
| `ports:report <app>` | ✅ |
| `postgres:info <app>` / `postgres:connect <app>` | ✅ |
| `apps:list`, `domains:report`, `ps:scale` | ❌ acesso negado |

Atalho opcional no `~/.ssh/config`:

```
Host dokku-ic
  HostName app.ic.ufba.br
  Port 9999
  User dokku
```

Aí vira `ssh dokku-ic logs sistema-de-defesas-api`.

## 3. A estratégia: uma branch por Dockerfile

O Dokku builda a **raiz do repositório** usando o `Dockerfile` da raiz
(`DOKKU_APP_TYPE: dockerfile`). Como o repo é um monorepo com duas aplicações, a solução adotada é:

> **Cada branch de produção carrega a sua própria versão do `Dockerfile` da raiz. Todo o resto do
> código é idêntico entre as branches.**

| Branch | `Dockerfile` da raiz | O que ele faz |
|---|---|---|
| `production-web` | 31 linhas, multi-stage | `turbo prune "@tcc/web"` → build do Vite → `react-router-serve` na porta 5000 |
| `production-server` | 7 linhas, single-stage | `node:20-alpine` → `npm run start --workspace=@tcc/server` na porta 9000 |

O `main` **nunca** deve conter a versão "de produção" do Dockerfile — ele tem a versão do server,
que é usada só como base. O merge do `main` dentro das branches de produção preserva o Dockerfile
de cada uma porque o `main` não mexe nesse arquivo.

### Scripts

```json
"sync":        "git checkout production-web && git merge main && git checkout production-server && git merge main",
"push:web":    "npm run sync && git checkout production-web && git push dokku-web production-web:master --force",
"push:server": "npm run sync && git checkout production-server && git push dokku-server production-server:master --force"
```

## 4. Setup inicial (uma vez só, por clone)

Os remotes do Dokku **não são versionados**, então todo clone novo precisa recriá-los:

```bash
git remote add dokku-web    ssh://dokku@app.ic.ufba.br:9999/sistema-de-defesas
git remote add dokku-server ssh://dokku@app.ic.ufba.br:9999/sistema-de-defesas-api

git fetch dokku-web
git fetch dokku-server
```

Depois garanta que as branches locais de produção existem:

```bash
git branch production-web    dokku-web/master
git branch production-server dokku-server/master
```

> ⚠️ Crie as branches a partir de `dokku-*/master` (**o que está no ar**), não de
> `origin/production-*`. O GitHub pode estar desatualizado — ver seção 7.

Confira que tudo está no lugar:

```bash
git remote -v                 # deve listar dokku-web e dokku-server
git branch -vv | grep production
git push --dry-run dokku-web production-web:master --force
git push --dry-run dokku-server production-server:master --force
```

## 5. Rotina de deploy

```bash
npm run push:web      # frontend → sistema-de-defesas
npm run push:server   # backend  → sistema-de-defesas-api
```

O `sync` roda automaticamente antes de cada push e deixa você na branch `production-server`.
O `--force` é rede de segurança (o Dokku aceita force push normalmente).

### Acompanhar o deploy

```bash
# logs ao vivo (Ctrl+C para sair)
ssh -p 9999 dokku@app.ic.ufba.br logs sistema-de-defesas-api

# estado do processo
ssh -p 9999 dokku@app.ic.ufba.br ps:report sistema-de-defesas-api

# variáveis de ambiente (⚠️ contém segredos)
ssh -p 9999 dokku@app.ic.ufba.br config:show sistema-de-defesas-api

# portas mapeadas
ssh -p 9999 dokku@app.ic.ufba.br ports:report sistema-de-defesas
```

### Banco de dados em produção

```bash
ssh -p 9999 dokku@app.ic.ufba.br postgres:info sistema-de-defesas-api
ssh -p 9999 dokku@app.ic.ufba.br postgres:connect sistema-de-defesas-api

# backup
ssh -p 9999 dokku@app.ic.ufba.br postgres:export sistema-de-defesas-api > backup.dump
```

## 6. Verificar antes de deployar

Sempre confira que o merge não vai quebrar o Dockerfile da branch:

```bash
# deve sair SEM CONFLITOS e com o Dockerfile certo (31 linhas no web, 7 no server)
git merge-tree --write-tree production-web main
git merge-tree --write-tree production-server main

# o Dockerfile do web NÃO pode ser o do server
git checkout production-web && git diff main -- Dockerfile
```

## 7. Problemas conhecidos / troubleshooting

### `origin/production-*` desatualizado (já aconteceu)

As branches de produção no GitHub já ficaram **4 meses atrás** do que estava no ar. Um
`npm run push:web` nessa situação faria **downgrade da produção**.

Sempre compare antes de deployar:

```bash
git fetch --all
git rev-list --left-right --count dokku-web/master...origin/production-web
# "0  0" = em sincronia. Se der "N  0", o que está NO AR está à frente do GitHub.
```

**Como recuperar** (o Dokku é a fonte da verdade, ele guarda o último commit deployado):

```bash
git fetch dokku-web && git fetch dokku-server

# recria as branches a partir do que está no ar
git branch -f production-web    dokku-web/master
git branch -f production-server dokku-server/master

# confirma que nada foi perdido: main precisa ser ancestral dos dois
git merge-base --is-ancestor main dokku-web/master    && echo "web ok"
git merge-base --is-ancestor main dokku-server/master && echo "server ok"

# atualiza o GitHub (é fast-forward, não precisa de --force)
git push origin production-web:production-web
git push origin production-server:production-server
```

### `sync` sobrescreveu o Dockerfile do web

Se algum dia o `main` alterar o `Dockerfile` da raiz, o `git merge main` vai trazer essa alteração
para dentro de `production-web` e quebrar o build do frontend (o Dokku passaria a buildar o server).

Solução: descartar a alteração e recommitar antes do push.

```bash
git checkout production-web
git checkout HEAD~1 -- Dockerfile    # ou: git show <commit-bom>:Dockerfile > Dockerfile
git commit -m "chore: mantém Dockerfile do web"
```

Se já tiver deployado quebrado, restaure o Dockerfile e faça `npm run push:web` de novo.

### `VITE_API_URL` não muda com `dokku config:set`

O Vite **inlina** as variáveis de ambiente em tempo de build, não de execução. A variável
`VITE_API_URL` que aparece no `config:show` é ignorada pelo bundle já buildado.

A URL real está hardcoded no stage `builder` do `Dockerfile` da branch `production-web`:

```dockerfile
ENV VITE_API_URL=https://sistema-de-defesas-api.app.ic.ufba.br/
```

Para trocar a URL da API é preciso editar o Dockerfile e redeployar.

### SSH dá timeout

Provavelmente você está tentando a porta 22. É **9999**. E o acesso pode ser restrito à rede da
UFBA — se estiver fora, tente pela VPN ou rede do IC.

## 8. Variáveis de ambiente

Não existe `.env.example` versionado — crie o `.env` na raiz manualmente. O schema é validado por Zod
em `apps/server/src/config/env.ts` (obrigatórias) e `apps/server/src/modules/auth/jwt.ts` (com
defaults inseguros).

**Obrigatórias:**

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | String de conexão do PostgreSQL |
| `FRONTEND_URL` | URL do frontend para links de e-mail |
| `SMTP_USER` / `SMTP_PASSWORD` | Credenciais Gmail para envio de e-mail |

**Opcionais:**

| Variável | Padrão | Descrição |
|---|---|---|
| `NODE_ENV` | — | `production` envia e-mail real; qualquer outro usa Ethereal |
| `PORT` | `9000` | Porta do servidor |
| `JWT_SECRET` | `your-very-secret-key` | ⚠️ **sempre defina** — o default é inseguro |
| `JWT_ISSUER` / `JWT_AUDIENCE` | `your-app-name` / `your-app-audience` | Claims do JWT |
| `JWT_EXPIRY_SECONDS` | `3600` | Expiração do token |
| `VITE_API_URL` | — | Usada pelo frontend (`apps/web/app/config/env.ts`) |

`.env` mínimo para desenvolvimento local:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5443/sistema-de-banca
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:9000
SMTP_USER=seu-usuario@gmail.com
SMTP_PASSWORD=sua-app-password
JWT_SECRET=troque-por-um-segredo-forte
```

Produção: configuradas no Dokku (`ssh -p 9999 dokku@app.ic.ufba.br config:show sistema-de-defesas-api`).

⚠️ O `config:show` devolve segredos em claro (`DATABASE_URL` com senha, `SMTP_PASSWORD`). Não cole
essa saída em issues, chats ou commits.
