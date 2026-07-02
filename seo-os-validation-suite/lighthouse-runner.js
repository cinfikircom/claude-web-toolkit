#!/usr/bin/env node
/**
 * SEO-OS REAL CWV MEASUREMENT (Lighthouse / PageSpeed Insights)
 * ------------------------------------------------------------------
 * Measures REAL Core Web Vitals against a fixture (or any URL) and
 * compares them with `performanceTargets` in the baseline.
 *
 * Modes:
 *   LOCAL (default) — runs `npx lighthouse` headless against a URL.
 *     node lighthouse-runner.js --url=http://localhost:3000
 *     node lighthouse-runner.js --start            # boots golden-seo-test-site, measures, kills it
 *     node lighthouse-runner.js --start --site=fixtures/ecommerce-broken-site --port=4310
 *   PSI — Google PageSpeed Insights API for a DEPLOYED URL (field+lab data).
 *     node lighthouse-runner.js --psi --url=https://example.com   # PSI_API_KEY env optional
 *
 * Common flags:
 *   --baseline=path   targets source (default: seo-baseline.json -> performanceTargets)
 *   --out=path        report path (default: cwv-reports/cwv-<timestamp>.json)
 *   --enforce         exit 1 when any target is missed
 *
 * Pure Node core; the LOCAL mode shells out to `npx lighthouse` (Chrome required).
 * Lab caveat: INP is field-only — TBT is reported as the lab proxy.
 */
"use strict";
const { spawn, spawnSync } = require("child_process");
const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");

const SUITE_DIR = __dirname;
const args = process.argv.slice(2);
const flag = (name, def) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : def;
};
const has = (name) => args.includes(`--${name}`);

const baselinePath = path.resolve(SUITE_DIR, flag("baseline", "seo-baseline.json"));
const targets = JSON.parse(fs.readFileSync(baselinePath, "utf8")).performanceTargets || {};
const outPath = path.resolve(
  SUITE_DIR,
  flag("out", path.join("cwv-reports", `cwv-${Date.now()}.json`))
);
const port = Number(flag("port", "4310")); // matches the README/header examples
let url = flag("url", "");

// ---------------------------------------------------------------- helpers
function waitForHttp(checkUrl, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    (function poll() {
      const req = http.get(checkUrl, (res) => {
        res.resume();
        res.statusCode < 500 ? resolve() : retry();
      });
      req.on("error", retry);
      req.setTimeout(2000, () => { req.destroy(); retry(); });
      function retry() {
        if (Date.now() > deadline) return reject(new Error(`timeout waiting for ${checkUrl}`));
        setTimeout(poll, 1000);
      }
    })();
  });
}

function fetchJson(getUrl) {
  return new Promise((resolve, reject) => {
    https
      .get(getUrl, (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => {
          if (res.statusCode !== 200)
            return reject(new Error(`PSI HTTP ${res.statusCode}: ${body.slice(0, 300)}`));
          resolve(JSON.parse(body));
        });
      })
      .on("error", reject);
  });
}

// Normalize a Lighthouse LHR (local or PSI lighthouseResult) into our metric set.
function metricsFromLhr(lhr) {
  const a = lhr.audits;
  const v = (id) => (a[id] && typeof a[id].numericValue === "number" ? a[id].numericValue : null);
  return {
    performanceScore: lhr.categories?.performance
      ? Math.round(lhr.categories.performance.score * 100)
      : null,
    seoScore: lhr.categories?.seo ? Math.round(lhr.categories.seo.score * 100) : null,
    LCP_s: v("largest-contentful-paint") != null ? +(v("largest-contentful-paint") / 1000).toFixed(2) : null,
    FCP_s: v("first-contentful-paint") != null ? +(v("first-contentful-paint") / 1000).toFixed(2) : null,
    CLS: v("cumulative-layout-shift") != null ? +v("cumulative-layout-shift").toFixed(3) : null,
    TBT_ms: v("total-blocking-time") != null ? Math.round(v("total-blocking-time")) : null,
    TTFB_ms: v("server-response-time") != null ? Math.round(v("server-response-time")) : null,
  };
}

function compareWithTargets(metrics) {
  const checks = [];
  const add = (name, actual, target, pass) =>
    checks.push({ metric: name, actual, target, pass: actual == null ? null : pass });
  add("LCP_s", metrics.LCP_s, targets.LCP_s, metrics.LCP_s <= targets.LCP_s);
  add("CLS", metrics.CLS, targets.CLS, metrics.CLS <= targets.CLS);
  add("TTFB_ms", metrics.TTFB_ms, targets.TTFB_ms, metrics.TTFB_ms <= targets.TTFB_ms);
  // INP is field-only; in lab mode TBT<=200ms is the conventional proxy
  add("TBT_ms (INP lab proxy)", metrics.TBT_ms, targets.INP_ms, metrics.TBT_ms <= targets.INP_ms);
  if (metrics.INP_ms != null) add("INP_ms (field)", metrics.INP_ms, targets.INP_ms, metrics.INP_ms <= targets.INP_ms);
  return checks;
}

// ---------------------------------------------------------------- modes
async function runLocal() {
  let server = null;
  if (has("start")) {
    const siteDir = path.resolve(SUITE_DIR, flag("site", "golden-seo-test-site"));
    if (!fs.existsSync(path.join(siteDir, "node_modules"))) {
      console.error(`[cwv] npm install — ${siteDir} …`);
      const inst = spawnSync("npm", ["install", "--no-audit", "--no-fund"], {
        cwd: siteDir, stdio: "inherit",
      });
      if (inst.status !== 0) throw new Error("npm install failed");
    }
    console.error(`[cwv] starting dev server on :${port} …`);
    server = spawn("npm", ["run", "dev", "--", "-p", String(port)], {
      cwd: siteDir, stdio: "ignore", detached: true,
    });
    url = `http://localhost:${port}`;
    await waitForHttp(url, 120000);
    console.error("[cwv] server up");
  }
  if (!url) throw new Error("provide --url=… or --start");

  console.error(`[cwv] lighthouse -> ${url} …`);
  // pinned major so CWV numbers don't drift with whatever npx resolves that day
  const lhArgs = [
    "--yes", "lighthouse@12", url,
    "--output=json", "--quiet",
    "--only-categories=performance,seo",
    '--chrome-flags=--headless=new --no-sandbox',
  ];
  const res = spawnSync("npx", lhArgs, { encoding: "utf8", maxBuffer: 128 * 1024 * 1024 });
  if (server) {
    try { process.kill(-server.pid); } catch (_) { try { server.kill(); } catch (_) {} }
  }
  if (res.status !== 0)
    throw new Error(`lighthouse failed (${res.status}):\n${(res.stderr || "").slice(-1500)}`);
  const lhr = JSON.parse(res.stdout);
  return { source: "lighthouse-local", url, metrics: metricsFromLhr(lhr) };
}

async function runPsi() {
  if (!url) throw new Error("PSI mode requires --url=https://… (deployed site)");
  const key = process.env.PSI_API_KEY ? `&key=${process.env.PSI_API_KEY}` : "";
  const api =
    "https://www.googleapis.com/pagespeedonline/v5/runPagespeed" +
    `?url=${encodeURIComponent(url)}&strategy=mobile&category=performance&category=seo${key}`;
  console.error(`[cwv] PSI -> ${url} …`);
  const data = await fetchJson(api);
  const metrics = metricsFromLhr(data.lighthouseResult);
  // CrUX field data when available (real INP!)
  const field = data.loadingExperience && data.loadingExperience.metrics;
  if (field) {
    const f = (k) => (field[k] ? field[k].percentile : null);
    if (f("INTERACTION_TO_NEXT_PAINT") != null) metrics.INP_ms = f("INTERACTION_TO_NEXT_PAINT");
    if (f("LARGEST_CONTENTFUL_PAINT_MS") != null)
      metrics.LCP_field_s = +(f("LARGEST_CONTENTFUL_PAINT_MS") / 1000).toFixed(2);
    if (f("CUMULATIVE_LAYOUT_SHIFT_SCORE") != null)
      metrics.CLS_field = +(f("CUMULATIVE_LAYOUT_SHIFT_SCORE") / 100).toFixed(3);
  }
  return { source: "psi", url, metrics };
}

// ---------------------------------------------------------------- main
(async () => {
  const run = has("psi") ? await runPsi() : await runLocal();
  const checks = compareWithTargets(run.metrics);
  const failed = checks.filter((c) => c.pass === false);

  const report = {
    $schema: "seo-os-validation/cwv-report-v1",
    measuredAt: new Date().toISOString(),
    ...run,
    targets,
    checks,
    verdict: failed.length ? "FAIL" : "PASS",
  };
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log(JSON.stringify(report, null, 2));
  console.error(`\n[cwv] report -> ${outPath}`);
  console.error(`[cwv] ${report.verdict} — ${failed.length} target(s) missed`);
  if (has("enforce") && failed.length) process.exit(1);
})().catch((e) => {
  console.error("[cwv] ERROR:", e.message);
  process.exit(1);
});
