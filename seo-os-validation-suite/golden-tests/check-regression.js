#!/usr/bin/env node
/**
 * Golden regression check.
 * Runs the scorer against the configured input and compares the result with
 * golden-tests/expected-score.json (per-field absolute tolerance).
 * Exit 0 = no regression, exit 1 = regression (CI fails the PR).
 *
 *   node golden-tests/check-regression.js [path/to/seo-os-output.json]
 *
 * No external dependencies. Pure Node.
 */
"use strict";
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const SUITE_DIR = path.resolve(__dirname, "..");
const golden = JSON.parse(
  fs.readFileSync(path.join(__dirname, "expected-score.json"), "utf8")
);
const input = process.argv[2] || golden.scorerInput;

const raw = execFileSync(
  process.execPath,
  [path.join(SUITE_DIR, "seo-os-scorer.js"), input],
  { cwd: SUITE_DIR, encoding: "utf8" }
);
const result = JSON.parse(raw);

const tol = (name) => {
  const t = golden.tolerance[name];
  return typeof t === "number" ? t : 0;
};
const failures = [];
function expectNum(label, actual, expected, tolerance) {
  if (typeof actual !== "number" || Math.abs(actual - expected) > tolerance) {
    failures.push(`${label}: expected ${expected} (±${tolerance}), got ${actual}`);
  }
}

expectNum("totalScore", result.totalScore, golden.expected.totalScore, tol("totalScore"));
for (const [cat, exp] of Object.entries(golden.expected.breakdown)) {
  expectNum(`breakdown.${cat}`, result.breakdown && result.breakdown[cat], exp, tol("breakdown"));
}
expectNum(
  "falsePositiveCount",
  result.meta && result.meta.falsePositiveCount,
  golden.expected.falsePositiveCount,
  tol("falsePositiveCount")
);
expectNum(
  "correctDecisionCount",
  Array.isArray(result.correctDecisions) ? result.correctDecisions.length : NaN,
  golden.expected.correctDecisionCount,
  tol("correctDecisionCount")
);
expectNum(
  "wrongDecisionCount",
  Array.isArray(result.wrongDecisions) ? result.wrongDecisions.length : NaN,
  golden.expected.wrongDecisionCount,
  tol("wrongDecisionCount")
);
if (
  golden.expected.decisionAccuracy &&
  result.meta &&
  result.meta.decisionAccuracy !== golden.expected.decisionAccuracy
) {
  failures.push(
    `decisionAccuracy: expected ${golden.expected.decisionAccuracy}, got ${result.meta.decisionAccuracy}`
  );
}

if (failures.length) {
  console.error("GOLDEN REGRESSION FAILED");
  failures.forEach((f) => console.error("  ✗ " + f));
  console.error(
    "\nIf this change is intentional, update golden-tests/expected-score.json in the same PR."
  );
  process.exit(1);
}
console.log(
  `golden regression OK — totalScore ${result.totalScore}, ` +
    `decisions ${result.correctDecisions.length}✓/${result.wrongDecisions.length}✗, input: ${input}`
);
