# Módulo: access-control — authn/authz/IDOR/escalação

Responder: **"toda rota que lê ou escreve algo tem o papel certo? e um papel só alcança
OS RECURSOS que pode?"** — a classe de bug que este projeto teve em 4 formas distintas
(rota pública, TEACHER→ADMIN, banca privada lida por fora, nota atribuída por outro).

Quando usar: pós-feature nova (especialmente rotas novas), revisão de matrizes de permissão,
suspeita de IDOR.

---

## Harness: a matriz rota × papel × recurso

O aprendizado desta categoria é que bug de acesso não aparece lendo código solto — aparece
quando a **matriz** é construída de verdade. O harness:

1. **Extraia todas as rotas** dos routers (`.get/.post/.put/.patch/.delete`) e anote para
   cada uma: middleware de auth (`requireAuth`/`checkRole([...])`/NENHUM) + qual recurso
   toca (por id no path? por body? global?).
   - **Regra de extração**: o chain do ROUTER manda; middleware global (ex.: `appJwt`)
     fail-open NÃO conta como proteção. Serviço que lê `jwtPayload` sem middleware de auth
     NÃO é proteção (o bug do feedback: `jwtPayload.sub` crashava anônimo).
2. **Decida a célula correta** para cada rota × papel: permitido/negado (essa decisão é de
   produto — anote a justificativa de uma linha).
3. **Codifique a matriz como specs**: um teste por célula crítica, no padrão
   `tests/security/` (anônimo → 401; papel errado → 403; papel certo → 200).
   Vermelho = bug aberto.

## Checklist executável (padrões que JÁ viraram bug aqui)

- [ ] Rota nova montada sem middleware de auth no chain (POST /banca foi público até 2026-10)
- [ ] Schema de criação/aceitação que inclui campo de papel (`role` no payload → TEACHER
      criava ADMIN)
- [ ] Query por id sem checagem de **visibilidade** E de **membership** (documentos/info
      lia banca privada de qualquer TEACHER)
- [ ] Recurso acessado por id com permissão checada apenas na coleção, não no item (IDOR)
- [ ] Serviço que lê `jwtPayload` sem middleware de auth na frente (feedback/feature-request:
      crash 500 anônimo; ou pior: usa sub sem verificar)
- [ ] `checkRole` presente mas resolvendo papel de fonte errada (snapshot de JWT vs. banco —
      aqui o padrão correto é re-consultar o banco: `resolveAuthenticatedUser`)
- [ ] Middleware global fail-open (`appJwt` deixa passar sem token) contando como proteção
      no raciocínio de alguém

## Classificação de gravidade (contexto)

- Escalação de papel (criar/eleva ADMIN) > escrita em recurso alheio > leitura de recurso
  privado > leitura de coleção pública protegida por papel fraco.

## Validação

Specs da matriz verdes + suíte completa + e2e dos fluxos de acesso da UI (o que o usuário
DEIXA de ver no menu tem que casar com o que a API nega — gating de UI é experiência, não
segurança; a fonte da verdade é a matriz da API).
