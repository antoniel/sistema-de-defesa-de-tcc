# Catálogo de canais de fingerprint + mitigação padrão

| Canal | O que revela | Como detectar | Mitigação padrão |
| --- | --- | --- | --- |
| Header `X-Powered-By` | framework + às vezes versão | `curl -sI` | remover middleware/flag (`poweredBy()` no Hono; `app.disable('x-powered-by')` no Express; `server_tokens off` no nginx) |
| Header `Server` | proxy/servidor (nginx, versão) | `curl -sI` | `server_tokens off` (infra/proxy — fora do repo, documentar) |
| Headers próprios de lib (`X-Mailer`, `X-Generator`) | lib + versão | grep no código + headers | não setar; sobrescrever com valor neutro |
| Shape de erro/404/400 | framework, biblioteca de validação (paths de schema vazados) | `curl` rota inexistente + payload inválido | handler de erro central genérico; não devolver `issues[].path` ao cliente |
| JSON identado (`prettyJSON`) | hábito/framework | corpo de resposta | desligar em produção |
| CORS reflexivo | postura de origem | header `access-control-allow-origin` | allowlist de origens (regra de outro módulo, mas é fingerprint) |
| Sourcemaps no build | código-fonte completo | `find build -name "*.map"` | desligar `sourcemap` no build de produção |
| Nomes de chunk/rota no bundle | estrutura de rotas, existência de área admin | listar `build/client/assets` | custo alto de mudar → normalmente ACEITO (documentar) |
| IDs sequenciais (`/recurso/42`) | modelo de dados, volume, enumeração | conteúdo de respostas | ULID/UUID em recursos novos; work item para os existentes |
| Metadata de arquivos gerados: PDF `Producer`, ICS `PRODID`, EXIF | biblioteca geradora / sistema de origem | inspecionar arquivo gerado | se branding não é desejado: sobrescrever campo; senão ACEITO (institucional) |
| Templates de e-mail (footers, estrutura) | sistema de origem | inspecionar e-mail recebido | decisão institucional |
| Claims de JWT (`iss`, `aud`, `exp`) | ambiente (nome local?), tempo de sessão | decodificar token recebido | nomes neutros em produção; não vaza stack, mas vaza hábito |
| Rotas de teste/debug (`/__test__`, `/debug`) | tudo | curl + grep de montagem condicional | montar somente com env de teste (padrão deste repo: `NODE_ENV === "test"` no test-server) |
| DNS/TLS/histórico de certificado | hospedagem, provedor | recon externo | fora do escopo do repo (infra) |
| `robots.txt`/`security.txt` ausentes | (sinal negativo, baixo valor) | curl | opcional: adicionar `security.txt` com contato |

## Regras

- **Mitigar > ofuscar**: remover o emissor (header/flag) supera mascarar o valor.
- **Recoletar após mitigar**: o módulo só entrega com o curl de antes/depois do deploy real.
- **O fingerprint zero não existe**: o objetivo é reduzir o que reduz barato e documentar o
  resto como aceito — relatório honesto do que o red team ainda deduz.
