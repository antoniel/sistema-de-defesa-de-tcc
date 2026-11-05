#!/usr/bin/env python3
"""Sweep read-only na prod + cruzamento de vazamentos + DNS (DoH) + limites de rota.

Regras: SOMENTE GET, sem token, sem payload. POSTs apenas nos probes de limite
(email SEMPRE inexistente / corpo sempre inválido — nada é criado no banco).
"""
import json
import sys
import time
import urllib.request
import urllib.error

TARGET = sys.argv[1].rstrip("/")
DOMAINS = ["app.ic.ufba.br", "sistema-defesas.app.ic.ufba.br", "sistema-de-defesas.app.ic.ufba.br"]
UA = "sisdef-prod-exclusive-scan/1.0 (security scan autorizado)"
out = {"cross-leaks": [], "private-bancas": [], "public-bancas": 0, "detail-teste": None}

def get(path, timeout=15):
    req = urllib.request.Request(TARGET + path, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read().decode("utf-8", "replace"), dict(r.headers)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace") if e.fp else "", dict(e.headers)
    except Exception as e:
        return None, str(e), {}

# varredura inteligente de visibilidade (banca 1..30)
for n in range(1, 31):
    code, body, _ = get(f"/banca/{n}")
    if code != 200:
        continue
    visible_true = '"visible"' in body and '"visible": false' not in body and '"visible":false' not in body
    if ("\"visible\"" not in body) and ("\"visible\":true" not in body):
        visible_true = '"visible"' in body
    if '"visible"' not in body:
        continue
    if '"visible": false' in body or '"visible":false' in body:
        out["private-bancas"].append(n)
        # prova definitiva de vazamento de membros (read-only)
        c2, b2, _ = get(f"/banca/{n}/usuarios")
        if c2 == 200:
            out["cross-leaks"].append({"banca": n, "what": "usuarios-membros-de-banca-privada", "evidence": b2[:400]})
        time.sleep(0.25)
    else:
        out["public-bancas"] += 1
    time.sleep(0.15)

# rotas de controle de teste NUNCA devem existir na prod (só GET; /reset NUNCA é tocado)
c, _, _ = get("/__test__/health")
out["detail-teste"] = c

# DNS via DoH (sem depender de dig)
def doh(name, rtype="TXT"):
    url = f"https://dns.google/resolve?name={name}&type={rtype}"
    try:
        with urllib.request.urlopen(url, timeout=10) as r:
            return json.loads(r.read().decode())
    except Exception:
        return {}
out["dns"] = {}
for d in DOMAINS:
    d = d.strip()
    out["dns"][d] = {}
    for label, typ in [("TXT/root", (d, "TXT")), ("SPF", (d, "TXT")), ("DMARC", (f"_dmarc.{d}", "TXT")), ("MX", (d, "MX"))]:
        name, rtype = typ
        resp = doh(name, rtype)
        answers = [a.get("data") for a in resp.get("Answer", [])]
        if label == "SPF":
            answers = [a for a in answers if "v=spf" in str(a).lower()] if answers else answers
        out["dns"][d][label] = answers

# probes de LIMITE DE ROTA — passo final deliberado; email inexistente, corpo inválido
def post(path, body):
    data = json.dumps(body).encode()
    req = urllib.request.Request(TARGET + path, data=data, headers={"User-Agent": UA, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception:
        return None

out["rate-limits"] = {}
for name, path, body, n in [
    ("login-email-inexistente", "/auth/login", {"email": "rate-probe@e2e.invalid", "password": "probeamines"}, 12),
    ("register-corpo-invalido", "/auth/register", {"email": "rate-probe@e2e.invalid", "password": "x", "nome": "probe"}, 10),
    ("reset-email-inexistente", "/auth/reset-password", {"email": "rate-probe@e2e.invalid"}, 10),
]:
    cnt = 0
    for _ in range(n):
        if post(path, body) == 429:
            cnt += 1
        time.sleep(0.2)
    out["rate-limits"][name] = cnt

print(json.dumps(out, ensure_ascii=False, indent=1))
