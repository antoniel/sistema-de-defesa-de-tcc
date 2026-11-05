#!/bin/bash
# Scan prod-exclusive — só leitura/fingerprint contra https://sistema-de-defesas.app.ic.ufba.br
# PROIBIDO por design: default-login, sqli/xss/ssrf/rce/dast/fuzzing/cve, POSTs em rotas de
# negócio, /__test__/reset. Limites: -rl 50 -c 20. Probes de rate limit vão POR ÚLTIMO e
# usam email INEXISTENTE / corpo inválido (nada é criado, nenhum usuário real é afetado).
set -uo pipefail
BASE="$(cd "$(dirname "$0")" && pwd)"
TARGET="${TARGET:-https://sistema-de-defesas.app.ic.ufba.br}"
DOMAIN="${DOMAIN:-app.ic.ufba.br}"
OUT="$BASE/results-prod"
NUCLEI="$HOME/bin/nuclei"
mkdir -p "$OUT"
exec > "$OUT/run.log" 2>&1
log(){ echo "[$(date +%H:%M:%S)] $*"; }

# 0. alvo vivo (GET root apenas)
code=$(curl -s -o /dev/null -w '%{http_code}' -m 20 "$TARGET/" || echo 000)
[ "$code" = "000" ] && { log "ERRO: $TARGET inalcançável"; exit 1; }
log "alvo vivo: $TARGET HTTP $code"

# 1. templates custom prod-exclusive (px01..px10)
log "PX: templates custom"
"$NUCLEI" -u "$TARGET" -t "$BASE/tpl" \
  -rl 50 -c 20 -timeout 15 -retries 1 \
  -no-color -silent -j -or -ot \
  -o "$OUT/px-custom.jsonl" >/dev/null 2>&1
log "PX rc=$? achados=$(grep -c . "$OUT/px-custom.jsonl" 2>/dev/null || echo 0)"

# 2. famílias genéricas read-only (exposure/misconfig/tech — sem default-login!)
log "SAFE: exposure,misconfiguration,technologies,tech"
"$NUCLEI" -u "$TARGET" \
  -tags exposure,misconfiguration,technologies,tech \
  -severity info,low,medium,high,critical \
  -rl 50 -c 20 -timeout 15 -retries 1 \
  -no-color -silent -j -or -ot \
  -o "$OUT/safe-families.jsonl" >/dev/null 2>&1
log "SAFE rc=$? achados=$(grep -c . "$OUT/safe-families.jsonl" 2>/dev/null || echo 0)"

# 3. TLS (só faz sentido em prod)
log "SSL: templates de TLS"
"$NUCLEI" -u "$TARGET" \
  -tags ssl \
  -severity info,low,medium,high \
  -rl 50 -c 20 -timeout 15 -retries 1 \
  -no-color -silent -j -or -ot \
  -o "$OUT/ssl.jsonl" >/dev/null 2>&1
log "SSL rc=$? achados=$(grep -c . "$OUT/ssl.jsonl" 2>/dev/null || echo 0)"

# 4. DNS do domínio (SPF/DMARC/etc)
log "DNS: $DOMAIN"
"$NUCLEI" -u "$DOMAIN" \
  -tags dns \
  -rl 20 -timeout 15 -retries 1 \
  -no-color -silent -j -or -ot \
  -o "$OUT/dns.jsonl" >/dev/null 2>&1
log "DNS rc=$? achados=$(grep -c . "$OUT/dns.jsonl" 2>/dev/null || echo 0)"

# 5. sweep python (cruzamento de leaks + headers raw + DNS DoH + rate limits no fim)
log "SWEEP: cruzamento inteligente + rate-limits (último, email inexistente)"
python3 "$BASE/sweep.py" "$TARGET" > "$OUT/sweep.json" 2>"$OUT/sweep.err"
log "SWEEP rc=$?"

# 6. headers raw HTTPS (evidência complementar)
curl -sI -m 20 "$TARGET/" > "$OUT/headers-raw.txt" 2>&1

# 7. sumário
python3 - "$OUT" <<'PYEOF' | tee "$OUT/SUMMARY.txt"
import json, glob, os, sys
out = sys.argv[1]
print("=== SUMARIO prod-exclusive ===")
for f in sorted(glob.glob(os.path.join(out, "*.jsonl"))):
    lines = [l for l in open(f, errors="replace") if l.strip()]
    print(f"\n-- {os.path.basename(f)}: {len(lines)} achado(s)")
    for l in lines:
        try: d = json.loads(l)
        except Exception: continue
        sev = d.get("info", {}).get("severity", "?")
        tid = d.get("template-id", "?")
        at = d.get("matched-at") or d.get("host") or ""
        name = d.get("info", {}).get("name", "?")
        print(f"   [{sev}] {tid} @ {at}\n         {name}")
sw = os.path.join(out, "sweep.json")
if os.path.exists(sw) and os.path.getsize(sw) > 2:
    s = json.load(open(sw))
    print("\n-- sweep:")
    print(f"   bancas privadas com visible:false no listing anônimo: {s.get('private-bancas')}")
    print(f"   cruzamento de LEAKS reais (privada + 200 em membros): {len(s.get('cross-leaks', []))}")
    for x in s.get("cross-leaks", []):
        print(f"     banca {x['banca']}: {x['what']}")
    print(f"   /__test__/health em prod: HTTP {s.get('detail-teste')} (400/404 esperados)")
    print(f"   rate-limits (429): {json.dumps(s.get('rate-limits', {}))}")
    print(f"   dns (resumo): {json.dumps({k: {kk: sum(1 for vv in v.values() if vv) if isinstance(v, dict) else v for kk, v in val.items()} if isinstance(val, dict) else val for k, val in s.get('dns', {}).items()}, ensure_ascii=False)}")
PYEOF
log "FIM prod-exclusive. Resultados em $OUT"
