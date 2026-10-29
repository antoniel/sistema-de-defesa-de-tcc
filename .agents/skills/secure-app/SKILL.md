---
name: secure-app
description: Security audit and hardening of an application, in pluggable modules. Use when asked to audit security, secure the app, scan dependencies for CVEs (secure-app for deps), fix exposed vulnerabilities, or check DoS/rate-limit hardening. Module-driven: deps today, other modules additive.
---

# Secure an application

Find the security properties the project actually relies on, prove which are broken or exposed,
fix what is fixable without breaking behavior, and report the rest as work items with reasons.
Every finding is verified, not guessed; every fix ends in a passing suite.

## Escolha o módulo (dispatch)

| Pedido do usuário | Módulo | Metodologia |
| --- | --- | --- |
| "secure-app para deps", "auditar dependências", "checar CVEs", "patchear dependências" | `deps` | [modules/deps/MODULE.md](modules/deps/MODULE.md) |
| "anti-fingerprinting", "o que a app revela da stack", "levantamento de fingerprint" | `fingerprinting` | [modules/fingerprinting/MODULE.md](modules/fingerprinting/MODULE.md) |
| Outro tema de segurança (ofensiva, DoS/rate limit, auth, secrets) | Ainda não existe módulo — **não improvise** | Crie o módulo novo seguindo [modules/README.md](modules/README.md) |

Se o pedido cobrir mais de um módulo, execute um de cada vez, com relatório separado por módulo.

## Regras comuns a todos os módulos

1. **Verificado, não presumido.** Achado sem evidência (dado, execução, referência cruzada)
   não entra no relatório. Dado de fonte externa é desconfiado por padrão: valide antes de usar
   (cada módulo traz o seu protocolo de validação).
2. **Severidade ≠ oportunidade.** Ranqueie por exploração no CONTEXTO deste projeto
   (alcançabilidade, exposição, uso real do pacote/código), não só pelo score.
3. **Correção é mudança de comportamento.** Nenhum patch vale sem a suíte verde
   (typecheck + testes + e2e nas condições do CI). Atualizar dependência segue a mesma régua.
4. **Trabalho no working tree.** Nunca `git commit`/`git push`. Relatório final lista o que mudou,
   em quais arquivos e como validar.
5. **O que não for corrigido vira work item com razão escrita** — nada fica pendente sem dono
   nem justificativa.
6. **Higiene**: não cole segredos, tokens, dumps ou saída de `config:show` em relatórios, logs
   ou commits.

## Saída esperada (resumo)

Um relatório final no formato do módulo executado, contendo: estado antes/depois por severidade,
tabela de correções aplicadas (pacote/tema, de→para, risco que fechava), achados exploráveis
com path de exploração em exemplos, itens deferidos com justificativa, e como validar.
