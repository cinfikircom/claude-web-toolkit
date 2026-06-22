#!/usr/bin/env node
/**
 * SEO-OS E2E AGENT-RUN HARNESS
 * ------------------------------------------------------------------
 * Runs the SEO-OS audit end-to-end with REAL LLM calls and feeds the
 * result to the deterministic scorer:
 *
 *   1. AUDIT  — `claude -p` runs a BLIND audit of the golden site
 *               (no check ids / answer key leaked) and returns free-form
 *               findings as JSON.
 *   2. GRADE  — a second `claude -p` call (LLM judge) maps the findings
 *               to baseline check ids + expert expected actions and emits
 *               an agent-output-v1 JSON (detected / actionCorrect /
 *               falsePositives / prioritization).
 *   3. SCORE  — seo-os-scorer.js grades the output (deterministic).
 *
 * Usage:
 *   node harness/run-agent-harness.js [--site=path] [--model=name]
 *        [--out=path] [--min-score=N] [--audit-json=path] [--dry-run]
 *
 *   --site=path        fixture to audit (default: ../golden-seo-test-site)
 *   --baseline=path    baseline json (default: ../seo-baseline.json)
 *   --matrix=path      decision matrix (default: ../decision-matrix.json)
 *   --model=name       forwarded to `claude --model`
 *   --out=path         where to write the graded output
 *                      (default: harness/runs/run-<timestamp>.json)
 *   --min-score=N      exit 1 if totalScore < N (default: 0 = report only)
 *   --audit-json=path  skip the AUDIT phase, grade an existing findings file
 *   --dry-run          print the audit prompt and exit (no LLM calls)
 *
 * Requirements: `claude` CLI on PATH and authenticated (billed LLM calls).
 * LLM phases are slightly non-deterministic — compare real runs with the
 * `tolerance` fields in golden-tests/expected-score.json, not with 0.
 */
"use strict";
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { claude, extractJson, AUDIT_PROMPT, buildGradePrompt } = require("./grade-lib");

const SUITE_DIR = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const flag = (name, def) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : def;
};
const has = (name) => args.includes(`--${name}`);

const sitePath = path.resolve(SUITE_DIR, flag("site", "golden-seo-test-site"));
const baselinePath = path.resolve(SUITE_DIR, flag("baseline", "seo-baseline.json"));
const matrixPath = path.resolve(SUITE_DIR, flag("matrix", "decision-matrix.json"));
const model = flag("model", "");
const minScore = Number(flag("min-score", "0"));
const outPath = path.resolve(
  SUITE_DIR,
  flag("out", path.join("harness", "runs", `run-${Date.now()}.json`))
);

const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
const matrix = JSON.parse(fs.readFileSync(matrixPath, "utf8"));
const siteName = path.basename(sitePath);

// ---------------------------------------------------------------- main
if (has("dry-run")) {
  console.log(AUDIT_PROMPT);
  process.exit(0);
}

let auditJson;
const auditJsonPath = flag("audit-json", "");
if (auditJsonPath) {
  auditJson = JSON.parse(fs.readFileSync(path.resolve(auditJsonPath), "utf8"));
  console.error(`[harness] AUDIT phase skipped — using ${auditJsonPath}`);
} else {
  if (!fs.existsSync(sitePath)) throw new Error(`site fixture not found: ${sitePath}`);
  console.error(`[harness] AUDIT — blind LLM audit of ${sitePath} …`);
  auditJson = extractJson(claude(AUDIT_PROMPT, sitePath, { model }));
  console.error(`[harness] AUDIT done — ${auditJson.findings.length} findings`);
}

console.error("[harness] GRADE — LLM judge mapping findings to check ids …");
const graded = extractJson(
  claude(buildGradePrompt(auditJson, { baseline, matrix, siteName }), SUITE_DIR, { model })
);

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(
  outPath,
  JSON.stringify({ ...graded, _harness: { auditFindings: auditJson, gradedAt: new Date().toISOString(), model: model || "default" } }, null, 2)
);
console.error(`[harness] graded output -> ${outPath}`);

console.error("[harness] SCORE — deterministic scorer …");
const scoreRaw = execFileSync(
  process.execPath,
  [
    path.join(SUITE_DIR, "seo-os-scorer.js"),
    outPath,
    `--baseline=${baselinePath}`,
    `--matrix=${matrixPath}`,
  ],
  { cwd: SUITE_DIR, encoding: "utf8" }
);
console.log(scoreRaw);
const score = JSON.parse(scoreRaw);

if (minScore > 0 && score.totalScore < minScore) {
  console.error(`[harness] FAIL — totalScore ${score.totalScore} < min-score ${minScore}`);
  process.exit(1);
}
console.error(`[harness] OK — totalScore ${score.totalScore}`);
