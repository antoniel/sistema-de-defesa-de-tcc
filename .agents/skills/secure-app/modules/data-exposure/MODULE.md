# Módulo: data-exposure — vazamento de dados nas respostas

Responder: **"o que sai nas respostas que não deveria sair?"** — campos internos, PII, hashes,
estrutura de schema. A classe do bug mais grave deste projeto: `passwordHash` de TODOS os
membros de banca em respostas públicas (porção 1 do Top-10).

Quando usar: pós-feature que retorna objetos relacionados (join/relations), revisão de
endpoints públicos, suspeita de vazamento.

---

## Harness: a regra da projeção

O padrão de bug aqui é sempre o mesmo: **a query traz mais do que a resposta mostra** —
e ninguém percebe porque o frontend só exibe o que interessa. O harness institucionaliza:

1. **Inventário de pro jeções**: para cada endpoint, liste o que a query retorna
   (em Drizzle: `with: { usuario: true }` retorna o usuário INTEIRO; `SELECT *`; spread
   de objeto sem destructuring de exclusão).
2. **Compare com o permitido**: cada campo retornado é público no papel daquele endpoint?
   Defina a lista de campos PÚBLICOS por recurso (`publicUserColumns` no padrão deste repo:
   projeção explícita + `toPublicUser` como única fonte de usuário em respostas).
3. **Codifique como spec negativa** (o padrão 01): `expect(text).not.toContain("passwordHash")`
   + regex de hash (`\$2[aby]\$...`) — testar o CORPO REAL da resposta, não o tipo.
4. **Automatize o grep como teste**: spec que varre o código-fonte por construções
   de vazamento conhecidas (`with: { usuario: true }` sem sanitização posterior, spread
   de SelectUser direto em `c.json`) — falha quando o padrão reaparece no código.

## Checklist executável (padrões que JÁ viraram bug aqui)

- [ ] Relações carregadas inteiras (`with: { usuario: true }`) sem projeção/sanitização
- [ ] `SELECT *` / spread de `SelectUser` em resposta
- [ ] Endpoint público retornando PII por id (GET /usuario/:id devolvia email+matrícula+bio)
- [ ] Mensagem de erro que discrimina existência (viraEnumeration — módulo próprio, mas o
      404 com "não encontrado" é também vazamento)
- [ ] Campos de auditoria expostos sem necessidade (created_at/updated_at ok; internals não)
- [ ] Novo campo notNull na tabela vaza automaticamente (a projeção explícita é a única
      defesa — column nova entra no SELECT sem ninguém notar)

## Regras de correção

- Projeção explícita (`publicUserColumns`) > destructuring de exclusão > sanitização
  pós-query — nessa ordem (o formato mais rígido primeiro).
- Sanitização DEVE viver no serviço (não na rota): todo caller herda.
- Novo endpoint: a lista de campos públicos entra no PR junto — nunca "depois".

## Validação

Specs negativas verdes + suíte completa. Gate extra deste módulo: diff de resposta
antes/depois da correção (o relatório mostra o que deixou de vazar, campo a campo).
