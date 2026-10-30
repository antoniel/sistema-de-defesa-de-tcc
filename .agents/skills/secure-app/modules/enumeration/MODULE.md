# Módulo: enumeration — oráculos de existência

Responder: **"o que as RESPOSTAS contam para um atacante que só bruta-forceia?"** — status/
mensagens/timing que distinguem "existe" de "não existe", deixando mapear contas, convites e
recursos sem credencial nenhuma. A classe dos bugs 8 do Top-10 (reset 200 vs 404, login
"inativo") e dos probes de hash.

Quando usar: rotas de credencial/recuperação/convite (sempre), qualquer endpoint que busca
por identificador e responde com erro diferente para "não achei".

---

## Harness: o par de requisições

O método que funcionou aqui: para cada endpoint que recebe identificador, faça o PAR
(existe vs. não existe) e exija **indistinguibilidade**:

1. **Liste os pares**: e-mail existente/inexistente, token válido/inválido, hash
   usado/pendente, id existente/não existente, conta ativa/inativa.
2. **Codifique como spec de uniformidade** (padrões 06/08):
   - status IGUAL para o par;
   - corpo IGUAL (texto); e
   - NENHUMA palavra discriminante ("não encontrado", "inativo", "expirado" para quem
     só chutou um valor).
3. **Timing**: uniformidade de status não cobre timing (bcrypt de senha vs. lookup vazio).
   Para rotas de credencial, a mitigação estrutural é hash de comparação com custo fixo
   (bcrypt de um dummy antes de retornar) — especifique como decisão, não como teste
   (timing em teste é flaky; documente a mitigação no código).

## Checklist executável (padrões que JÁ viraram bug aqui)

- [ ] Reset de senha: 404 para e-mail inexistente vs 200 para existente (bug fixado: sempre
      200 genérico, na fronteira do SERVIÇO — nenhum caller futuro vaza)
- [ ] Login: "Seu usuário está inativo" vs "senha inválida" (confirma que o e-mail existe)
- [ ] Erros de validação que citam o campo quando o campo nem deveria ser analisado
- [ ] Convites/probes de hash: 404 vs 400 vs 410 distinguem estados que devem ser opacos
- [ ] Sequência de expiração: token "expirado" ≠ "inválido" informa que o token EXISTIU
      (aceitável para quem já tem o token — decidir e documentar)
- [ ] Erros de constraint de banco vazando no 500 do log... (não vaza pro cliente — verificar)

## Regras de correção

- **Uniformidade na fronteira do serviço** (não na rota): nenhum caller futuro reabre o
  oráculo (padrão aplicado na correção 8: serviço retorna ok mesmo sem usuário).
- Mensagem genérica AUTORADA ("Se o email existir, um link foi enviado") — acionável para
  o usuário honesto, opaca para o atacante.
- Registro interno (log) PODE discriminar — só a RESPOSTA não.

## Validação

Specs de uniformidade verdes (pares) + suíte completa. O teste da Mensagem é de propriedade:
`expect(text).not.toContain(...)` das frases discriminantes.
