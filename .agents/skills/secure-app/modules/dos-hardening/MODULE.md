# Módulo: dos-hardening — rate limiting, lockout e abuso de conteúdo

Responder à pergunta: **"o que acontece se alguém decidir flodar isto?"** — registros, votos,
e-mails, feedbacks, CPU. Inventariar toda rota de escrita/custo, medir o teto de abuso por
ator (anônimo, conta válida, papel elevado) e fechar os tetos que não fizerem sentido.

Quando usar: "levantamento de rate limiting/lockout/content abuse", "o que pode ser flodado",
"hardening anti-DoS".
Quando NÃO usar: fingerprinting (módulo próprio), CVEs de dependência (módulo deps).

---

## Metodologia (5 passos)

### Passo 1 — Inventário de superfície de abuso

Liste TODA rota que cria/modifica estado ou tem custo de recurso, com quatro colunas:
**auth** (nenhuma / requireAuth / checkRole[papéis]) · **rate limit** (sim/não) ·
**custo por chamada** (linha no banco / e-mail SMTP / CPU pesada / chamada externa) ·
**reversibilidade** (dá para apagar o abuso? de quem?).

Por ecossistema: em Hono/Express, varra `.post/.put/.patch/.delete` + middlewares do chain;
em Laravel/Symfony, rotas com middleware de auth; em Rails, controllers + before_action.
Custo SMTP/CPU vira linha à parte: 1 request ≠ 1 unidade de dano.

### Passo 2 — Cenários de flood por ator

Para cada rota, calcule o teto de abuso no pior caso:

| Ator | Credenciais | Pergunta a responder |
| --- | --- | --- |
| Anônimo | nenhuma | quantas linhas/e-mails/CPU por minuto consigo? |
| Usuário válido | 1 conta (às vezes N, via registro público) | e sem limite por conta? |
| Papel elevado | TEACHER/ADMIN | os endpoints "confiáveis" têm teto? |
| Distribuído | N contas + N IPs | o limiter é por IP, por conta, global? |

Fórmula do relatório: **dano/hora por ator** (ex.: "TEACHER + sem limiter = 86 mil e-mails/dia
pela conta institucional"). Números, não adjetivos.

### Passo 3 — Política de lockout (decisão explícita, não ausência)

- **Lockout de conta** (bloquear após N falhas) tem trade-off: vira arma de DoS CONTRA
  usuários legítimos (floode falhas na conta da vítima). Rate limit por IP+conta com
  `clearOnSuccess` costuma bastar para credenciais.
- **Lockout progressivo/captcha** para registro público aberto.
- Registre a DECISÃO no relatório mesmo quando for "não fazemos lockout porque…".
  Ausência de política documentada é achado.

### Passo 4 — Limites de conteúdo e custo

- **Body limit**: o parser aceita payload de que tamanho? Onde está o teto REAL (middleware
  do app ou `client_max_body_size` do proxy?). Se só o proxy limita, o teto vive na infra —
  documentar quem é o dono.
- **Cardinalidade**: campos array/strings sem `max()` viram linhas gigantes (schema valida
  tipo, não tamanho).
- **CPU/externo pesado**: geração de PDF, envio de e-mail, imagem — cada um com limiter
  próprio ou quota por papel.

### Passo 5 — Correção, validação e relatório

Limite ausente em rota de anônimo = corrigir já (limiter simples resolve 90%).
Limite ausente em rota autenticada = limiter por papel/custo. Lockout = decisão documentada.
Validação: os gates normais do projeto + o teste de spec do limiar (429 após N).
Relatório: tabela de rotas × auth × limiter × custo, cenários de flood com dano/hora por ator,
decisões de lockout, correções aplicadas e work items.
