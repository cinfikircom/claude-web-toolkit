#!/usr/bin/env node
/**
 * SEO-OS SCORING ENGINE (0-100)
 * ------------------------------------------------------------------
 * Evaluates an SEO-OS agent audit output against the gold baseline,
 * and derives decision correctness DYNAMICALLY from the graded output
 * using the expert expectations in the decision matrix (v2).
 *
 * Usage:
 *   node seo-os-scorer.js [path/to/seo-os-output.json] [--baseline=path] [--matrix=path]
 *   (defaults: ./sample-seo-os-output.json, ./seo-baseline.json, ./decision-matrix.json)
 *
 * Decision derivation (matrix v2 — no static `correct` fields):
 *   - detection:           correct if checkId ∈ output.detected
 *   - prioritization:      correct if output.prioritization.correct === true
 *   - false-positive-trap: correct if NO output.falsePositives entry matches
 *                          any `match` regex (case-insensitive)
 *
 * No external dependencies. Pure Node.
 */
const fs = require("fs");
const path = require("path");

const DIR = __dirname;
// suite files are resolved next to this script; path args may also be absolute
// or relative to the caller's CWD
const readSuiteFile = (f) => {
  for (const candidate of [path.resolve(f), path.resolve(DIR, f)]) {
    if (fs.existsSync(candidate)) return JSON.parse(fs.readFileSync(candidate, "utf8"));
  }
  throw new Error(`file not found: ${f}`);
};

const args = process.argv.slice(2);
const flag = (name, def) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : def;
};
const positional = args.filter((a) => !a.startsWith("--"));

const baselinePath = flag("baseline", "seo-baseline.json");
const matrixPath = flag("matrix", "decision-matrix.json");
const outputPath = positional[0] || "sample-seo-os-output.json";

const baseline = readSuiteFile(baselinePath);
const matrix = readSuiteFile(matrixPath);
const output = readSuiteFile(outputPath);

const detected = new Set(output.detected || []);
const actionCorrect = new Set(output.actionCorrect || []);
const PER = baseline.scoring.perCheckPoints; // 5

const errors = [];
const warnings = [];
const breakdown = {};

for (const [cat, def] of Object.entries(baseline.categories)) {
  let pts = 0;
  for (const check of def.checks) {
    if (actionCorrect.has(check.id)) {
      pts += PER; // detected AND correct action
    } else if (detected.has(check.id)) {
      pts += PER / 2; // detected only
      warnings.push(`${check.id}: detected but no/incorrect action proposed`);
    } else {
      // missed
      (check.severity === "high" ? errors : warnings).push(
        `${check.id}: MISSED (${check.severity}) — ${check.desc}`
      );
    }
  }
  breakdown[cat] = Math.round(pts);
}

// False positives (unnecessary optimizations) penalize lightly + are surfaced
const falsePositives = output.falsePositives || [];
for (const fp of falsePositives) warnings.push(`FALSE POSITIVE: ${fp}`);

// Decision correctness: derived from the graded output per matrix v2 entry type
const correctDecisions = [];
const wrongDecisions = [];
for (const e of matrix.decisions || []) {
  let correct;
  let seoOSAction;
  const type = e.type || "detection";

  if (type === "detection") {
    if (actionCorrect.has(e.checkId)) {
      correct = true;
      seoOSAction = "detected; correct action proposed";
    } else if (detected.has(e.checkId)) {
      correct = true;
      seoOSAction = "detected (action missing/incorrect)";
    } else {
      correct = false;
      seoOSAction = "not reported (false negative)";
    }
  } else if (type === "prioritization") {
    const prio = output.prioritization || {};
    correct = prio.correct === true;
    seoOSAction = prio.summary || (correct ? "correct order" : "not reported / incorrect order");
  } else if (type === "false-positive-trap") {
    const regexes = (e.match || []).map((p) => new RegExp(p, "i"));
    const hit = falsePositives.find((fp) => regexes.some((re) => re.test(fp)));
    correct = !hit;
    seoOSAction = hit ? `TRAP TRIGGERED: ${hit}` : "trap avoided";
  } else {
    correct = false;
    seoOSAction = `unknown decision type "${type}"`;
  }

  (correct ? correctDecisions : wrongDecisions).push(
    `[${e.severity}] ${e.issue}: expected "${e.expectedAction}" | seo-os "${seoOSAction}"`
  );
}

const totalScore = Object.values(breakdown).reduce((a, b) => a + b, 0);
const decisionTotal = (matrix.decisions || []).length;

const result = {
  totalScore,
  breakdown: {
    seo: breakdown.seo,
    geo: breakdown.geo,
    schema: breakdown.schema,
    performance: breakdown.performance,
  },
  errors,
  warnings,
  correctDecisions,
  wrongDecisions,
  meta: {
    output: outputPath,
    baseline: baselinePath,
    matrix: matrixPath,
    falsePositiveCount: falsePositives.length,
    decisionAccuracy: decisionTotal
      ? Math.round((correctDecisions.length / decisionTotal) * 100) + "%"
      : "n/a",
  },
};

console.log(JSON.stringify(result, null, 2));
module.exports = { score: () => result };
