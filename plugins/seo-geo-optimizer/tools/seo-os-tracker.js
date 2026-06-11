#!/usr/bin/env node
/**
 * SEO-OS TRACKER (CLI)
 * ------------------------------------------------------------------
 * Reads `seo-os-state.json` (the SEO-OS v2 single source of truth) and
 * renders the deterministic dashboard in the terminal. Optionally watches
 * the file and live re-renders on every change.
 *
 * Usage:
 *   node seo-os-tracker.js [path/to/seo-os-state.json]
 *   node seo-os-tracker.js --detail        # phase names + notes + log tail
 *   node seo-os-tracker.js --watch         # live re-render on file change
 *   node seo-os-tracker.js --no-color      # plain ASCII (no ANSI)
 *   node seo-os-tracker.js --json          # machine-readable summary, then exit
 *
 * State auto-discovery (when no path given): walks up from CWD looking for
 * `.seo-os/seo-os-state.json` (and the legacy root location `seo-os-state.json`),
 * so it works from anywhere inside a project.
 *
 * No external dependencies. Pure Node. Matches references/execution-model.md.
 */
"use strict";
const fs = require("fs");
const path = require("path");

// ---- args -----------------------------------------------------------------
const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith("--")));
const positional = argv.filter((a) => !a.startsWith("--"));
const opt = {
  detail: flags.has("--detail"),
  watch: flags.has("--watch"),
  json: flags.has("--json"),
  color: !flags.has("--no-color") && process.stdout.isTTY !== false,
  help: flags.has("--help") || flags.has("-h"),
};

if (opt.help) {
  console.log(
    [
      "SEO-OS Tracker — render seo-os-state.json as a deterministic dashboard",
      "",
      "Usage: node seo-os-tracker.js [state.json] [--detail] [--watch] [--json] [--no-color]",
      "  --detail   show phase names, notes and the last log entries",
      "  --watch    live re-render whenever the state file changes",
      "  --json     print a machine-readable summary and exit",
      "  --no-color disable ANSI colors",
    ].join("\n")
  );
  process.exit(0);
}

// ---- locate state file -----------------------------------------------------
const STATE_NAME = "seo-os-state.json";
const STATE_DIR = ".seo-os";
function findStateFile(explicit) {
  if (explicit) return path.resolve(explicit);
  let dir = process.cwd();
  for (let i = 0; i < 12; i++) {
    // preferred location first, then legacy root location
    for (const candidate of [
      path.join(dir, STATE_DIR, STATE_NAME),
      path.join(dir, STATE_NAME),
    ]) {
      if (fs.existsSync(candidate)) return candidate;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(STATE_DIR, STATE_NAME); // best-effort default (may not exist)
}
const STATE_PATH = findStateFile(positional[0]);

// ---- presentation ----------------------------------------------------------
const SYMBOL = {
  not_started: "[ ]",
  in_progress: "[~]",
  completed: "[✓]",
  blocked: "[!]",
};
// fixed dashboard grid (matches execution-model.md)
const TOP = ["FAZ0A", "FAZ0B"];
const GRID = [
  ["A", "B", "C"],
  ["D", "E", "F"],
  ["G", "H", "I"],
  ["J", "K", "L"],
];
// human labels for --detail
const LABELS = {
  FAZ0A: "Tech Scan",
  FAZ0B: "Business Input",
  A: "Is Hedefi (Business Goal)",
  B: "Rakip / Icerik Boslugu",
  C: "Topical Authority",
  D: "GEO / LLM Gorunurlugu",
  E: "Entity SEO, Schema & Knowledge Graph",
  F: "Klasik SEO + E-E-A-T",
  G: "Yerel SEO",
  H: "Metadata / Crawlability",
  I: "Core Web Vitals + Cloudflare",
  J: "CRO",
  K: "Off-site Kurulum",
  L: "Dogrulama",
};
const ALL_KEYS = [...TOP, ...GRID.flat()];

const C = opt.color
  ? {
      dim: (s) => `\x1b[2m${s}\x1b[0m`,
      bold: (s) => `\x1b[1m${s}\x1b[0m`,
      green: (s) => `\x1b[32m${s}\x1b[0m`,
      yellow: (s) => `\x1b[33m${s}\x1b[0m`,
      red: (s) => `\x1b[31m${s}\x1b[0m`,
      cyan: (s) => `\x1b[36m${s}\x1b[0m`,
    }
  : {
      dim: (s) => s, bold: (s) => s, green: (s) => s,
      yellow: (s) => s, red: (s) => s, cyan: (s) => s,
    };

function paintSymbol(status) {
  const sym = SYMBOL[status] || "[ ]";
  if (!opt.color) return sym;
  if (status === "completed") return C.green(sym);
  if (status === "in_progress") return C.yellow(sym);
  if (status === "blocked") return C.red(sym);
  return C.dim(sym);
}

function statusOf(state, key) {
  return (state.phases && state.phases[key] && state.phases[key].status) || "not_started";
}

// ---- render ----------------------------------------------------------------
function render(state) {
  const lines = [];
  const bar = "=".repeat(24);
  lines.push(C.bold("=== SEO-OS DASHBOARD ==="));

  // top row: FAZ 0A / FAZ 0B
  lines.push(
    `FAZ 0A ${paintSymbol(statusOf(state, "FAZ0A"))}   FAZ 0B ${paintSymbol(
      statusOf(state, "FAZ0B")
    )}`
  );
  // A..L grid
  for (const row of GRID) {
    lines.push(row.map((k) => `${k} ${paintSymbol(statusOf(state, k))}`).join("  "));
  }
  lines.push("");

  const mode = state.mode || "ANALYZE";
  const modeColored =
    mode === "EXECUTE" ? C.red(mode) : mode === "PROPOSE" ? C.yellow(mode) : C.cyan(mode);
  lines.push(`MODE: ${modeColored}`);
  lines.push("CURRENT TASK:");
  lines.push(`→ ${state.currentTask || "—"}`);
  lines.push("BLOCKED:");
  const blocked = Array.isArray(state.blocked) ? state.blocked : [];
  if (!blocked.length) {
    lines.push(`→ None`);
  } else {
    blocked.forEach((b) => {
      const txt = typeof b === "string" ? b : b.reason || JSON.stringify(b);
      lines.push(`→ ${C.red(txt)}`);
    });
  }
  const vis = state.aiVisibilityScore || {};
  const before = vis.before == null ? "—" : vis.before;
  const current = vis.current == null ? "—" : vis.current;
  lines.push(`AI VISIBILITY: ${before} → ${current} / 100`);
  lines.push(bar);

  // progress summary (derived, outside the fixed block)
  const counts = ALL_KEYS.reduce(
    (acc, k) => {
      acc[statusOf(state, k)] = (acc[statusOf(state, k)] || 0) + 1;
      return acc;
    },
    {}
  );
  const done = counts.completed || 0;
  const total = ALL_KEYS.length;
  const pct = Math.round((done / total) * 100);
  const blocks = Math.round((pct / 100) * 20);
  const progressBar = "█".repeat(blocks) + "░".repeat(20 - blocks);
  // "blocked" counts phases with status=blocked; state.blocked[] entries are
  // external waits not tied to a phase status — shown separately as "waiting"
  const waiting = Array.isArray(state.blocked) ? state.blocked.length : 0;
  lines.push(
    C.dim(
      `progress: ${progressBar} ${pct}%  (${done}/${total} done, ` +
        `${counts.in_progress || 0} active, ${counts.blocked || 0} blocked` +
        `${waiting ? `, ${waiting} waiting` : ""})`
    )
  );

  // detail view
  if (opt.detail) {
    lines.push("");
    lines.push(C.bold("--- phases ---"));
    for (const k of ALL_KEYS) {
      const st = statusOf(state, k);
      const note = (state.phases && state.phases[k] && state.phases[k].notes) || "";
      const label = LABELS[k] || k;
      lines.push(
        `${paintSymbol(st)} ${C.bold(k.padEnd(5))} ${label}${note ? C.dim("  — " + note) : ""}`
      );
    }
    const log = Array.isArray(state.log) ? state.log.slice(-5) : [];
    if (log.length) {
      lines.push("");
      lines.push(C.bold("--- log (son 5) ---"));
      log.forEach((entry) => {
        if (typeof entry === "string") return lines.push(C.dim("• " + entry));
        const ts = entry.at || entry.ts || "";
        const msg = entry.msg || entry.message || JSON.stringify(entry);
        lines.push(C.dim(`• ${ts ? ts + "  " : ""}${msg}`));
      });
    }
  }

  // footer meta
  lines.push("");
  lines.push(
    C.dim(
      `project: ${state.project || "?"}  ·  updated: ${state.updatedAt || "?"}  ·  ${path.relative(
        process.cwd(),
        STATE_PATH
      ) || STATE_PATH}`
    )
  );
  return lines.join("\n");
}

function summary(state) {
  const counts = ALL_KEYS.reduce((acc, k) => {
    const s = statusOf(state, k);
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  return {
    project: state.project || null,
    mode: state.mode || "ANALYZE",
    currentPhase: state.currentPhase || null,
    currentTask: state.currentTask || null,
    completed: counts.completed || 0,
    inProgress: counts.in_progress || 0,
    blocked: counts.blocked || 0,
    waiting: Array.isArray(state.blocked) ? state.blocked.length : 0,
    notStarted: counts.not_started || 0,
    total: ALL_KEYS.length,
    progressPct: Math.round(((counts.completed || 0) / ALL_KEYS.length) * 100),
    aiVisibilityScore: state.aiVisibilityScore || { before: null, current: null },
    updatedAt: state.updatedAt || null,
  };
}

// ---- load + drive ----------------------------------------------------------
function loadState() {
  if (!fs.existsSync(STATE_PATH)) {
    console.error(
      C.red(`! ${STATE_NAME} bulunamadi:`) +
        ` ${STATE_PATH}\n  Bir yol ver (node seo-os-tracker.js path/to/${STATE_NAME})` +
        ` ya da SEO-OS'u Faz 0-A'da baslatip state olusturt.`
    );
    process.exit(1);
  }
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
  } catch (e) {
    console.error(C.red(`! ${STATE_NAME} parse edilemedi: `) + e.message);
    process.exit(1);
  }
}

function printOnce() {
  const state = loadState();
  if (opt.json) {
    console.log(JSON.stringify(summary(state), null, 2));
    return;
  }
  if (opt.watch && process.stdout.isTTY) {
    process.stdout.write("\x1b[2J\x1b[H"); // clear screen
  }
  console.log(render(state));
}

printOnce();

if (opt.watch && !opt.json) {
  console.log(C.dim(`\nwatching ${path.basename(STATE_PATH)} … (Ctrl+C to exit)`));
  let timer = null;
  fs.watch(STATE_PATH, () => {
    clearTimeout(timer);
    timer = setTimeout(printOnce, 80); // debounce editor double-writes
  });
}
