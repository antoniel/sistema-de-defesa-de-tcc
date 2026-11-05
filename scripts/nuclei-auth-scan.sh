#!/usr/bin/env bash
#
# Scan nuclei AUTENTICADO contra a stack de teste (API 9100, PGlite em memoria).
#
# O que faz:
#   1. Sobe a API de teste se nao estiver no ar (nunca encosta no dev/producao)
#   2. Loga com as contas do seed (student.free, teacher3) e deriva tokens
#      corrompidos (bad-signature, alg=none)
#   3. Renderiza nuclei-scan/templates/*.yaml -> templates-build/ com os tokens
#      reais (build dir e descartavel: NAO commitar, tokens la dentro)
#   4. Roda nuclei (docker) com os templates custom de authz/JWT
#   5. Roda um pass generico (exposure/misconfig/tech/...) COM token de student,
#      pra fechar o buraco "templates genericos nunca viram superficie autenticada"
#   6. Sonda o rate limit do login com curl (25 tentativas erradas)
#
# Uso: scripts/nuclei-auth-scan.sh
# Resultados: nuclei-scan/results/auth-scan.jsonl e generic-authed.jsonl

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API="${API_URL:-http://localhost:9100}"
PASS="senha-e2e-123"
TPL_SRC="$ROOT/nuclei-scan/templates"
TPL_BUILD="$ROOT/nuclei-scan/templates-build"
OUT="$ROOT/nuclei-scan/results"
API_LOG="${API_LOG:-/tmp/sisdef-nuclei-api.log}"

mkdir -p "$TPL_BUILD" "$OUT"

log() { printf '\033[1;34m==> %s\033[0m\n' "$*"; }

# ---------------------------------------------------------------- 1. API no ar
if curl -sf -m 3 "$API/__test__/health" >/dev/null 2>&1; then
  log "API de teste ja esta no ar em $API"
else
  log "Subindo API de teste em $API (log: $API_LOG)"
  (cd "$ROOT/apps/server" && NODE_ENV=test PORT=9100 nohup npx tsx src/test-server.ts > "$API_LOG" 2>&1 &)
  for _ in $(seq 1 30); do
    curl -sf -m 2 "$API/__test__/health" >/dev/null 2>&1 && break
    sleep 1
  done
  curl -sf -m 3 "$API/__test__/health" >/dev/null || { echo "API nao subiu; veja $API_LOG" >&2; exit 1; }
  log "API no ar"
fi

# ---------------------------------------------------------------- 2. tokens
login() {
  curl -sf -m 10 -X POST "$API/auth/login" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"$1\",\"password\":\"$2\"}" \
    | python3 -c 'import json,sys; print(json.load(sys.stdin)["token"])'
}

log "Logando contas do seed"
TOKEN_STUDENT_FREE=$(login student.free@e2e.local "$PASS")
TOKEN_TEACHER3=$(login teacher3@e2e.local "$PASS")
[ -n "$TOKEN_STUDENT_FREE" ] && [ -n "$TOKEN_TEACHER3" ] || { echo "login falhou" >&2; exit 1; }

# Assinatura corrompida: troca os 2 ultimos chars por "AA"
TOKEN_STUDENT_BADSIG="${TOKEN_STUDENT_FREE%??}AA"

# alg=none: header forjado + payload legitimo + assinatura vazia
b64url() { openssl base64 -A | tr '/+' '_-' | tr -d '='; }
PAYLOAD=$(printf '%s' "$TOKEN_STUDENT_FREE" | cut -d. -f2)
TOKEN_ALG_NONE="$(printf '{"alg":"none","typ":"JWT"}' | b64url).$PAYLOAD."

# ---------------------------------------------------------------- 3. render
log "Renderizando templates com tokens (em $TPL_BUILD)"
for f in "$TPL_SRC"/*.yaml; do
  sed \
    -e "s|{{TOKEN_STUDENT_FREE}}|$TOKEN_STUDENT_FREE|g" \
    -e "s|{{TOKEN_TEACHER3}}|$TOKEN_TEACHER3|g" \
    -e "s|{{TOKEN_STUDENT_BADSIG}}|$TOKEN_STUDENT_BADSIG|g" \
    -e "s|{{TOKEN_ALG_NONE}}|$TOKEN_ALG_NONE|g" \
    "$f" > "$TPL_BUILD/$(basename "$f")"
done

# ---------------------------------------------------------------- 4. scan custom
log "Rodando templates custom de authz/JWT"
docker run --rm \
  --add-host=host.docker.internal:host-gateway \
  -v "$ROOT/nuclei-scan:/work" \
  projectdiscovery/nuclei:latest \
  -u "http://host.docker.internal:9100" \
  -t /work/templates-build \
  -no-color -silent -j -or -ot \
  -o /work/results/auth-scan.jsonl \
  || true
echo "--- achados custom: $(grep -c . "$OUT/auth-scan.jsonl" 2>/dev/null || echo 0)"

# ---------------------------------------------------------------- 5. pass generico autenticado
log "Pass generico com token de STUDENT (fecha o buraco do scan anonimo)"
docker run --rm \
  --add-host=host.docker.internal:host-gateway \
  -v "$ROOT/nuclei-scan:/work" \
  projectdiscovery/nuclei:latest \
  -u "http://host.docker.internal:9100" \
  -H "Authorization: Bearer $TOKEN_STUDENT_FREE" \
  -tags exposure,misconfiguration,default-login,technologies,tech,dast,fuzzing,sqli,xss,ssrf \
  -severity info,medium,high,critical \
  -rl 500 -c 100 -timeout 10 \
  -no-color -silent -j -or -ot \
  -o /work/results/generic-authed.jsonl \
  || true
echo "--- achados genericos autenticados: $(grep -c . "$OUT/generic-authed.jsonl" 2>/dev/null || echo 0)"

# ---------------------------------------------------------------- 6. rate limit do login
log "Sondando rate limit do login (25 tentativas com senha errada)"
hits=0; lim=0
for i in $(seq 1 25); do
  code=$(curl -s -o /dev/null -w '%{http_code}' -m 10 -X POST "$API/auth/login" \
    -H 'Content-Type: application/json' \
    -d '{"email":"admin@e2e.local","password":"senha-errada"}')
  [ "$code" = "429" ] && lim=$((lim + 1))
  [ "$code" = "401" ] && hits=$((hits + 1))
done
if [ "$lim" -gt 0 ]; then
  echo "rate-limit login: OK ($lim respostas 429 em 25 tentativas)"
else
  echo "rate-limit login: NENHUM 429 em 25 tentativas ($hits x 401) — verificar middleware"
fi

log "Fim. Resultados em $OUT"
