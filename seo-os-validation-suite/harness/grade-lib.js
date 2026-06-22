"use strict";
/**
 * Shared LLM-grading primitives for the E2E harness and the judge-consistency
 * tool. Keeping the `claude` shell-out, JSON extraction and the AUDIT/GRADE
 * prompts in one place means both tools grade identically.
 *
 * Pure Node core; `claude()` shells out to the authenticated Claude Code CLI.
 */
const { spawnSync } = require("child_process");

// Run a single `claude -p` call and return its stdout.
function claude(prompt, cwd, { model = "" } = {}) {
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

const AUDIT_PROMPT = `You are SEO-OS running in ANALYZE mode. Audit the website source code in the current directory for SEO, GEO (generative engine optimization / AI-citability), Schema.org structured data, and Core Web Vitals issues.

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

// Build the GRADE (LLM-judge) prompt that maps audit findings to baseline
// check ids using the expert expectations in the decision matrix.
function buildGradePrompt(auditJson, { baseline, matrix, siteName }) {
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
  "site": "${siteName}",
  "mode": "ANALYZE",
  "detected": [],
  "actionCorrect": [],
  "missed": [],
  "falsePositives": [],
  "prioritization": { "correct": false, "summary": "" }
}`;
}

// All baseline check ids in declaration order (the grading universe).
function baselineCheckIds(baseline) {
  return Object.values(baseline.categories).flatMap((c) => c.checks.map((k) => k.id));
}

module.exports = { claude, extractJson, AUDIT_PROMPT, buildGradePrompt, baselineCheckIds };
