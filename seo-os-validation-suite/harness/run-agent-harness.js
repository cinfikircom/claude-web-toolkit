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
const { execFileSync, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

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

// ---------------------------------------------------------------- helpers
function claude(prompt, cwd) {
  const cliArgs = ["-p", prompt];
  if (model) cliArgs.push("--model", model);
  const res = spawnSync("claude", cliArgs, {
    cwd,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    timeout: 15 * 60 * 1000,
  });
  if (res.error) {
    if (res.error.code === "ENOENT")
      throw new Error("`claude` CLI not found on PATH — install/authenticate Claude Code first.");
    throw res.error;
  }
  if (res.status !== 0)
    throw new Error(`claude exited ${res.status}:\n${res.stderr || res.stdout}`);
  return res.stdout;
}

// Extract the first balanced top-level JSON object from LLM text output.
function extractJson(text) {
  const start = text.indexOf("{");
  if (start === -1) throw new Error("no JSON object in LLM output:\n" + text.slice(0, 500));
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (esc) { esc = false; continue; }
    if (ch === "\\") { esc = inStr; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === "{") depth++;
    if (ch === "}" && --depth === 0) return JSON.parse(text.slice(start, i + 1));
  }
  throw new Error("unbalanced JSON in LLM output:\n" + text.slice(0, 500));
}

// ---------------------------------------------------------------- prompts
const auditPrompt = `You are SEO-OS running in ANALYZE mode. Audit the website source code in the current directory for SEO, GEO (generative engine optimization / AI-citability), Schema.org structured data, and Core Web Vitals issues.

Rules:
- READ-ONLY analysis. Do not modify any file.
- Report every concrete issue you find with the fix you would propose.
- Also list any broader optimization recommendations you would make.
- Propose the order in which you would execute the work and why.

Respond with ONLY a JSON object (no markdown fences, no prose) in exactly this shape:
{
  "findings": [ { "issue": "<what is wrong, where>", "proposedAction": "<the fix you propose>" } ],
  "recommendations": [ "<each broader optimization you recommend>" ],
  "proposedOrder": "<one paragraph: execution order and rationale>"
}`;

function gradePrompt(auditJson) {
  const checks = Object.values(baseline.categories).flatMap((c) =>
    c.checks.map((k) => ({ id: k.id, desc: k.desc }))
  );
  const expected = (matrix.decisions || [])
    .filter((d) => (d.type || "detection") === "detection")
    .map((d) => ({ checkId: d.checkId, expectedAction: d.expectedAction }));
  const prioritization = (matrix.decisions || []).find((d) => d.type === "prioritization");

  return `You are a strict SEO evaluation judge. Grade an SEO agent's audit findings against an expert baseline.

BASELINE CHECKS (the full universe of issue ids):
${JSON.stringify(checks, null, 2)}

EXPERT EXPECTED ACTIONS (per check id, where defined):
${JSON.stringify(expected, null, 2)}

EXPERT EXPECTED PRIORITIZATION: ${prioritization ? prioritization.expectedAction : "n/a"}

AGENT AUDIT TO GRADE:
${JSON.stringify(auditJson, null, 2)}

Grading rules:
- "detected": check ids whose underlying issue the agent reported in findings (semantic match, not literal).
- "actionCorrect": subset of detected where the agent's proposedAction substantively matches the expert expected action (or, if no expert action is listed for that id, is a professionally correct fix).
- "missed": baseline check ids not detected.
- "falsePositives": findings/recommendations that are unnecessary, harmful, or out of scope (e.g. framework migrations, deprecated tech like AMP). Copy the agent's own wording.
- "prioritization": { "correct": true|false, "summary": "<agent's order in one line>" } — correct if it matches the expert expected prioritization.

Respond with ONLY a JSON object (no markdown fences, no prose):
{
  "$schema": "seo-os-validation/agent-output-v1",
  "site": "${path.basename(sitePath)}",
  "mode": "ANALYZE",
  "detected": [],
  "actionCorrect": [],
  "missed": [],
  "falsePositives": [],
  "prioritization": { "correct": false, "summary": "" }
}`;
}

// ---------------------------------------------------------------- main
if (has("dry-run")) {
  console.log(auditPrompt);
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
  auditJson = extractJson(claude(auditPrompt, sitePath));
  console.error(`[harness] AUDIT done — ${auditJson.findings.length} findings`);
}

console.error("[harness] GRADE — LLM judge mapping findings to check ids …");
const graded = extractJson(claude(gradePrompt(auditJson), SUITE_DIR));

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
