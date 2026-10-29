# Módulos — contrato de adição

Um módulo é uma metodologia de segurança completa e autocontida. Para adicionar um:

1. Crie `modules/<nome>/MODULE.md` com a metodologia em passos executáveis (o agente deve
   conseguir seguir sem contexto extra além do repositório).
2. Detalhe por ecossistema/linguagem em blocos ou em `references/` — **nunca** escreva a
   metodologia acoplada a uma linguagem só (o dispatcher e o contrato proíbem overfitting
   para Node/npm: PHP/Composer, Rust/Cargo, Python, Go etc. têm a mesma metodologia com
   comandos diferentes).
3. Inclua:
   - o **protocolo de validação de fontes de dados** do módulo (toda fonte externa é desconfiada
     até validar; defina como validar);
   - a **política de correção** (o que é aplicado, o que vira work item e com que justificativa);
   - o **formato do relatório final** (use `deps/report-template.md` como referência de estilo);
   - os **gates de validação** obrigatórios após qualquer correção.
4. Registre o módulo na tabela de dispatch do `SKILL.md` e na tabela de módulos do `README.md`.
5. Um módulo novo não edita módulo existente. Se precisar de algo comum, proponha no
   `SKILL.md` (regras comuns) — nunca faça um módulo importar de outro.

## Esqueleto mínimo de MODULE.md

```md
# Módulo: <nome>

Quando usar / quando NÃO usar
Passo 1..N (metodologia executável)
Fontes de dados + protocolo de validação
Política de correção
Gates de validação
Formato do relatório (link para report-template.md)
```
