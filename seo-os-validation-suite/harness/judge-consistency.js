#!/usr/bin/env node
/**
 * SEO-OS JUDGE CONSISTENCY TEST
 * ------------------------------------------------------------------
 * Measures how deterministic the LLM GRADE phase is. It holds ONE fixed
 * audit-findings file constant (so the AUDIT phase's variance is removed) and
 * re-runs only the GRADE judge N times, then reports the spread:
 *
 *   - totalScore: min / max / mean / stddev / range across runs
 *   - per check id: agreement = how consistently it was marked detected /
 *     actionCorrect across runs (1.0 = unanimous); the least-stable ids are
 *     surfaced as "flapping".
 *   - prioritization.correct and falsePositive counts across runs.
 *
 * Usage:
 *   node harness/judge-consistency.js --audit-json=path [--runs=5]
 *        [--baseline=path] [--matrix=path] [--site=name] [--model=name]
 *        [--md=path] [--min-agreement=0.0] [--max-stddev=Infinity]
 *
 *   --audit-json=path   REQUIRED. Fixed audit findings to grade repeatedly.
 *                       Produce one with the harness, e.g.:
 *                         node harness/run-agent-harness.js --out=runs/r.json
 *                       then feed runs/r.json's `_harness.auditFindings`, or
 *                       any {findings,recommendations,proposedOrder} JSON.
 *   --runs=N            judge repetitions (default 5).
 *   --min-agreement=F   exit 1 if mean per-check agreement < F (default 0 = report).
 *   --max-stddev=N      exit 1 if totalScore stddev > N (default Infinity = report).
 *   --md=path           also write a markdown report.
 *
 * Requirements: `claude` CLI on PATH and authenticated (billed LLM calls — N of them).
 * Deterministic core; only the GRADE calls hit the LLM.
 */
"use strict";
const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { claude, extractJson, buildGradePrompt, baselineCheckIds } = require("./grade-lib");

const SUITE_DIR = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const flag = (name, def) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : def;
};

const auditJsonPath = flag("audit-json", "");
if (!auditJsonPath) {
  console.error(
    "judge-consistency: --audit-json=<path> is required (a fixed findings file to grade repeatedly).\n" +
      "Generate one with `node harness/run-agent-harness.js --out=runs/r.json` and reuse its\n" +
      "`_harness.auditFindings`, or pass any {findings,recommendations,proposedOrder} JSON."
  );
  process.exit(2);
}
const runs = Math.max(2, Number(flag("runs", "5")));
const baselinePath = path.resolve(SUITE_DIR, flag("baseline", "seo-baseline.json"));
const matrixPath = path.resolve(SUITE_DIR, flag("matrix", "decision-matrix.json"));
const model = flag("model", "");
const minAgreement = Number(flag("min-agreement", "0"));
const maxStddev = Number(flag("max-stddev", "Infinity"));
const mdPath = flag("md", "");

const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
const matrix = JSON.parse(fs.readFileSync(matrixPath, "utf8"));
const rawAudit = JSON.parse(fs.readFileSync(path.resolve(auditJsonPath), "utf8"));
// Accept either a raw audit object or a harness run that wraps it.
const auditJson = rawAudit.findings
  ? rawAudit
  : rawAudit._harness && rawAudit._harness.auditFindings;
if (!auditJson || !auditJson.findings) {
  console.error(`judge-consistency: ${auditJsonPath} has no \`findings\` (and no _harness.auditFindings).`);
  process.exit(2);
}
const siteName = flag("site", auditJson.site || path.basename(SUITE_DIR));

function scoreOutput(output) {
  const tmp = path.join(os.tmpdir(), `seo-os-judge-tmp-${process.pid}.json`);
  fs.writeFileSync(tmp, JSON.stringify(output));
  try {
    return JSON.parse(
      execFileSync(
        process.execPath,
        [path.join(SUITE_DIR, "seo-os-scorer.js"), tmp, `--baseline=${baselinePath}`, `--matrix=${matrixPath}`],
        { cwd: SUITE_DIR, encoding: "utf8" }
      )
    );
  } finally {
    fs.rmSync(tmp, { force: true });
  }
}

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const stddev = (xs) => {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
};

// ---------------------------------------------------------------- run N judges
const prompt = buildGradePrompt(auditJson, { baseline, matrix, siteName });
const checkIds = baselineCheckIds(baseline);
const results = [];
for (let i = 0; i < runs; i++) {
  console.error(`[judge-consistency] GRADE run ${i + 1}/${runs} …`);
  const graded = extractJson(claude(prompt, SUITE_DIR, { model }));
  const score = scoreOutput(graded);
  results.push({
    detected: new Set(graded.detected || []),
    actionCorrect: new Set(graded.actionCorrect || []),
    falsePositiveCount: (graded.falsePositives || []).length,
    prioritizationCorrect: !!(graded.prioritization && graded.prioritization.correct),
    totalScore: score.totalScore,
  });
}

// ---------------------------------------------------------------- aggregate
// Per-check agreement: fraction of runs that agree with the majority verdict.
function fieldAgreement(field) {
  return checkIds.map((id) => {
    const yes = results.filter((r) => r[field].has(id)).length;
    const majority = Math.max(yes, runs - yes);
    return { id, yes, agreement: majority / runs };
  });
}
const detectedAgree = fieldAgreement("detected");
const actionAgree = fieldAgreement("actionCorrect");
// Mean agreement is computed over the CONTESTED set only: ids marked in at
// least one run. Unanimously-absent ids score 1.0 by construction and would
// otherwise dominate the mean, inflating it toward 1.0 and making the
// --min-agreement gate inert.
const contested = [...detectedAgree, ...actionAgree].filter((c) => c.yes > 0);
const meanAgreement = contested.length ? mean(contested.map((c) => c.agreement)) : 1;
const flapping = [...detectedAgree.map((c) => ({ ...c, field: "detected" })),
                  ...actionAgree.map((c) => ({ ...c, field: "actionCorrect" }))]
  .filter((c) => c.agreement < 1)
  .sort((a, b) => a.agreement - b.agreement);

const scores = results.map((r) => r.totalScore);
const fps = results.map((r) => r.falsePositiveCount);
const prioTrue = results.filter((r) => r.prioritizationCorrect).length;
const scoreStddev = Number(stddev(scores).toFixed(2));

const report = {
  runs,
  auditInput: path.relative(SUITE_DIR, path.resolve(auditJsonPath)),
  baseline: path.relative(SUITE_DIR, baselinePath),
  matrix: path.relative(SUITE_DIR, matrixPath),
  model: model || "default",
  totalScore: { min: Math.min(...scores), max: Math.max(...scores), mean: Number(mean(scores).toFixed(2)), stddev: scoreStddev, range: Math.max(...scores) - Math.min(...scores), values: scores },
  meanCheckAgreement: Number(meanAgreement.toFixed(3)),
  contestedChecks: contested.length,
  prioritizationCorrect: `${prioTrue}/${runs}`,
  falsePositiveCounts: fps,
  flapping: flapping.map((c) => `${c.field}:${c.id} (${c.yes}/${runs} → agree ${c.agreement.toFixed(2)})`),
};

console.log(JSON.stringify(report, null, 2));

if (mdPath) {
  const md = [
    `# Judge consistency — ${siteName}`,
    ``,
    `- runs: **${runs}**, model: \`${report.model}\`, input: \`${report.auditInput}\``,
    `- totalScore: min ${report.totalScore.min} / mean ${report.totalScore.mean} / max ${report.totalScore.max} (stddev ${report.totalScore.stddev}, range ${report.totalScore.range})`,
    `- mean per-check agreement (contested set, ${report.contestedChecks} datapoints): **${report.meanCheckAgreement}**`,
    `- prioritization.correct: ${report.prioritizationCorrect} · falsePositive counts: ${fps.join(", ")}`,
    ``,
    `## Flapping checks (non-unanimous)`,
    flapping.length ? flapping.map((c) => `- \`${c.field}:${c.id}\` — ${c.yes}/${runs} runs (agreement ${c.agreement.toFixed(2)})`).join("\n") : "_none — every check id was unanimous across runs._",
    ``,
  ].join("\n");
  fs.writeFileSync(path.resolve(mdPath), md);
  console.error(`[judge-consistency] markdown -> ${mdPath}`);
}

// ---------------------------------------------------------------- gate
const failures = [];
if (report.meanCheckAgreement < minAgreement)
  failures.push(`mean agreement ${report.meanCheckAgreement} < min-agreement ${minAgreement}`);
if (scoreStddev > maxStddev)
  failures.push(`score stddev ${scoreStddev} > max-stddev ${maxStddev}`);
if (failures.length) {
  failures.forEach((f) => console.error(`[judge-consistency] FAIL — ${f}`));
  process.exit(1);
}
console.error(`[judge-consistency] OK — mean agreement ${report.meanCheckAgreement}, score stddev ${scoreStddev}`);
