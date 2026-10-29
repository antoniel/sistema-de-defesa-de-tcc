# Política de patching — dependências

## Ordem de correção

1. **Fix automático não-breaking** do ecossistema:
   - npm: `npm audit fix` (SEM `--force` — ele respeita intervalos semver declarados)
   - Composer: `composer update <pkg>` seco (sem wizário de major)
   - Cargo: `cargo update -p <pkg>@<versão vulnerável>`
   - Python: `pip-audit --fix` / `uv lock --upgrade-package <pkg>`
   - Go: `go get <pkg>@<fix>` + `go mod tidy`
2. **Bump cirúrgico** (mesmo major) quando o fix genérico não alcançar o pacote:
   `npm install -w <workspace> <pkg>@<fix>` etc. Sempre verificar depois com
   `npm ls <pkg> --all` (ou equivalente) se a versão vulnerável **sumiu de todos os
   níveis** — inclusive cópias aninhadas por peer pinado. É comum a dependência "X"
   manter cópia própria velha de "Y": bump em X resolve.
3. **Adaptação de código**: upgrade pode mudar assinaturas, wrapping de erros, tipagem.
   Corrija o código do projeto — nunca suprima o typecheck nem mantenha compat de verdade
   com flags globais (`--legacy-peer-deps` como rotina é dívida).
4. **Breaking** (`--force`, major): não aplicar no ciclo de patch. Vira **work item** com:
   - a **cadeia de desbloqueio** (a → b → c: qual migração destrava qual);
   - o **risco aceito no intervalo** (o uso atual é vulnerável? por quê?);
   - o **gatilho de ativação** (quando a deferência deve ser revista).

## Regras duras

- **Validação é inegociável**: typecheck + testes + e2e (condições CI) após QUALQUER patch.
  Atualizar dependência = mudança de comportamento.
- **Flake ≠ regressão**: teste isolado falhando 1× → rerun antes de culpar o patch; mas
  falha DE MASSA (dezenas) após bump = o patch quebrou contrato — investigar antes de seguir.
- **Sem lockfile, não há segurança**: patches que atualizam só o package.json sem resolver
  a lockfile não removem a versão vulnerável do install. Verificar o diff da lockfile no final.
- **Rollback fácil**: como nada é commitado pela skill, o usuário pode descartar o diff
  inteiro (`git checkout -- package-lock.json`) — preservar essa propriedade não commitando.
- **Múltiplas versões coexistindo**: só aceitável quando a cópia velha é inalcançável do
  runtime (documentar se ficar); preferir deduplicar.

## Anti-objetivo

Não "atualizar tudo para a última" — update amplo arrastá mudanças não-relacionadas ao
advisory e mistura risco. Patch mínimo dirigido pelo CVE; upgrade amplo é decisão separada
do dono do projeto.
