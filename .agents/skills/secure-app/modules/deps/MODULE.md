# Módulo: deps — dependências seguras

Comparar as dependências **resolvidas** do projeto com bancos de vulnerabilidade públicos
(keyless), separar o que é explorável **neste projeto** do que é teórico, patchear o que é
seguro patchear e reportar o resto com justificativa.

Quando usar: pedido de auditoria/scan de dependências, CVEs, "secure-app para deps".
Quando NÃO usar: auditoria do código próprio (módulo ofensivo, futuro), secrets, DoS.

---

## Passo 1 — Inventário: a lockfile é a verdade

O `package.json` declara intervalos (`^4.2.4`); o que roda é a versão **resolvida** na lockfile.
Inventarie as versões resolvidas, separando grupos de **runtime** de **dev/tooling**.

Por ecossistema:
- **npm/pnpm/yarn/bun (JS/TS)**: `package-lock.json` (`packages["node_modules/<nome>"].version`),
  `pnpm-lock.yaml`, `yarn.lock`, `bun.lock`. Runtime = `dependencies` (não `devDependencies`)
  de cada workspace/pacote de produção. Detecte cópias aninhadas duplicadas
  (`npm ls <pkg> --all`) — a versão velha aninhada também é superfície.
- **PHP (Composer)**: `composer.lock` (`packages` = runtime, `packages-dev` = dev);
  `composer show --direct --all` para o declarado.
- **Rust**: `Cargo.lock` + separação por `dependencies`/`dev-dependencies`/`build-dependencies`
  de cada crate do workspace.
- **Python**: `uv.lock` / `poetry.lock` / `Pipfile.lock` / `requirements.txt` congelado;
  separe grupo dev (`--group dev` etc.).
- **Go**: `go.sum` + `go list -m all`; módulos `// indirect` merecem nota própria.
- Outros ecossistemas: mesmo princípio — **versão resolvida + grupo runtime/dev**, nunca o declarado.

Artefato: lista `nome, versão_resolvida, grupo (runtime|dev), workspace/projeto`.

## Passo 2 — Coleta de vulnerabilidades (fontes keyless)

Fontes públicas, sem chave, com match de versão:

| Fonte | Uso | Nota |
| --- | --- | --- |
| **OSV.dev** (`api.osv.dev`) | por pacote+versão, por purl, por commit; recordes por id | agnóstico de linguagem; records completos em `/v1/vulns/<id>` |
| **GitHub Advisory Database** | via ferramenta do ecossistema (ex.: `npm audit`) ou advisory por id | revisadas por humanos, com CVSS |
| **PyPI**: `pip-audit`; **Rust**: `cargo audit`; **PHP**: `composer audit`/roave; **Go**: `govulncheck` | canal oficial do ecossistema | costuma casar versão corretamente |
| **CISA KEV**, **NVD**, **CVE.org** | enriquecimento (exploração ativa, CVSS oficial) | só depois do match básico |

Estratégia: prefira o **canal oficial do ecossistema** (casamento de versão embutido na
ferramenta) e use o OSV para enriquecer/agnóstico. Batch só com validação do passo 3.

### Passo 3 — Protocolo de validação de fonte (obrigatório)

Fonte de dados de segurança é inimiga até provar o contrário (cache envenenado, proxy
corrompido, banco degenerado já foram observados em ambientes reais). Antes de acreditar:

1. **Sinal de podridão**: volume implausível (dezenas de CVEs num pacote estável), summaries
   vazios, severity/fixed ausentes em massa, resposta idêntica para versões diferentes.
2. **Teste de controle**: consulte a MESMA consulta com versões antes/depois do fix declarado.
   Se a resposta não mudar, a fonte não está filtrando versão → **descarte o canal** e anote
   no relatório.
3. **Referência cruzada**: pegue 1–2 hits e confirme no registro primário
   (`/v1/vulns/<GHSA>`, página do advisory) — a range declarada bate com a nossa versão?
4. **Regra de ouro**: canal oficial do ecossistema + lockfile real vence API agnóstica
   suspeita. Documente no relatório qual fonte foi usada, o que foi descartado e por quê.

## Passo 4 — Triagem por exploração (o que separa "tem CVE" de "dá pra explorar AQUI")

Para cada vulnerabilidade que casou com uma versão nossa, responda com o código na mão:

1. **Superfície**: o componente vulnerável existe no runtime de produção deste projeto?
   (deploy real ≠ tooling de dev; ver Dockerfile/entrypoint/scripts de start).
2. **Uso real**: o código vulnerável é alcançado? Grep por import/config/uso
   (ex.: `serveStatic`, `FileSessionStorage`, opção `envelope`, `sql.raw` com input).
   Não usar o recurso = merador (mas ver passo 5: mina armada).
3. **Pré-condição do attacker**: exige auth? acesso ao banco? rede interna? Nada? Quanto mais
   perto de "nenhuma", mais urgente.
4. **Classifique**:
   - `EXPLORÁVEL HOJE` — caminho existe + superfície exposta → corrigir já, com PoC/passos.
   - `MINA ARMADA` — código vulnerável embarcado em produção mas não alcançado hoje; uma
     evolução innocente do código ativa (ex.: adicionar session storage, servir estático).
   - `TEÓRICO` — requer pré-condições que o projeto não tem (uso inexistente, rede interna).
   - `DEV-ONLY` — tooling; não entra em produção; patch por higiene, não por urgência.

## Passo 5 — Política de correção

Ordem: **não-breaking primeiro** (respeita semver: patch/minor, sem API quebrada), depois
cirúrgicos, breaking só como work item.

1. **Fix automático não-breaking** do ecossistema (`npm audit fix` sem `--force`,
   `composer update` seco, `cargo update -p <pkg>`).
2. **Bump cirúrgico** para o que o fix genérico não alcançou — de preferência dentro do major.
   **Cace cópias aninhadas**: o bump precisa chegar a TODO lugar onde a versão vulnerável
   vive (`npm ls <pkg> --all` antes e depois; um peer pinado por dependência pode manter a
   versão velha viva escondida).
3. **Adaptação de código** quando o upgrade muda contrato (assinatura nova, erro embrulhado
   em outra forma). Mudança de API vira código — nunca suprima o tipocheck.
4. **Breaking**: NÃO force. Registre work item com a **cadeia de desbloqueio**
   (ex.: drizzle 0.45 ← drizzle-zod 0.8 ← zod 4) e o risco aceito no intervalo
   (o uso atual é ou não é vulnerável? por quê?).
5. **Remoção**: dependência vulnerável que ninguém importa? Remover > atualizar.

Toda correção que muda comportamento de runtime passa pelo Passo 6. Nenhuma exceção.

## Passo 6 — Gates de validação

Nas condições do projeto (SISDEF: `npm run tscheck` na raiz; suíte completa do server;
`cd apps/web && rm -rf node_modules/.vite build && npx playwright test --workers=2`).
Atualização de dependência é mudança de comportamento como qualquer outra — sem suíte verde,
não está pronto. Flakes de teste isolados: rerun para distinguir de regressão antes de culpar
o patch.

## Passo 7 — Relatório

Use [report-template.md](report-template.md). Requisitos: números antes→depois por severidade,
tabela de correções (de→para, risco que fechava), achados EXPLORÁVEIS HOJE com **caminho de
explotação em exemplos concretos** (o usuário precisa entender "você estava vulnerável aqui,
neste caso de uso"), deferidos com justificativa + cadeia de desbloqueio, fontes usadas
(descartadas e o porquê), e como validar localmente.
