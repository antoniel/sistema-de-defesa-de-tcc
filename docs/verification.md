# Procedimento de verificação (SISDEF 3.0)

Procedimento para o agente provar comportamento do SISDEF pela interface real do usuário, com
evidência validada. Escrito para quem não conhece o projeto.

Skill relacionada: `.pi/skills/verify-app` (método geral). Este arquivo é o procedimento
específico deste repositório.

---

## 1. Interface e alvos

| Interface | Como verificar |
| --- | --- |
| Web (SSR) | Browser em `http://localhost:5173` — usar `agent-browser` + helper de evidência |
| API | `http://localhost:9000` (endpoints públicos e autenticados) |
| CLI | Comandos do `package.json` (testes, tscheck, migrations) |

## 2. Runtime e startup

| Item | Valor |
| --- | --- |
| Node | `>=18` (validado em 24.19.0) |
| npm | 11.x (workspaces) |
| Banco | PostgreSQL 17 em container `sistema-de-banca`, porta **5443** |
| Web | porta **5173** (`react-router dev`) |
| API | porta **9000** (`tsx watch src/server.ts`) |
| Orquestração | Turborepo (`npm run dev` sobe os dois via `dotenv -e .env`) |

### Preparação (só na primeira vez)

```bash
npm install
npm run docker:up          # PostgreSQL na 5443
```

`.env` na raiz (obrigatório — `npm run dev` usa `dotenv -e .env`):

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5443/sistema-de-banca
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:9000
SMTP_USER=qualquer@gmail.com
SMTP_PASSWORD=qualquer
JWT_SECRET=<string aleatória longa>
NODE_ENV=development
```

`SMTP_*` são exigidos pelo schema Zod (`apps/server/src/config/env.ts`), mas com `NODE_ENV` diferente
de `production` o envio usa Ethereal (URL de preview no console). Nunca dispare e-mail real.

### Popular o banco

```bash
npm run migration:run      # schema vazio + migrations
npm run seed               # dados sintéticos
# OU
npm run db:pull            # baixa dump de produção
npm run db:restore         # restaura no container local
```

### Startup e posse dos processos

```bash
npm run dev                # foreground; Ctrl+C encerra
```

Guardar o PID/sessão dos processos que **você** iniciou. Não matar processos por nome
(`pkill -f "turbo run dev"`) se outro agente puder estar usando a mesma instância.

### Avisos de startup

- `npm run dev` **não** instala dependências nem roda migrations automaticamente.
- `dotenv -e .env` injeta `VITE_API_URL` no processo; o Vite expõe variáveis `VITE_*` de
  `process.env`, então o front aponta para a API local.
- O container PostgreSQL é **compartilhado** entre execuções. `npm run db:restore` usa
  `--clean --if-exists` e **apaga** dados locais.

## 3. Health check (somente leitura)

```bash
curl -s -o /dev/null -w "web=%{http_code}\n" http://localhost:5173/
curl -s -o /dev/null -w "api=%{http_code}\n" "http://localhost:9000/banca/past?page=1&limit=1"
docker ps --filter name=sistema-de-banca --format "{{.Names}} {{.Status}}"
```

Esperado: `web=200`, `api=200`, container `Up`. `GET /` e `/health` na API devolvem 404 — isso é
normal, não use como health check.

## 4. Acesso e contas de teste

O login é um **dialog no header**, não uma rota:

1. Abrir `http://localhost:5173/`
2. Clicar no botão `Login` no header
3. Preencher `#login-email` e `#login-password`
4. Clicar em `Entrar`

Papéis relevantes: `ADMIN` (pode tudo), `TEACHER` (orientador edita a própria banca),
`STUDENT` (só lê).

Contas de teste locais: **criar uma conta dedicada no banco local** em vez de usar credenciais
reais de produção. Nunca gravar senha em arquivo versionado ou em evidência.

```bash
HASH=$(node -e "console.log(require('bcrypt').hashSync('senha-de-teste-local',10))")
docker exec sistema-de-banca psql -U postgres -d sistema-de-banca -c \
  "update usuario set password_hash='$HASH' where email='<email-de-teste>';"
```

Após `npm run db:restore` essa alteração é perdida (o dump volta ao original).

## 5. Evidência (agent-browser)

Perfil fixo gerenciado: viewport 1440 × 900, escala 2, saída 2880 × 1800, vídeo H.264 60 fps.
Requisitos: macOS/Linux, Python 3, `agent-browser` 0.38.1+, FFmpeg, ffprobe.
Rodar `agent-browser doctor` antes de gravar vídeo.

```sh
SKILL_DIR=".pi/skills/verify-app"          # relativo à raiz do repositório
VERIFY_DIR="/tmp/verify-sisdef-$(date +%s)" # fora de arquivos versionados

python3 "$SKILL_DIR/scripts/evidence.py" init "$VERIFY_DIR" "http://localhost:5173"
# init devolve BROWSER_SESSION

agent-browser --session "$BROWSER_SESSION" snapshot -i
python3 "$SKILL_DIR/scripts/evidence.py" screenshot "$VERIFY_DIR" before.png
python3 "$SKILL_DIR/scripts/evidence.py" start "$VERIFY_DIR" interaction.mp4
# ... executar a ação real no mesmo session ...
python3 "$SKILL_DIR/scripts/evidence.py" stop "$VERIFY_DIR"
python3 "$SKILL_DIR/scripts/evidence.py" screenshot "$VERIFY_DIR" after.png
agent-browser --session "$BROWSER_SESSION" errors
agent-browser --session "$BROWSER_SESSION" console
python3 "$SKILL_DIR/scripts/evidence.py" check "$VERIFY_DIR"   # exigir exit 0
python3 "$SKILL_DIR/scripts/evidence.py" close "$VERIFY_DIR"
```

`check` valida mídia, não comportamento. Revisar as imagens visualmente nas dimensões originais
antes de afirmar qualquer coisa sobre a interface.

## 5b. Vídeo de demo (NÃO é evidência)

A gravação gerenciada é contínua de propósito: ela prova a sequência ação→resultado, incluindo a
espera entre os dois. **Não encurte esse arquivo cortando os trechos parados.**

Motivo: numa captura em resolução cheia (2880×1800), o movimento do cursor muda pouquíssimos
pixels e o `freezedetect` o considera imagem parada. O corte então **remove o gesto**, e a emenda
aparece como um salto. O resultado vira um storyboard de estados, não um vídeo de interação.

### O caminho certo: gravar takes separados

Deixe o gravador **parado** enquanto escolhe a próxima ação. Ligue quando o gesto começar. Guarde o
caminho inteiro do ponteiro. Desligue depois que o resultado estiver legível por ~0,6s.

```sh
DEMO_DIR="$VERIFY_DIR-demo"
mkdir -p "$DEMO_DIR/takes"

agent-browser --session "$BROWSER_SESSION" record start "$DEMO_DIR/takes/01.mp4" --fps 60 --cursor
# execute um gesto preparado, depois segure o resultado
agent-browser --session "$BROWSER_SESSION" record stop
# escolha a próxima ação aqui: com o gravador parado, essa espera NÃO entra no demo
agent-browser --session "$BROWSER_SESSION" record start "$DEMO_DIR/takes/02.mp4" --fps 60 --cursor
# execute o próximo gesto e segure o resultado
agent-browser --session "$BROWSER_SESSION" record stop

python3 scripts/demo_join.py "$DEMO_DIR/takes/01.mp4" "$DEMO_DIR/takes/02.mp4" -o "$DEMO_DIR/demo.mp4"
```

O `demo_join.py` só coloca os takes em ordem — não corta frame nem re-codifica (`-c copy`). Por isso
os takes precisam ter os mesmos parâmetros de gravação (o mesmo `record start --fps 60 --cursor`).

### Regras

- **A evidência não é alterada.** O demo sai fora do diretório de captura: o script recusa escrever
dentro de um diretório que tenha `capture.json` (verifica também os diretórios pais).
- **Nunca rotule o demo como evidência.** `evidence.py check` valida só a gravação original.
- Para a demo, use o **mesmo** viewport/escala da captura, para o visual bater com a evidência.

### Alternativa: encurtar uma gravação já existente

`scripts/demo_cut.py` pega um vídeo contínuo e remove os trechos parados. Serve para dar uma olhada
rápida num arquivo longo que já foi gravado, mas **não** para demo: pelo motivo do cursor acima, ele
tira os gestos do vídeo. A saída fica parecendo uma sequência de telas paradas.

```sh
python3 scripts/demo_cut.py /tmp/verify-xxx/interaction.mp4 --dry-run --report  # só relata
python3 scripts/demo_cut.py /tmp/verify-xxx/interaction.mp4 -o /tmp/demo.mp4 --report
```

### Testes

```sh
python3 -m unittest discover -s scripts -p 'test_*.py'    # 15 testes, ~0,15s, sem ffmpeg
```

Os testes de CLI pulam sozinhos quando falta ffmpeg (o runner do `tscheck` no CI não tem).

Validação do corte com durações conhecidas (15s = 2s parado, 3s movimento, 4s parado, 3s movimento,
3s parado) — deve dar 7,8s:

```sh
ffmpeg -hide_banner -loglevel error -y \
  -f lavfi -i "color=c=navy:s=640x360:d=2:r=60" \
  -f lavfi -i "testsrc=s=640x360:d=3:r=60" \
  -f lavfi -i "color=c=navy:s=640x360:d=4:r=60" \
  -f lavfi -i "testsrc=s=640x360:d=3:r=60" \
  -f lavfi -i "color=c=navy:s=640x360:d=3:r=60" \
  -filter_complex "[0:v][1:v][2:v][3:v][4:v]concat=n=5:v=1:a=0[v]" -map "[v]" \
  -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p /tmp/synth.mp4
python3 scripts/demo_cut.py /tmp/synth.mp4 -o /tmp/synth-demo.mp4 --report
```

## 6. Mapa de features

| Feature | Rota / entrada | Conta necessária | Resultado observável | Persistência |
| --- | --- | --- | --- | --- |
| Lista pública de defesas | `/` | anônimo | Tabela "Defesas anteriores" com linhas | — |
| Detalhe da defesa | `/banca/:id` | anônimo (banca `visible`) | Título, Resumo, Abstract, Palavras-chave | — |
| Link do PDF do TCC | `/banca/:id` | anônimo | Botão/link `Baixar PDF do TCC` quando `linkTrabalho` existe | coluna `banca.link_trabalho` |
| Cadastro de defesa | `/add-banca` | ADMIN ou TEACHER | Wizard de 5 passos; campo `Link do PDF do TCC 🔗` no passo "Metadados e Agendamento" | POST `/banca` |
| Edição da defesa | `/banca/:id/edit` | ADMIN ou orientador | Campo `Link do PDF do TCC 🔗` após "Local" | PUT `/banca/:id` |
| Visibilidade da banca | `/banca/:id` | ADMIN ou orientador | Switch pública/privada | PATCH |
| Convite de professor | `/admin/teacher-invitations` | ADMIN | Convite criado com link | — |
| Feedback | `/feedback` | usuário logado | Formulário de avaliação | POST |

Bancas privadas (`visible = false`) só aparecem para admin, orientador e membros — o link do PDF
herda essa regra, porque a página inteira é protegida.

## 7. Limpeza

- Encerrar sessões de browser com o identificador retornado pelo `init` (`evidence.py close`).
- Parar apenas os processos que este teste iniciou.
- **Não** parar o container `sistema-de-banca` nem a instância de `npm run dev` se não forem seus.
- Preservar o diretório de evidência; só remover estado temporário de teste quando for seguro.
