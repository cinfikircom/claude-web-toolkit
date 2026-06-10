#!/usr/bin/env node
/**
 * SEO-OS SCORING ENGINE (0-100)
 * ------------------------------------------------------------------
 * Evaluates an SEO-OS agent audit output against the gold baseline,
 * and aggregates decision correctness from the decision matrix.
 *
 * Usage:
 *   node seo-os-scorer.js [path/to/seo-os-output.json]
 *   (defaults to ./sample-seo-os-output.json)
 *
 * Inputs (same directory):
 *   - seo-baseline.json     (gold checks, 4 x 25)
 *   - decision-matrix.json  (expert vs SEO-OS decisions)
 *   - <output.json>         (agent run: detected / actionCorrect / missed / falsePositives)
 *
 * No external dependencies. Pure Node.
 */
const fs = require("fs");
const path = require("path");

const DIR = __dirname;
// suite files are resolved next to this script; the output arg may also be an
// absolute path or relative to the caller's CWD
const read = (f) => JSON.parse(fs.readFileSync(path.resolve(DIR, f), "utf8"));
const readOutput = (f) => {
  for (const candidate of [path.resolve(f), path.resolve(DIR, f)]) {
    if (fs.existsSync(candidate)) return JSON.parse(fs.readFileSync(candidate, "utf8"));
  }
  throw new Error(`output file not found: ${f}`);
};

const baseline = read("seo-baseline.json");
const matrix = read("decision-matrix.json");
const outputPath = process.argv[2] || "sample-seo-os-output.json";
const output = readOutput(outputPath);

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

// Decision correctness from the matrix
const correctDecisions = [];
const wrongDecisions = [];
for (const e of matrix.decisions || []) {
  (e.correct ? correctDecisions : wrongDecisions).push(
    `[${e.severity}] ${e.issue}: expected "${e.expectedAction}" | seo-os "${e.seoOSAction}"`
  );
}

const totalScore = Object.values(breakdown).reduce((a, b) => a + b, 0);

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
    falsePositiveCount: falsePositives.length,
    decisionAccuracy:
      matrix.decisions && matrix.decisions.length
        ? Math.round((correctDecisions.length / matrix.decisions.length) * 100) + "%"
        : "n/a",
  },
};

console.log(JSON.stringify(result, null, 2));
module.exports = { score: () => result };
