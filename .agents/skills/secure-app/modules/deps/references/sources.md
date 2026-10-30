# Referências de fontes de dados (keyless) e validação

## Fontes por ecossistema

### JS/TS (npm/pnpm/yarn/bun)
- **`npm audit --omit=dev --json`** — consulta o GitHub Advisory Database via registry,
  casando versão exata da lockfile. Canal preferido para este ecossistema: o match de versão
  é feito pela própria ferramenta contra a lockfile real.
- **OSV.dev**: `POST api.osv.dev/v1/query` (`{"package":{"ecosystem":"npm","name","version"}}`)
  por pacote — recordes completos. `/v1/querybatch` aceita até 100 por request, mas retorna
  **stubs** (id+modified): sempre enriqueça via `/v1/vulns/<id>` antes de classificar.
- **GitHub Advisory por id**: `github.com/advisories/GHSA-…` (página) ou a API de advisories
  — referência primária com CVSS, EPSS, range e fix.

### PHP (Composer)
- `composer audit` (via API de Packagist); `roave/security-advisories` como lista compilada.
- OSV.dev com ecosystem `composer`.

### Rust
- `cargo audit` (RustSec database); OSV.dev com ecosystem `crates.io`.

### Python
- `pip-audit` (PyPI Vulnerability API + OSV); OSV.dev com ecosystem `pypi`.

### Go
- `govulncheck` (vuln.go.dev — inclui análise de alcançabilidade por símbolo, útil para o
  passo de triagem); OSV.dev com ecosystem `go`.

### Enriquecimento (todos)
- **NVD** (`services.nvd.nist.gov`): CVSS oficial, CPE — sem chave com rate limit baixo.
- **CISA KEV** (`www.cisa.gov` feed JSON): explorado ativamente no mundo — prioriza.
- **CVE.org** (`cveawg.mitre.org`): registro primário do CNA.

## Protocolo de validação (resumo executável)

```text
1. Amostra de sanidade: pegue 1 pacote estável com versão pós-fix conhecida.
   Consulte o canal com as versões ANTES e DEPOIS do fix.
   → Respostas idênticas? Canal não filtra versão: DESCARTE.
2. Sinais de podridão: volume implausível + summary/severity/fixed vazios em massa
   + incoerência com o registro primário. → DESCARTE e anote.
3. Referência cruzada: 1–2 hits confirmados no registro primário
   (/v1/vulns/<id> ou página do advisory) — range bate com a nossa versão?
4. Prefira sempre: canal oficial do ecossistema + lockfile real
   > API agnóstica suspeita.
5. Relatório lista: fonte usada, fontes descartadas e o motivo da descarta.
```

## Caso real documentado (para calibrar expectativa)

Em uma execução real (out/2026), `api.osv.dev/v1/querybatch` deste ambiente respondeu 173
"vulnerabilidades" para ~70 deps — com summaries vazios e resposta IDÊNTICA (52 hits) para
qualquer versão do pacote de teste, incluindo versões posteriores aos fixes declarados nos
próprios registros (`/v1/vulns` retornava `fixed: 4.6.5` para uma consulta de versão 4.8.5).
O canal foi descartado; o scan foi concluído com `npm audit` (match de versão correto,
49 achados reais) com referência cruzada em `/v1/vulns/<id>`. Conclusão: nunca pule a
validação — o custo é baixo e o falso positivo em massa custa horas de triagem inútil
(pior: patches cegos podem quebrar a aplicação).
