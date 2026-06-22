#!/usr/bin/env node
/**
 * Golden regression check.
 * Runs the scorer against one or more configured inputs and compares each
 * result with its expected-score baseline (per-field absolute tolerance).
 * Exit 0 = no regression, exit 1 = regression (CI fails the PR).
 *
 *   node golden-tests/check-regression.js               # all configs (main + fixtures)
 *   node golden-tests/check-regression.js path/to/output.json   # main config, custom input
 *
 * Configs:
 *   - golden-tests/expected-score.json          (main golden site)
 *   - fixtures/<name>/expected-score.json       (auto-discovered)
 * Each expected-score.json may carry suite-relative `baseline` / `matrix`
 * paths (forwarded to the scorer as --baseline= / --matrix=); when absent the
 * scorer uses its own defaults (the main golden site).
 *
 * No external dependencies. Pure Node.
 */
"use strict";
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const SUITE_DIR = path.resolve(__dirname, "..");
const SCORER = path.join(SUITE_DIR, "seo-os-scorer.js");

// resolve a suite-relative path (configs always express paths from SUITE_DIR)
const fromSuite = (p) => path.resolve(SUITE_DIR, p);

function discoverConfigs() {
  const configs = [{ label: "main", file: path.join(__dirname, "expected-score.json") }];
  const fixturesDir = path.join(SUITE_DIR, "fixtures");
  if (fs.existsSync(fixturesDir)) {
    for (const name of fs.readdirSync(fixturesDir).sort()) {
      const file = path.join(fixturesDir, name, "expected-score.json");
      if (fs.existsSync(file)) configs.push({ label: name, file });
    }
  }
  return configs;
}

function runScorer(input, baseline, matrix) {
  const scorerArgs = [SCORER, input];
  if (baseline) scorerArgs.push(`--baseline=${baseline}`);
  if (matrix) scorerArgs.push(`--matrix=${matrix}`);
  return JSON.parse(
    execFileSync(process.execPath, scorerArgs, { cwd: SUITE_DIR, encoding: "utf8" })
  );
}

// Compare one scorer result against a golden baseline; returns failure strings.
function checkConfig(golden, inputOverride) {
  const input = inputOverride || fromSuite(golden.scorerInput);
  const baseline = golden.baseline ? fromSuite(golden.baseline) : null;
  const matrix = golden.matrix ? fromSuite(golden.matrix) : null;
  const result = runScorer(input, baseline, matrix);

  const tol = (name) => {
    const t = golden.tolerance && golden.tolerance[name];
    return typeof t === "number" ? t : 0;
  };
  const failures = [];
  const expectNum = (label, actual, expected, tolerance) => {
    if (typeof actual !== "number" || Math.abs(actual - expected) > tolerance) {
      failures.push(`${label}: expected ${expected} (±${tolerance}), got ${actual}`);
    }
  };

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
  return { result, failures, input };
}

// When given an explicit input arg, only the main config runs against it
// (back-compat with `check-regression.js path/to/output.json`).
const inputArg = process.argv[2];
const configs = inputArg
  ? [{ label: "main", file: path.join(__dirname, "expected-score.json") }]
  : discoverConfigs();

let anyFailed = false;
for (const cfg of configs) {
  const golden = JSON.parse(fs.readFileSync(cfg.file, "utf8"));
  const { result, failures, input } = checkConfig(golden, inputArg && fromSuite(inputArg));
  if (failures.length) {
    anyFailed = true;
    console.error(`GOLDEN REGRESSION FAILED — ${cfg.label}`);
    failures.forEach((f) => console.error("  ✗ " + f));
  } else {
    console.log(
      `golden regression OK — ${cfg.label}: totalScore ${result.totalScore}, ` +
        `decisions ${result.correctDecisions.length}✓/${result.wrongDecisions.length}✗, ` +
        `input: ${path.relative(SUITE_DIR, input)}`
    );
  }
}

if (anyFailed) {
  console.error(
    "\nIf a change is intentional, update the relevant expected-score.json in the same PR."
  );
  process.exit(1);
}
