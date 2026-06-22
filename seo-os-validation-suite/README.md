# SEO-OS Validation Suite

An objective **benchmarking environment** for the SEO-OS agent system (the `seo-geo-optimizer`
plugin). It measures detection accuracy, prioritization intelligence, GEO-readiness generation,
schema reasoning, and decision quality vs an expert baseline.

> ⚠️ This is **NOT a production website.** `golden-seo-test-site/` is **broken by design**.
> Do not fix, optimize, or "clean" it — the failures are the test.

## Components
| Path | Role |
|------|------|
| `golden-seo-test-site/` | Broken-by-design Next.js (App Router) site — 5 pages with injected SEO/GEO/Schema/CWV failures |
| `fixtures/` | Additional broken-by-design variants: e-commerce, multilingual (EN/TR/DE), Cloudflare Pages — each with its own answer key, baseline and matrix |
| `seo-baseline.json` | Gold-standard correct state + 4×25 category checks |
| `seo-os-scorer.js` | 0–100 scoring engine (SEO/GEO/Schema/Performance); `--baseline=` / `--matrix=` flags for fixtures |
| `decision-matrix.json` | Expert decision expectations (v2) — the scorer derives correctness dynamically from the graded output |
| `geo-simulation.json` | Mock AI-visibility simulation (ChatGPT/Perplexity/Gemini/AI Overviews) |
| `sample-seo-os-output.json` | Example agent output (replace with a real run) |
| `INJECTED-ISSUES.md` | Answer key: every intentional failure, per page |
| `golden-tests/expected-score.json` | Committed scoring baseline for CI regression |
| `golden-tests/check-regression.js` | Runs the scorer, compares vs baseline with per-field tolerance; exit 1 on regression |
| `harness/run-agent-harness.js` | E2E real-LLM run: blind AUDIT (`claude -p`) → LLM-judge GRADE → deterministic SCORE |
| `lighthouse-runner.js` | REAL CWV measurement: local `npx lighthouse` or PSI API; compares vs `performanceTargets` |
| `delta-report.js` | Before/after scoring delta (total/category/decision moves) + optional markdown report |

## How to run a validation
1. **Run the SEO-OS agent in ANALYZE mode** against `golden-seo-test-site/` and capture its audit as
   an output JSON matching `sample-seo-os-output.json` (fields: `detected`, `actionCorrect`, `missed`,
   `falsePositives`, `prioritization`).
2. **Score it:**
   ```bash
   cd seo-os-validation-suite
   node seo-os-scorer.js path/to/real-seo-os-output.json
   # (no arg -> uses sample-seo-os-output.json)
   # fixtures: --baseline=fixtures/<name>/baseline.json --matrix=fixtures/<name>/decision-matrix.json
   ```
3. Read `totalScore` + `breakdown` + `correctDecisions`/`wrongDecisions`. Decision correctness is
   derived dynamically (matrix v2): `detection` entries from `detected`, `prioritization` from
   `output.prioritization.correct`, `false-positive-trap` entries from regex matches over
   `output.falsePositives`.
4. Compare GEO read against `geo-simulation.json` (expected LOW before optimization).

## E2E real-LLM run (harness)
```bash
cd seo-os-validation-suite
node harness/run-agent-harness.js                  # golden site, report only
node harness/run-agent-harness.js --min-score=60   # gate on threshold
node harness/run-agent-harness.js --site=fixtures/ecommerce-broken-site \
  --baseline=fixtures/ecommerce-broken-site/baseline.json \
  --matrix=fixtures/ecommerce-broken-site/decision-matrix.json
```
Blind AUDIT (`claude -p`, no answer key leaked) → LLM-judge GRADE → deterministic SCORE.
Requires an authenticated `claude` CLI (billed). In CI it runs as the manually-dispatched
`agent-run` workflow (`ANTHROPIC_API_KEY` secret). Outputs land in `harness/runs/` (gitignored).

## Real CWV measurement (Lighthouse / PSI)
```bash
node lighthouse-runner.js --start                      # boots golden site, measures, kills it
node lighthouse-runner.js --url=http://localhost:3000  # already-running site
node lighthouse-runner.js --psi --url=https://example.com   # deployed; PSI_API_KEY optional
```
Compares LCP/CLS/TTFB (+TBT as the lab INP proxy; PSI adds CrUX field INP) against
`performanceTargets`; writes a PASS/FAIL report to `cwv-reports/` (gitignored). `--enforce` exits 1 on miss.

## Before/after delta
```bash
node delta-report.js before-output.json after-output.json --md=delta.md
```
Reports score/category/decision deltas + newly-fixed / newly-detected / regressed check ids.

## Golden regression (runs in CI on every PR)
```bash
cd seo-os-validation-suite
node golden-tests/check-regression.js                 # uses sample-seo-os-output.json
node golden-tests/check-regression.js real-run.json   # or a real agent run
```
Compares the scorer result against `golden-tests/expected-score.json`. Tolerance is **0** while
the input is the static sample (scorer is deterministic); raise per-field `tolerance` only when
the input becomes a real agent run. If you intentionally change the scorer/baseline/sample,
**update `expected-score.json` in the same PR** and explain why.
> The end-to-end "run the SEO-OS agent in CI" harness (LLM call) is a separate roadmap item —
> this check covers the deterministic half (scoring + decision aggregation).

## Scoring model (0–100)
SEO Accuracy 25 · GEO Readiness 25 · Schema Correctness 25 · Performance Logic 25.
Each category = 5 checks × 5 pts. Full points when detected **and** correct action proposed; half
when detected only; zero when missed. Decision correctness is aggregated from `decision-matrix.json`.

## Optional: run the golden site
```bash
cd golden-seo-test-site && npm install && npm run dev
```
Drop large unoptimized placeholder JPEGs into `public/images/` (see its README) to avoid 404s —
**keep them large/unoptimized** to preserve the LCP/CLS failures.

## Expected baseline verdict (broken state)
- **GEO readiness:** LOW · **Core Web Vitals risk:** HIGH · **Schema:** broken @id graph, no sameAs.
