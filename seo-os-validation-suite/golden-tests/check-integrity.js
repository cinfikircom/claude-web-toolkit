#!/usr/bin/env node
/**
 * Fixture/baseline integrity check (deterministic, no LLM).
 * For the main golden site and every fixture, asserts that the three input
 * files agree with each other BEFORE any scoring happens:
 *
 *   - every `detection` decision's checkId exists in baseline.categories
 *   - `site` fields align across baseline / decision-matrix / sample output
 *   - sample output ids (detected / actionCorrect / missed) exist in the baseline
 *   - actionCorrect ⊆ detected (an action can't be correct for an undetected issue)
 *
 * Informational (not a failure): baseline checks never referenced by the
 * matrix — they still contribute to breakdown but not to decisionAccuracy.
 *
 * Exit 0 = consistent, exit 1 = integrity violation (CI fails the PR).
 * No external dependencies. Pure Node.
 */
"use strict";
const fs = require("fs");
const path = require("path");

const SUITE_DIR = path.resolve(__dirname, "..");
const read = (f) => JSON.parse(fs.readFileSync(f, "utf8"));

function discoverConfigs() {
  const configs = [
    {
      label: "main",
      baseline: path.join(SUITE_DIR, "seo-baseline.json"),
      matrix: path.join(SUITE_DIR, "decision-matrix.json"),
      output: path.join(SUITE_DIR, "sample-seo-os-output.json"),
    },
  ];
  const fixturesDir = path.join(SUITE_DIR, "fixtures");
  if (fs.existsSync(fixturesDir)) {
    for (const name of fs.readdirSync(fixturesDir).sort()) {
      const dir = path.join(fixturesDir, name);
      if (!fs.existsSync(path.join(dir, "baseline.json"))) continue;
      configs.push({
        label: name,
        baseline: path.join(dir, "baseline.json"),
        matrix: path.join(dir, "decision-matrix.json"),
        output: path.join(dir, "sample-output.json"),
      });
    }
  }
  return configs;
}

let anyFailed = false;
for (const cfg of discoverConfigs()) {
  const failures = [];
  const infos = [];
  const baseline = read(cfg.baseline);
  const matrix = fs.existsSync(cfg.matrix) ? read(cfg.matrix) : null;
  const output = fs.existsSync(cfg.output) ? read(cfg.output) : null;

  const baselineIds = new Set(
    Object.values(baseline.categories || {}).flatMap((c) => (c.checks || []).map((k) => k.id))
  );

  if (matrix) {
    if (matrix.site && baseline.site && matrix.site !== baseline.site)
      failures.push(`site mismatch: matrix "${matrix.site}" != baseline "${baseline.site}"`);
    const referenced = new Set();
    for (const d of matrix.decisions || []) {
      const type = d.type || "detection";
      if (type !== "detection") continue;
      referenced.add(d.checkId);
      if (!baselineIds.has(d.checkId))
        failures.push(`matrix checkId not in baseline: "${d.checkId}"`);
    }
    const unreferenced = [...baselineIds].filter((id) => !referenced.has(id));
    if (unreferenced.length)
      infos.push(
        `${unreferenced.length}/${baselineIds.size} baseline checks not in matrix ` +
          `(count toward breakdown only, not decisionAccuracy): ${unreferenced.join(", ")}`
      );
  }

  if (output) {
    if (output.site && baseline.site && output.site !== baseline.site)
      failures.push(`site mismatch: output "${output.site}" != baseline "${baseline.site}"`);
    const detected = new Set(output.detected || []);
    for (const field of ["detected", "actionCorrect", "missed"]) {
      for (const id of output[field] || []) {
        if (!baselineIds.has(id))
          failures.push(`output.${field} id not in baseline: "${id}"`);
      }
    }
    for (const id of output.actionCorrect || []) {
      if (!detected.has(id))
        failures.push(`output.actionCorrect id missing from detected: "${id}"`);
    }
  }

  if (failures.length) {
    anyFailed = true;
    console.error(`INTEGRITY FAILED — ${cfg.label}`);
    failures.forEach((f) => console.error("  ✗ " + f));
  } else {
    console.log(`integrity OK — ${cfg.label} (${baselineIds.size} baseline checks)`);
  }
  infos.forEach((i) => console.log(`  ℹ ${cfg.label}: ${i}`));
}

process.exit(anyFailed ? 1 : 0);
