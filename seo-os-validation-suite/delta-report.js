#!/usr/bin/env node
/**
 * SEO-OS BEFORE/AFTER DELTA REPORT
 * ------------------------------------------------------------------
 * Scores two agent outputs (pre- and post-optimization) with the same
 * baseline/matrix and reports the difference: total score, category
 * breakdown, false positives, decision accuracy, and per-check moves
 * (newly fixed / newly detected / regressed).
 *
 * Usage:
 *   node delta-report.js <before-output.json> <after-output.json>
 *        [--baseline=path] [--matrix=path] [--md=path]
 *
 *   --md=path   also write a markdown report
 *
 * Inputs are agent-output-v1 JSONs (same shape as sample-seo-os-output.json).
 * No external dependencies. Pure Node.
 */
"use strict";
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const SUITE_DIR = __dirname;
const args = process.argv.slice(2);
const flag = (name, def) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : def;
};
const positional = args.filter((a) => !a.startsWith("--"));
if (positional.length < 2) {
  console.error("usage: node delta-report.js <before-output.json> <after-output.json> [--baseline=] [--matrix=] [--md=]");
  process.exit(2);
}
const [beforePath, afterPath] = positional;
const baselinePath = flag("baseline", "seo-baseline.json");
const matrixPath = flag("matrix", "decision-matrix.json");

function score(outputFile) {
  const raw = execFileSync(
    process.execPath,
    [
      path.join(SUITE_DIR, "seo-os-scorer.js"),
      outputFile,
      `--baseline=${baselinePath}`,
      `--matrix=${matrixPath}`,
    ],
    { cwd: SUITE_DIR, encoding: "utf8" }
  );
  return JSON.parse(raw);
}
const readOutput = (f) => {
  for (const c of [path.resolve(f), path.resolve(SUITE_DIR, f)]) {
    if (fs.existsSync(c)) return JSON.parse(fs.readFileSync(c, "utf8"));
  }
  throw new Error(`output file not found: ${f}`);
};

const before = score(beforePath);
const after = score(afterPath);
const beforeOut = readOutput(beforePath);
const afterOut = readOutput(afterPath);

const fmt = (d) => (d > 0 ? `+${d}` : String(d));
const pct = (s) => parseInt(s, 10) || 0;

// Per-check movement (full points = detected + correct action)
const setOf = (o, k) => new Set(o[k] || []);
const bAC = setOf(beforeOut, "actionCorrect");
const aAC = setOf(afterOut, "actionCorrect");
const bDet = setOf(beforeOut, "detected");
const aDet = setOf(afterOut, "detected");
const newlyFixed = [...aAC].filter((id) => !bAC.has(id)).sort();
const newlyDetected = [...aDet].filter((id) => !bDet.has(id) && !aAC.has(id)).sort();
const regressed = [...bDet].filter((id) => !aDet.has(id)).sort();

const delta = {
  $schema: "seo-os-validation/delta-report-v1",
  before: { file: beforePath, totalScore: before.totalScore, breakdown: before.breakdown },
  after: { file: afterPath, totalScore: after.totalScore, breakdown: after.breakdown },
  delta: {
    totalScore: after.totalScore - before.totalScore,
    breakdown: Object.fromEntries(
      Object.keys(before.breakdown).map((k) => [k, (after.breakdown[k] || 0) - (before.breakdown[k] || 0)])
    ),
    falsePositiveCount: after.meta.falsePositiveCount - before.meta.falsePositiveCount,
    decisionAccuracyPts: pct(after.meta.decisionAccuracy) - pct(before.meta.decisionAccuracy),
  },
  moves: { newlyFixed, newlyDetected, regressed },
  verdict:
    after.totalScore > before.totalScore
      ? "IMPROVED"
      : after.totalScore < before.totalScore
        ? "REGRESSED"
        : "UNCHANGED",
};

console.log(JSON.stringify(delta, null, 2));

const mdPath = flag("md", "");
if (mdPath) {
  const row = (k) =>
    `| ${k} | ${before.breakdown[k]} | ${after.breakdown[k]} | ${fmt(delta.delta.breakdown[k])} |`;
  const list = (a) => (a.length ? a.map((x) => `- \`${x}\``).join("\n") : "_yok_");
  const md = `# SEO-OS Delta Raporu — ${delta.verdict}

| Metrik | Önce | Sonra | Δ |
|--------|------|-------|---|
| **Toplam skor** | ${before.totalScore} | ${after.totalScore} | **${fmt(delta.delta.totalScore)}** |
${Object.keys(before.breakdown).map(row).join("\n")}
| False positive | ${before.meta.falsePositiveCount} | ${after.meta.falsePositiveCount} | ${fmt(delta.delta.falsePositiveCount)} |
| Karar doğruluğu | ${before.meta.decisionAccuracy} | ${after.meta.decisionAccuracy} | ${fmt(delta.delta.decisionAccuracyPts)} puan |

## Yeni düzeltilenler (tespit + doğru aksiyon)
${list(newlyFixed)}

## Yeni tespit edilenler (aksiyon henüz doğru değil)
${list(newlyDetected)}

## Gerileyenler (önce tespitliydi, artık değil)
${list(regressed)}

_Girdiler: \`${beforePath}\` → \`${afterPath}\` · baseline: \`${baselinePath}\` · matrix: \`${matrixPath}\`_
`;
  const resolved = path.resolve(mdPath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, md);
  console.error(`[delta] markdown -> ${resolved}`);
}
