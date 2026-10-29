# secure-app — segurança da aplicação em módulos

Skill de auditoria e endurecimento de segurança, organizada em **módulos independentes e aditivos**.
Cada módulo é uma metodologia completa, autocontida, indexada pelo [SKILL.md](SKILL.md).

## Módulos

| Módulo | Escopo | Estado |
| --- | --- | --- |
| [`deps`](modules/deps/MODULE.md) | Dependências: inventário de lockfile, CVEs com match de versão, triagem de exploração, patch não-breaking, relatório | ✅ ativo |
| [`fingerprinting`](modules/fingerprinting/MODULE.md) | Anti-reconhecimento: headers, erros, assets, arquivos gerados — o que a app revela da stack para um red team | ✅ ativo |
| ofensiva (auditoria de superfície, auth, IDOR, enumeração) | Pentest do código próprio | planejado |
| DoS/hardening | Rate limit, cap de payloads, abuso de endpoints caros | planejado |
| secrets/config | Vazamento de segredos, config de produção, headers | planejado |

## Como um módulo entra

Leia [modules/README.md](modules/README.md) — o contrato é curto de propósito: um módulo novo
não pode exigir mudanças nos existentes nem no dispatcher.

## Por que módulos

Métodos de segurança diferentes têm loops diferentes (auditoria ofensiva lê código e escreve
PoC; deps compara lockfile com banco de CVEs; hardening mede limites). Misturar tudo num
procedimento único produz passos vazios para o que não se aplica. Módulos segregados deixam
cada metodologia densa no que interessa e mantêm as regras comuns no [SKILL.md](SKILL.md).
