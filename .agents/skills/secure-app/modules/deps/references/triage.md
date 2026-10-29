# Triagem de exploração — como escrever "você estava vulnerável aqui"

O entregável da triagem não é a lista de CVEs — é a resposta à pergunta do dono do projeto:
**"como isso me afeta?"**. Cada achado classificado `EXPLORÁVEL HOJE` ou `MINA ARMADA` precisa
de um parágrafo no relatório com este formato:

```md
### <pacote>@<versão> — <título curto> (<id do advisory, severidade>)

**Onde estávamos expostos:** <componente/rota/config que carrega o código vulnerável>
**Como seria a exploração:** <pré-condições> → <passos do attacker> → <efeito concreto
(no vocabulário do projeto: "ler o .env de produção com DATABASE_URL e JWT_SECRET",
"responder /usuario/all sem token", "injetar BCC nos e-mails do sistema")>
**Por que (não) é explorável hoje:** <o que a triagem encontrou no código — uso real,
validação que bloqueia, feature não usada>
```

## Checklist de alcance (por ordem)

1. **Runtime de produção**: o pacote aparece no processo que atende usuários?
   (ver Dockerfile, `scripts.start`, entrypoint). Tooling de dev não roda em prod.
2. **Recurso vulnerável em uso**: grep dirigido pelo advisory (nome da função, opção,
   middleware). O advisory diz O QUE é vulnerável — verificar se ESSE algo existe no código.
3. **Pré-condição do attacker**: nenhuma (internet anônima) < conta válida < papel elevado
   < acesso local/banco. Quanto menor a pré-condição, maior a urgência.
4. **Mitigação incidente**: validação de entrada, sanitizer, middleware próprio — reduzem a
   explorabilidade mas NÃO encerram o achado (regressão de mitigação é silenciosa).

## Exemplos reais (deste projeto) para calibrar o texto

- **`hono` path parsing (high)**: "confusão de path poderia fazer uma rota protegida casar
  sem passar pelo middleware `checkRole` — ex.: variantes de `/usuario/all` com encoding
  responderiam a lista completa de usuários sem token". Exploração plausível, PoC pendente
  na versão exata → correção imediata mesmo assim.
- **`@react-router` File Session Storage (critical)**: "não usamos session storage (JWT);
  se alguém adicionar `createFileSessionStorage`, um id de sessão com `../` leria arquivo
  arbitrário do container — incluindo o `.env` com DATABASE_URL e JWT_SECRET".
  Classificação correta: MINA ARMADA.
- **`nodemailer` SMTP injection (high)**: "injeção de `\n` no envelope SMTP anexaria
  destinatários às mensagens do sistema; nossos destinatários passam por `z.string().email()`
  e não passamos a opção `envelope` — exploração exige burlar o validador". TEÓRICO → patch
  de higiene.
- **`drizzle-orm` SQL identifier injection (high)**: "exige input do usuário como
  identificador SQL (`sql.raw`/orderBy dinâmico); hoje `sql.raw` só recebe string constante.
  Cenário de ativação: alguém adicionar ordenação por query param mapeada direto para coluna"
  → MINA ARMADA, deferido com cadeia zod4→drizzle 0.45.

## Classificação (resumo)

| Classe | Condição | Ação |
| --- | --- | --- |
| EXPLORÁVEL HOJE | superfície exposta + uso real + pré-condição baixa | patch já, com passos de exploração no relatório |
| MINA ARMADA | código vulnerável em produção, sem caminho hoje | patch preferencial; se deferido, work item com gatilho de ativação |
| TEÓRICO | mitigação/pré-condição impede hoje | patch de higiene; documentar a mitigação |
| DEV-ONLY | não existe no runtime de produção | patch por higiene; nota no relatório |
