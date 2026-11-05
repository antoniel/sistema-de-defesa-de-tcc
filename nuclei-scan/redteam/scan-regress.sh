#!/bin/bash
# Regressão: só os templates red team custom (rt01..rt11) contra a API de teste.
# Critério: rt01..rt06 NÃO devem casar (fixes); rt10/rt11 devem casar (fora de escopo).
set -uo pipefail
BASE=/home/user/redteam-pgcomp
API=http://localhost:9100
OUT=$BASE/results
BUILD=$BASE/build
NUCLEI=$HOME/bin/nuclei
PASS="senha-e2e-123"
mkdir -p "$OUT" "$BUILD"
exec > "$OUT/regress.log" 2>&1
log(){ echo "[$(date +%H:%M:%S)] $*"; }

for i in $(seq 1 60); do curl -sf -m 2 "$API/__test__/health" >/dev/null 2>&1 && break; sleep 2; done
curl -sf -m 3 "$API/__test__/health" >/dev/null || { log "ERRO: API nao subiu"; exit 1; }
[ -x "$NUCLEI" ] || { log "ERRO: nuclei ausente"; exit 1; }
log "API viva + nuclei ok"

login(){ curl -sf -m 10 -X POST "$API/auth/login" -H 'Content-Type: application/json' -d "{\"email\":\"$1\",\"password\":\"$2\"}" | python3 -c 'import json,sys; print(json.load(sys.stdin)["token"])'; }
TOKEN_STUDENT=$(login student.free@e2e.local "$PASS") || true
TOKEN_TEACHER=$(login teacher3@e2e.local "$PASS") || true
[ -n "${TOKEN_STUDENT:-}" ] && [ -n "${TOKEN_TEACHER:-}" ] || { log "ERRO login"; exit 1; }
log "tokens ok"

for f in "$BASE"/tpl-raw/*.yaml; do
  sed -e "s|{{TOKEN_STUDENT}}|$TOKEN_STUDENT|g" -e "s|{{TOKEN_TEACHER}}|$TOKEN_TEACHER|g" "$f" > "$BUILD/$(basename "$f")"
done
rm -f "$OUT"/regress-custom.jsonl
log "renderizados: $(ls "$BUILD" | wc -l) | scanzando..."
"$NUCLEI" -u "$API" -t "$BUILD" -rl 200 -c 30 -timeout 10 -no-color -silent -j -or -ot -o "$OUT/regress-custom.jsonl" >/dev/null 2>&1
RC=$?
log "rc=$RC achados=$(grep -c . "$OUT/regress-custom.jsonl" 2>/dev/null || echo 0)"

PERFeito=0
for id in rt01 rt02 rt03 rt04 rt05 rt06; do
  if grep -q "$id" "$OUT/regress-custom.jsonl" 2>/dev/null; then log "FALHOU: $id ainda casou"; PERFeito=$((PERFeito+1)); else log "FIXADO: $id sem match"; fi
done
for id in rt10 rt11; do grep -q "$id" "$OUT/regress-custom.jsonl" 2>/dev/null && log "esperado-fora-do-escopo: $id casou (ok)" || log "esperado-fora-do-escopo: $id NAO casou"; done
log "verdict fixes: $PERFeito falha(s)"

python3 - "$OUT" <<'PYEOF' 2>/dev/null | tail -20
import json, glob, os, sys
out = sys.argv[1]
for f in glob.glob(os.path.join(out, "regress-custom.jsonl")):
    for line in open(f, errors="replace"):
        if not line.strip(): continue
        try: d = json.loads(line)
        except: continue
        print(f"[{d.get('info',{}).get('severity')}] {d.get('template-id')} @ {d.get('matched-at')}")
PYEOF

log "reset seed"
curl -s -o /dev/null -w 'reset HTTP %{http_code}\n' -X POST "$API/__test__/reset"
log "FIM regress"
