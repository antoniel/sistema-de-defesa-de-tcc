#!/bin/bash
# Red team scan r2 - coordenado na VM boat (uso exclusivo de localhost/alvo de teste).
# Fases:
#   FASE A (paralela): 10 templates custom red team + genéricos anônimos -list urls-anon
#                      + genéricos com token STUDENT/urls-student + genéricos com token TEACHER/urls-teacher
#   FASE B: neg-checks (esperados BLOQUEADOS) via curl + probes de rate limit (register/reset)
#   FASE C: POST /__test__/reset (restaura o seed — os templates destrutivos removem/alteram entidades)
set -uo pipefail

BASE="$(cd "$(dirname "$0")" && pwd)"
API=http://localhost:9100
OUT=$BASE/results
BUILD=$BASE/build
NUCLEI=$HOME/bin/nuclei
PASS="senha-e2e-123"
mkdir -p "$OUT" "$BUILD"
exec > "$OUT/run.log" 2>&1
log(){ echo "[$(date +%H:%M:%S)] $*"; }

for i in $(seq 1 60); do
  curl -sf -m 2 "$API/__test__/health" >/dev/null 2>&1 && break
  sleep 2
done
curl -sf -m 3 "$API/__test__/health" >/dev/null || { log "ERRO: API nao subiu"; exit 1; }
curl -s -o /dev/null -m 5 "$API/banca" || true
log "API viva"

login(){
  curl -sf -m 10 -X POST "$API/auth/login" -H 'Content-Type: application/json' \
    -d "{\"email\":\"$1\",\"password\":\"$2\"}" \
    | python3 -c 'import json,sys; print(json.load(sys.stdin)["token"])'
}
TOKEN_STUDENT=$(login student.free@e2e.local "$PASS") || true
TOKEN_TEACHER=$(login teacher3@e2e.local "$PASS") || true
[ -n "${TOKEN_STUDENT:-}" ] && [ -n "${TOKEN_TEACHER:-}" ] || { log "ERRO login"; exit 1; }
log "tokens ok (student, teacher3)"

for f in "$BASE"/tpl-raw/*.yaml; do
  sed \
    -e "s|{{TOKEN_STUDENT}}|$TOKEN_STUDENT|g" \
    -e "s|{{TOKEN_TEACHER}}|$TOKEN_TEACHER|g" \
    "$f" > "$BUILD/$(basename "$f")"
done
log "renderizados: $(ls "$BUILD" | wc -l) templates"

run_rt(){
  "$NUCLEI" -u "$API" -t "$BUILD" \
    -rl 100 -c 30 -timeout 10 \
    -no-color -silent -j -or -ot \
    -o "$OUT/redteam-custom.jsonl" >/dev/null 2>&1
  log "redteam custom rc=$? achados=$(grep -c . "$OUT/redteam-custom.jsonl" 2>/dev/null || echo 0)"
}
run_list(){
  local name=$1 list=$2 rl=$3 token_arg="$4"; shift 4
  if [ -n "$token_arg" ]; then
    "$NUCLEI" -list "$list" "$@" -H "Authorization: Bearer $token_arg" \
      -rl "$rl" -c 60 -timeout 10 -retries 1 \
      -no-color -silent -j -or -ot \
      -o "$OUT/gen-$name.jsonl" >/dev/null 2>&1
  else
    "$NUCLEI" -list "$list" "$@" \
      -rl "$rl" -c 60 -timeout 10 -retries 1 \
      -no-color -silent -j -or -ot \
      -o "$OUT/gen-$name.jsonl" >/dev/null 2>&1
  fi
  log "gen-$name rc=$? achados=$(grep -c . "$OUT/gen-$name.jsonl" 2>/dev/null || echo 0)"
}

T0=$(date +%s)
log "FASE A: 4 processos nuclei em paralelo"
run_rt &
run_list anon      "$BASE/urls-anon.txt"    150 "" \
  -tags exposure,misconfiguration,sqli,xss,ssrf,rce,dast,fuzzing \
  -severity info,low,medium,high,critical &
run_list student   "$BASE/urls-student.txt" 120 "$TOKEN_STUDENT" \
  -tags sqli,xss,ssrf,rce,dast,fuzzing,exposure \
  -severity info,low,medium,high,critical &
run_list teacher   "$BASE/urls-teacher.txt" 120 "$TOKEN_TEACHER" \
  -tags sqli,xss,ssrf,rce,dast,fuzzing,exposure \
  -severity info,low,medium,high,critical &
wait
log "FASE A concluida em $(( $(date +%s) - T0 ))s"

# ---------------------------------------------------------------- FASE B: neg-checks (o correto e BLOQUEAR)
log "FASE B: neg-checks"
neg(){
  local name=$1 expect=$2; shift 2
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' -m 10 "$@")
  if [ "$code" = "$expect" ]; then
    echo "OK    $name: HTTP $code (esperado $expect) — bloqueado/filtrado"
  else
    echo "ALERT $name: HTTP $code != esperado $expect — VERIFICAR"
  fi
}
{
neg "GET /banca/3 anon (privada deve 404)"        "404" "$API/banca/3"
neg "PUT /banca/3 anon (deve 4xx)"                "403" -X PUT -H 'Content-Type: application/json' -d '{}' "$API/banca/3"
neg "PATCH toggle-visibility teacher3 em banca 3 (deve 403 — so orientador)" "403" -X PATCH -H "Authorization: Bearer $TOKEN_TEACHER" "$API/banca/3/toggle-visibility"
neg "GET /calendar/3/google anon (privada deve 404)" "404" "$API/calendar/3/google"
neg "GET /usuario/7 anon (deve 401)"              "401" "$API/usuario/7"
neg "GET /usuario/all student (deve 403)"         "403" -H "Authorization: Bearer $TOKEN_STUDENT" "$API/usuario/all"
neg "GET /banca/my-defenses student (deve 403)"   "403" -H "Authorization: Bearer $TOKEN_STUDENT" "$API/banca/my-defenses"
neg "POST /banca student (deve 403)"              "403" -X POST -H "Authorization: Bearer $TOKEN_STUDENT" -H 'Content-Type: application/json' -d '{}' "$API/banca"
neg "POST /banca/convites/email student (deve 403)" "403" -X POST -H "Authorization: Bearer $TOKEN_STUDENT" -H 'Content-Type: application/json' -d '{"bancaId":1,"email":"a@b.com","role":"x"}' "$API/banca/convites/email"
neg "POST /documentos/send-ceag student (deve 403)" "403" -X POST -H "Authorization: Bearer $TOKEN_STUDENT" -H 'Content-Type: application/json' -d '{"ceapgEmail":"a@b.com","senderName":"x","senderEmail":"a@b.com","message":"x"}' "$API/documentos/send-ceag-declarations/1"
neg "POST /teacher-invitation student (deve 403)" "403" -X POST -H "Authorization: Bearer $TOKEN_STUDENT" -H 'Content-Type: application/json' -d '{}' "$API/teacher-invitation"
neg "GET /auth/reset-password/hash-invalido (deve 400, sem diff de incl/excl)" "400" "$API/auth/reset-password/hash-invalido"
neg "GET /auth/invites/hash-invalido (deve 404)"  "404" "$API/auth/invites/hash-invalido"
} > "$OUT/neg-checks.txt"
cat "$OUT/neg-checks.txt"

# probing de rate limit (o middleware conta ANTES do validador)
log "FASE B: probes de rate limit"
probe(){
  local name=$1 n=$2 path=$3 body="$4" j=$5
  local lim=0 i code
  for i in $(seq 1 "$n"); do
    if [ -n "$body" ]; then
      code=$(curl -s -o /dev/null -w '%{http_code}' -m 10 -X POST "$API$path" -H 'Content-Type: application/json' -d "$body")
    else
      code=$(curl -s -o /dev/null -w '%{http_code}' -m 10 "$API$path")
    fi
    [ "$code" = "429" ] && lim=$((lim+1))
  done
  if [ "$lim" -gt 0 ]; then
    echo "OK    rate-limit $name: $lim x429 em $n tentativas"
  else
    echo "ALERT rate-limit $name: NENHUM 429 em $n tentativas — verificar middleware"
  fi
}
echo "register:     $(probe register 12 /auth/register '{"email":"probe@e2e.invalid","password":"x","nome":"probe"}')" >> "$OUT/rate-limits.txt"
echo "request-reset: $(probe request-reset 13 /auth/reset-password '{"email":"admin@e2e.local"}')" >> "$OUT/rate-limits.txt"
echo "usuario-reset: $(probe usuario-reset 25 /usuario/reset-password '{"token":"x","newPassword":"abcdef"}')" >> "$OUT/rate-limits.txt"  # este NAO TEM rateLimit em modulo usuario
cat "$OUT/rate-limits.txt"

# ---------------------------------------------------------------- FASE C: restaura o seed (testes destrutivos)
log "FASE C: reset seed"
curl -s -o /dev/null -w 'reset HTTP %{http_code}\n' -X POST "$API/__test__/reset"
curl -sf -m 3 "$API/__test__/health" >/dev/null && log "seed restaurado e API saudavel"

# ---------------------------------------------------------------- Sumário
python3 - "$OUT" <<'PYEOF' | tee "$OUT/SUMMARY.txt"
import json, glob, os, sys
out = sys.argv[1]
print("=== RESUMO RED TEAM r2 (boat) ===")
for f in sorted(glob.glob(os.path.join(out, "*.jsonl"))):
    lines = [l for l in open(f, errors="replace") if l.strip()]
    if not lines:
        continue
    print(f"\n-- {os.path.basename(f)}: {len(lines)} achado(s)")
    for l in lines:
        try:
            d = json.loads(l)
        except Exception:
            print("   [parse-error]", l[:120]); continue
        sev = d.get("info", {}).get("severity", "?")
        tid = d.get("template-id", "?")
        name = d.get("info", {}).get("name", "?")
        at = d.get("matched-at") or d.get("host", "?")
        print(f"   [{sev}] {tid} @ {at}\n         {name}")
print("\n(Consultar run.log da FASE A para rc/tempos; neg-checks e rate-limits em arquivos)")
PYEOF
log "FIM. Resultados em $OUT"
