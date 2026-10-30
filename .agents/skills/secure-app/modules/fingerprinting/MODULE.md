# Módulo: fingerprinting — anti-reconhecimento

Reduzir o que a aplicação revela da própria stack, versão, estrutura e hábitos — o material
que um red team usa para escolher alvos, buscar CVEs compatíveis e desenhar ataques.

Quando usar: "levantamento de fingerprinting", "anti-fingerprinting", "o que a app revela da stack".
Quando NÃO usar: auditoria de lógica/autorização (módulo ofensivo), dependências (módulo deps).

---

## Metodologia (4 passos)

### Passo 1 — Inventário de canais de fingerprint

Varra o repositório listando todo canal que revela stack/versão/estrutura. Catálogo em
[surface.md](surface.md). Os clássicos por camada:

- **Headers de resposta**: `X-Powered-By`, `Server`, `Via`, `X-Generator`, cookies nomeados
  por framework, headers custom de libs.
- **Corpo de erro/404**: shape característico de framework (`{"message","ok"}`), paths de
  schema (Zod/validator) vazados no 400.
- **Conteúdo servido**: tags `<meta name="generator">`, comentários HTML, nomes de chunk
  que revelam rotas/estrutura (`admin-*.js`), sourcemaps publicados.
- **Arquivos gerados que saem da máquina**: e-mails (headers `X-Mailer`, footers de template),
  PDFs (metadata `Producer`/`Creator`), arquivos ICS (`PRODID`), imagens (EXIF).
- **Comportamento**: timing por framework, ordem de headers, ETag padrão, cache de 404.

### Passo 2 — Recon passivo contra o ambiente real

Repita a coleta contra o deploy real (`curl -sI`, HEAD/GET passivo, sem payload agressivo):
o código pode estar limpo e o **deploy** vazar (ou vice-versa: config de proxy adiciona
`Server: nginx`, a versão no ar pode ser anterior aos fixes). Evidência com saída crua do curl.

### Passo 3 — Classificação e mitigação

Para cada canal: **O que um red team deduz daqui?** → versão? framework? existência de
funcionalidade admin? topologia? Classifique:

- `REVELADOR` — entrega versão/stack específica que habilita busca de CVE → **mitigar agora**
  (custo quase sempre baixíssimo: remover header, desligar flag).
- `ESTRUTURAL` — revela arquitetura (chunks por rota, ids sequenciais) → mitigar se o custo
  couber (ids ulid/uuid já nascidos? senão, work item); normalmente documentar aceito.
- `INSTITUCIONAL` — identidade própria assumida de propósito (PRODID com marca, logo) →
  decisão de produto, não de segurança; documentar aceito.

Mitigação padrão por canal está em [surface.md](surface.md). Preferência: remover a fonte >
genérico > ofuscar (nunca só ofuscar).

### Passo 4 — Validação e relatório

Recoletar o fingerprint de produção após mitigar (mesmos comandos do passo 2, antes/depois)
e reportar: tabela de canais com antes/depois, o que ficou e por quê (aceito), e o que o
red team ainda consegue deduzir honestamente. Sem commits — working tree.

## Gates

Sem gate de suíte obrigatório (maioria das mitigações é header/config), MAS: se a mitigação
tocar código de runtime (ex.: handler de erro), valem os gates normais (typecheck + testes).
Curl de verificação antes/depois é o gate específico deste módulo.
