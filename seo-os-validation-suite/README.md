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
| `seo-baseline.json` | Gold-standard correct state + 4×25 category checks |
| `seo-os-scorer.js` | 0–100 scoring engine (SEO/GEO/Schema/Performance) |
| `decision-matrix.json` | Expert vs SEO-OS decision comparison (detection / prioritization / false +/−) |
| `geo-simulation.json` | Mock AI-visibility simulation (ChatGPT/Perplexity/Gemini/AI Overviews) |
| `sample-seo-os-output.json` | Example agent output (replace with a real run) |
| `INJECTED-ISSUES.md` | Answer key: every intentional failure, per page |

## How to run a validation
1. **Run the SEO-OS agent in ANALYZE mode** against `golden-seo-test-site/` and capture its audit as
   an output JSON matching `sample-seo-os-output.json` (fields: `detected`, `actionCorrect`, `missed`, `falsePositives`).
2. **Score it:**
   ```bash
   cd seo-os-validation-suite
   node seo-os-scorer.js path/to/real-seo-os-output.json
   # (no arg -> uses sample-seo-os-output.json)
   ```
3. Read `totalScore` + `breakdown` + `correctDecisions`/`wrongDecisions`.
4. Compare GEO read against `geo-simulation.json` (expected LOW before optimization).

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
