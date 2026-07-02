#!/usr/bin/env node
/**
 * Deterministic behavior test for delta-report.js (no LLM).
 * Builds a synthetic "before" output from the committed golden sample by
 * perturbing known checks, runs the real delta-report pipeline, and asserts
 * the movement classification:
 *
 *   - geo.llms-txt removed from before        → must appear in newlyFixed
 *   - seo.canonical removed from before       → detected-only in after → newlyDetected
 *   - perf.lazy-loading added to before only  → must appear in regressed
 *   - verdict must be IMPROVED and totalScore delta positive
 *
 * Exit 0 = delta-report behaves, exit 1 = regression (CI fails the PR).
 * No external dependencies. Pure Node.
 */
"use strict";
const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const SUITE_DIR = path.resolve(__dirname, "..");
const after = JSON.parse(
  fs.readFileSync(path.join(SUITE_DIR, "sample-seo-os-output.json"), "utf8")
);

const without = (arr, ...ids) => (arr || []).filter((x) => !ids.includes(x));
const before = {
  ...after,
  detected: [...without(after.detected, "geo.llms-txt", "seo.canonical"), "perf.lazy-loading"],
  actionCorrect: [...without(after.actionCorrect, "geo.llms-txt"), "perf.lazy-loading"],
  missed: [...(after.missed || []).filter((x) => x !== "perf.lazy-loading"), "geo.llms-txt"],
};

const beforePath = path.join(os.tmpdir(), `seo-os-delta-before-${process.pid}.json`);
fs.writeFileSync(beforePath, JSON.stringify(before));

let delta;
try {
  delta = JSON.parse(
    execFileSync(
      process.execPath,
      [path.join(SUITE_DIR, "delta-report.js"), beforePath, "sample-seo-os-output.json"],
      { cwd: SUITE_DIR, encoding: "utf8" }
    )
  );
} finally {
  fs.rmSync(beforePath, { force: true });
}

const failures = [];
const expectIncludes = (label, arr, id) => {
  if (!Array.isArray(arr) || !arr.includes(id))
    failures.push(`${label}: expected to include "${id}", got ${JSON.stringify(arr)}`);
};
expectIncludes("moves.newlyFixed", delta.moves.newlyFixed, "geo.llms-txt");
expectIncludes("moves.newlyDetected", delta.moves.newlyDetected, "seo.canonical");
expectIncludes("moves.regressed", delta.moves.regressed, "perf.lazy-loading");
if (delta.verdict !== "IMPROVED")
  failures.push(`verdict: expected IMPROVED, got ${delta.verdict}`);
if (!(delta.delta.totalScore > 0))
  failures.push(`delta.totalScore: expected > 0, got ${delta.delta.totalScore}`);

if (failures.length) {
  console.error("DELTA-REPORT CHECK FAILED");
  failures.forEach((f) => console.error("  ✗ " + f));
  process.exit(1);
}
console.log(
  `delta-report OK — ${delta.before.totalScore} → ${delta.after.totalScore} ` +
    `(+${delta.delta.totalScore}), moves classified correctly`
);
