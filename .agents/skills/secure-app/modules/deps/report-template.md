# Relatório — deps (formato)

> Copie este esqueleto no relatório final do módulo. Secções obrigatórias marcadas com ⚠️.

---

## ⚠️ Resumo executivo

- **Antes → depois** (produção): N vulnerabilidades (c críticas, a altas, m moderadas, b baixas)
  → M vulnerabilidades (…)
- Correções aplicadas: X | Work items criados: Y | Fonte descartada por validação: sim/não
- Validação: <typecheck / testes / e2e — resultados>

## ⚠️ Fontes de dados

- Usadas: <ferramenta/API + por quê (match de versão na lockfile, keyless)>
- Descartadas: <qual + sinal de podridão observado + teste de controle que provou>

## ⚠️ Correções aplicadas

| Pacote | De → Para | Risco fechado (id advisory, severidade) | Mudança de código exigida |
| --- | --- | --- | --- |

## ⚠️ Achados EXPLORÁVEIS HOJE / MINAS ARMADAS (com exemplos)

Para cada um, o formato de [triage.md](references/triage.md):
onde estávamos expostos → como seria a exploração (passos concretos) → por que (não) é
explorável hoje. É esta secção que responde "você estava vulnerável NESTE caso de uso".

## ⚠️ Deferidos (work items)

| Item | Severidade | Por que não corrigiu agora | Cadeia de desbloqueio | Gatilho de revisão |
| --- | --- | --- | --- | --- |

## Dev-only (resumo)

Tooling afetado que não entra em produção — lista curta, sem drill-down.

## ⚠️ Como validar

Comandos exatos que o usuário pode rodar para conferir (audit de antes/depois, suítes).

## Mudanças no working tree

Arquivos alterados (package.json/lockfile/código), nada commitado — decisão de commit é do usuário.
