#!/usr/bin/env node
/**
 * SEO-OS DASHBOARD (HTML)
 * ------------------------------------------------------------------
 * Reads `seo-os-state.json` (the SEO-OS v2 single source of truth) plus
 * optional measurement files and renders a self-contained `dashboard.html`
 * that PROVES the before -> after benefit of the optimization work:
 *
 *   - AI Visibility score (before -> current, delta)
 *   - Phase progress grid (FAZ 0A/0B + A..L)
 *   - Metric history trend (SVG line chart, no external JS/CSS)
 *   - AI engine citation scores (ChatGPT / Perplexity / Gemini / AI Overviews)
 *   - Core Web Vitals vs targets
 *   - Validation delta report (newly fixed / regressed checks)
 *
 * Usage:
 *   node seo-os-dashboard.js [path/to/seo-os-state.json]
 *   node seo-os-dashboard.js --snapshot [--note="llms.txt yayınlandı"]
 *   node seo-os-dashboard.js --out=path/to/dashboard.html --open
 *   node seo-os-dashboard.js --json          # render data model, no HTML
 *   node seo-os-dashboard.js --serve         # canlı panel: http://localhost:3928
 *   node seo-os-dashboard.js --serve --daemon # kalıcı: terminalden bağımsız süreç
 *   node seo-os-dashboard.js --status | --stop
 *   node seo-os-dashboard.js --measure --url=https://site.com [--snapshot]
 *       # GERÇEK CWV ölçümü: PageSpeed Insights API'sinden LCP/CLS/TTFB (+ CrUX
 *       # alan verisi varsa gerçek INP) çekip cwv-report.json'a yazar; PSI_API_KEY
 *       # opsiyoneldir (kotayı artırır). --snapshot ile birleştirip haftalık
 *       # zamanlanmış ölçüm olarak çalıştırılabilir (cron / Claude Code schedule).
 *
 * `--serve` binds to 127.0.0.1 ONLY (project convention: local-only, port 3928;
 * override with --port=). Every request re-reads the state + measurement files,
 * so the panel is always live — no rebuild step. `--daemon` detaches the server
 * (pid -> .seo-os/dashboard.pid, log -> .seo-os/dashboard.log) so it survives
 * the terminal/session; manage it with --status / --stop.
 *
 * Optional inputs (auto-discovered next to the state file, or via flags):
 *   metrics-history.jsonl   --history=   one snapshot per line (append-only)
 *   geo-report.json         --geo=       seo-os-validation/geo-simulation-v1
 *   cwv-report.json         --cwv=       { LCP_s, INP_ms, CLS, TTFB_ms }
 *   delta-report.json       --delta=     seo-os-validation/delta-report-v1
 *
 * `--snapshot` appends the current state (+geo/cwv if present) to
 * metrics-history.jsonl, then re-renders the HTML. Call it after each
 * completed phase so the trend chart tells the improvement story.
 *
 * No external dependencies. Pure Node. Matches references/execution-model.md.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const {
  STATE_NAME,
  findStateFile,
  TOP,
  GRID,
  ALL_KEYS,
  LABELS,
  STATUS_TR,
  statusOf,
  noteOf,
  progress,
} = require("./seo-os-state-lib");

// ---- args -----------------------------------------------------------------
const argv = process.argv.slice(2);
const flagVal = (name, def) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : def;
};
const has = (name) => argv.includes(`--${name}`);
const positional = argv.filter((a) => !a.startsWith("--"));
// proje standardı: panel SADECE localhost üzerinde ve 3928 portunda sunulur
const SERVE_HOST = "127.0.0.1";
const SERVE_PORT = 3928;
const opt = {
  snapshot: has("snapshot"),
  open: has("open"),
  json: has("json"),
  serve: has("serve"),
  fleet: has("fleet"),
  daemon: has("daemon"),
  stop: has("stop"),
  status: has("status"),
  measure: has("measure"),
  url: flagVal("url", ""),
  psiMock: flagVal("psi-mock", ""), // test/CI: ağ yerine dosyadan PSI yanıtı oku
  port: Number(flagVal("port", String(SERVE_PORT))),
  note: flagVal("note", ""),
  out: flagVal("out", ""),
  help: has("help") || argv.includes("-h"),
};

if (opt.help) {
  console.log(
    [
      "SEO-OS Dashboard — render seo-os-state.json as a self-contained HTML benefit report",
      "",
      "Usage: node seo-os-dashboard.js [state.json] [--snapshot] [--note=..] [--out=..] [--open] [--json] [--serve]",
      "  --snapshot  append current metrics to metrics-history.jsonl, then render",
      "  --note=..   free-text note stored with the snapshot",
      "  --out=..    HTML output path (default: <state-dir>/dashboard.html)",
      "  --open      open the rendered HTML (or served URL) in the default browser",
      "  --json      print the render data model instead of writing HTML",
      "  --measure   fetch REAL CWV from PageSpeed Insights into cwv-report.json (--url= required;",
      "              PSI_API_KEY env optional). Combine with --snapshot for scheduled runs.",
      "  --serve     live panel on http://localhost:3928 (127.0.0.1 only; --port= to override)",
      "  --fleet     ALL registered projects in one cockpit (~/.seo-os/registry.json;",
      "              projects auto-register on every render). With --serve: / = fleet,",
      "              /p/N = that project's full panel. Without --serve: writes ~/.seo-os/fleet.html",
      "  --daemon    with --serve: start detached in the background (survives the terminal);",
      "              pid -> <state-dir>/dashboard.pid, log -> <state-dir>/dashboard.log",
      "  --stop      stop the background panel",
      "  --status    is the background panel running?",
      "  --history= / --geo= / --cwv= / --delta=   override optional input paths",
    ].join("\n")
  );
  process.exit(0);
}

// ---- locate files ----------------------------------------------------------
const STATE_PATH = findStateFile(positional[0]);
const BASE_DIR = path.dirname(STATE_PATH);
const HISTORY_PATH = path.resolve(flagVal("history", path.join(BASE_DIR, "metrics-history.jsonl")));
const GEO_PATH = path.resolve(flagVal("geo", path.join(BASE_DIR, "geo-report.json")));
const CWV_PATH = path.resolve(flagVal("cwv", path.join(BASE_DIR, "cwv-report.json")));
const DELTA_PATH = path.resolve(flagVal("delta", path.join(BASE_DIR, "delta-report.json")));
const OUT_PATH = path.resolve(opt.out || path.join(BASE_DIR, "dashboard.html"));

// required=true THROWS (exit yok) — --serve istek başına çağırır, sunucu ölmesin
function loadJson(file, required) {
  if (!fs.existsSync(file)) {
    if (required) throw new Error(`${path.basename(file)} bulunamadi: ${file}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    if (required) throw new Error(`${path.basename(file)} parse edilemedi: ${e.message}`);
    console.error(`[dashboard] uyari: ${path.basename(file)} parse edilemedi, atlandi (${e.message})`);
    return null;
  }
}
function loadHistory(file) {
  if (!fs.existsSync(file)) return [];
  return fs
    .readFileSync(file, "utf8")
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => {
      try { return JSON.parse(l); } catch { return null; }
    })
    .filter(Boolean)
    .filter((s) => s && s.at)
    .sort((a, b) => String(a.at).localeCompare(String(b.at)));
}

// ---- domain: TOP/GRID/ALL_KEYS/LABELS/STATUS_TR/statusOf/noteOf/progress -----
// ortak kütüphaneden gelir -> ./seo-os-state-lib.js

// CWV: accept both baseline-style (LCP_s) and lowercase keys.
const CWV_DEFS = [
  { key: "LCP_s", alt: "lcp_s", label: "LCP", unit: "s", target: 2.5, warn: 4.0 },
  { key: "INP_ms", alt: "inp_ms", label: "INP", unit: "ms", target: 200, warn: 500 },
  { key: "CLS", alt: "cls", label: "CLS", unit: "", target: 0.1, warn: 0.25 },
  { key: "TTFB_ms", alt: "ttfb_ms", label: "TTFB", unit: "ms", target: 800, warn: 1800 },
];
function pickCwv(raw) {
  if (!raw) return null;
  const src = raw.metrics || raw;
  const out = {};
  let any = false;
  for (const def of CWV_DEFS) {
    const v = src[def.key] != null ? src[def.key] : src[def.alt];
    if (typeof v === "number") {
      out[def.key] = v;
      any = true;
    }
  }
  return any ? out : null;
}
function enginesOf(geo) {
  if (!geo || typeof geo.engines !== "object" || geo.engines == null) return null;
  const out = {};
  for (const [name, e] of Object.entries(geo.engines)) {
    if (e && typeof e.score === "number") {
      out[name] = { score: e.score, wouldCite: !!e.wouldCite, reason: e.reason || "" };
    }
  }
  return Object.keys(out).length ? out : null;
}

// ---- snapshot ---------------------------------------------------------------
function buildSnapshot(state, geo, cwv) {
  const p = progress(state);
  const vis = state.aiVisibilityScore || {};
  const snap = {
    at: new Date().toISOString(),
    aiVisibility: vis.current == null ? null : vis.current,
    progressPct: p.pct,
    completed: p.done,
    mode: state.mode || "ANALYZE",
    currentPhase: state.currentPhase || null,
  };
  if (opt.note) snap.note = opt.note;
  const cwvPicked = pickCwv(cwv);
  if (cwvPicked) snap.cwv = cwvPicked;
  const eng = enginesOf(geo);
  if (eng) {
    snap.engines = Object.fromEntries(Object.entries(eng).map(([n, e]) => [n, e.score]));
  }
  return snap;
}

// ---- html helpers ------------------------------------------------------------
const esc = (s) =>
  String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d) ? esc(iso) : d.toISOString().slice(0, 16).replace("T", " ");
};
const deltaChip = (d) => {
  if (d == null) return "";
  const cls = d > 0 ? "up" : d < 0 ? "down" : "flat";
  const sign = d > 0 ? "+" : "";
  return `<span class="chip ${cls}">${sign}${d}</span>`;
};

// Self-contained SVG line chart. series: [{label, color, points:[{t(ms), y}]}]
function svgLineChart(series, { w = 860, h = 220, yMax = 100 } = {}) {
  const padL = 34, padR = 12, padT = 12, padB = 26;
  const iw = w - padL - padR, ih = h - padT - padB;
  const allT = series.flatMap((s) => s.points.map((p) => p.t));
  if (!allT.length) return "";
  const tMin = Math.min(...allT), tMax = Math.max(...allT);
  const X = (t) => padL + (tMax === tMin ? iw / 2 : ((t - tMin) / (tMax - tMin)) * iw);
  const Y = (y) => padT + ih - (Math.max(0, Math.min(yMax, y)) / yMax) * ih;
  const gridLines = [0, 25, 50, 75, 100]
    .map(
      (v) =>
        `<line x1="${padL}" y1="${Y(v)}" x2="${w - padR}" y2="${Y(v)}" class="grid-line"/>` +
        `<text x="${padL - 6}" y="${Y(v) + 4}" text-anchor="end" class="tick">${v}</text>`
    )
    .join("");
  // renkler CSS'ten gelir (s0/s1 sınıfları) — açık/koyu tema geçişinde grafik de uyum sağlar
  const paths = series
    .map((s, i) => {
      const pts = s.points.map((p) => `${X(p.t).toFixed(1)},${Y(p.y).toFixed(1)}`).join(" ");
      const dots = s.points
        .map(
          (p) =>
            `<circle cx="${X(p.t).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="3.5" class="chart-dot s${i}">` +
            `<title>${esc(s.label)}: ${p.y} — ${fmtDate(new Date(p.t).toISOString())}${p.note ? " · " + esc(p.note) : ""}</title></circle>`
        )
        .join("");
      return `<polyline points="${pts}" fill="none" class="chart-line s${i}" stroke-width="2.5" stroke-linejoin="round"/>${dots}`;
    })
    .join("");
  const xLabels =
    `<text x="${padL}" y="${h - 8}" class="tick">${fmtDate(new Date(tMin).toISOString())}</text>` +
    (tMax !== tMin
      ? `<text x="${w - padR}" y="${h - 8}" text-anchor="end" class="tick">${fmtDate(new Date(tMax).toISOString())}</text>`
      : "");
  const legend = series
    .map(
      (s, i) =>
        `<circle cx="${padL + 10 + i * 170}" cy="${padT + 2}" r="4" class="chart-dot s${i}"/>` +
        `<text x="${padL + 20 + i * 170}" y="${padT + 6}" class="tick">${esc(s.label)}</text>`
    )
    .join("");
  return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Metrik trendi">${gridLines}${paths}${xLabels}${legend}</svg>`;
}

// ---- robots (gamification: her faz robotuna parça ekler; hepsi bitince PRIME) --
const ROBOT_GROUPS = [
  { name: "Strateji-Bot", phases: ["FAZ0A", "FAZ0B", "A", "B"], hue: 210, img: "strateji.png" },
  { name: "GEO-Bot", phases: ["C", "D", "E", "F"], hue: 275, img: "geo.png" },
  { name: "Teknik-Bot", phases: ["G", "H", "I"], hue: 160, img: "teknik.png" },
  { name: "Büyüme-Bot", phases: ["J", "K", "L"], hue: 25, img: "buyume.png" },
];

// tools/assets/robots/ altında render görseli varsa base64 gömülür (panel tek
// dosya kalır); yoksa aşağıdaki yerleşik SVG karakterlere düşülür
const ROBOT_ASSET_DIR = path.join(__dirname, "assets", "robots");
const GAME_ASSET_DIR = path.join(__dirname, "assets", "game");
function assetUri(dir, name) {
  const f = path.join(dir, name);
  if (!fs.existsSync(f)) return null;
  const mime = name.endsWith(".jpg") || name.endsWith(".jpeg") ? "image/jpeg" : "image/png";
  try {
    return `data:${mime};base64,${fs.readFileSync(f).toString("base64")}`;
  } catch {
    return null;
  }
}
const robotAsset = (name) => assetUri(ROBOT_ASSET_DIR, name);
const gameAsset = (name) => assetUri(GAME_ASSET_DIR, name);

// XP eğrisi: zor görevler daha çok kazandırır (I en riskli, D/E/K/L stratejik)
const XP_MAP = {
  FAZ0A: 50, FAZ0B: 50,
  A: 100, B: 100, C: 100,
  D: 150, E: 150, F: 100,
  G: 100, H: 100, I: 200,
  J: 100, K: 150, L: 150,
};
const XP_TOTAL = ALL_KEYS.reduce((a, k) => a + (XP_MAP[k] || 100), 0); // 1600
const RANKS = [
  { min: 0, name: "ÇAYLAK" },
  { min: 300, name: "OPERATÖR" },
  { min: 700, name: "UZMAN" },
  { min: 1200, name: "KOMUTAN" },
  { min: XP_TOTAL, name: "PRIME" },
];
const xpOf = (state) =>
  ALL_KEYS.reduce((a, k) => a + (statusOf(state, k) === "completed" ? XP_MAP[k] || 100 : 0), 0);
function rankOf(xp) {
  let r = RANKS[0];
  for (const x of RANKS) if (xp >= x.min) r = x;
  return r;
}

// başarımlar: hepsi tamamlanınca rozet açılır
const ACHIEVEMENTS = [
  { icon: "🛰️", name: "Keşif Tamam", need: ["FAZ0A", "FAZ0B"] },
  { icon: "🎯", name: "Stratejist", need: ["A", "B", "C"] },
  { icon: "🤖", name: "AI'da Görünür", need: ["D", "E", "F"] },
  { icon: "📍", name: "Yerel Kahraman", need: ["G", "H"] },
  { icon: "⚡", name: "Hız Şeytanı", need: ["I"] },
  { icon: "💰", name: "Dönüşümcü", need: ["J", "K", "L"] },
  { icon: "👑", name: "PRIME", need: ALL_KEYS },
];

function robotArms(main, dark) {
  return (
    `<rect x="16" y="56" width="16" height="12" rx="3" fill="${main}"/>` +
    `<rect x="19" y="67" width="11" height="30" rx="4" fill="${dark}"/>` +
    `<rect x="88" y="56" width="16" height="12" rx="3" fill="${main}"/>` +
    `<rect x="90" y="67" width="11" height="30" rx="4" fill="${dark}"/>`
  );
}
function robotPart(role, hue, withArms) {
  const main = `hsl(${hue} 62% 46%)`;
  const dark = `hsl(${hue} 62% 32%)`;
  const lite = `hsl(${hue} 50% 74%)`;
  switch (role) {
    case "legs":
      return (
        `<rect x="40" y="100" width="15" height="30" rx="3" fill="${dark}"/>` +
        `<rect x="65" y="100" width="15" height="30" rx="3" fill="${dark}"/>` +
        `<rect x="36" y="128" width="23" height="9" rx="2" fill="${main}"/>` +
        `<rect x="61" y="128" width="23" height="9" rx="2" fill="${main}"/>`
      );
    case "torso":
      return (
        `<rect x="34" y="56" width="52" height="46" rx="6" fill="${main}"/>` +
        `<rect x="42" y="90" width="36" height="8" rx="2" fill="${dark}"/>` +
        `<circle cx="60" cy="74" r="9" fill="${lite}" stroke="${dark}" stroke-width="2"/>` +
        (withArms ? robotArms(main, dark) : "")
      );
    case "arms":
      return robotArms(main, dark);
    case "head":
      return (
        `<rect x="46" y="28" width="28" height="24" rx="4" fill="${main}"/>` +
        `<rect x="50" y="36" width="20" height="8" rx="2" fill="${dark}"/>` +
        `<rect x="52" y="38" width="6" height="4" fill="#7df3ff"/>` +
        `<rect x="62" y="38" width="6" height="4" fill="#7df3ff"/>` +
        `<line x1="46" y1="30" x2="40" y2="21" stroke="${dark}" stroke-width="2"/>` +
        `<line x1="74" y1="30" x2="80" y2="21" stroke="${dark}" stroke-width="2"/>`
      );
    default:
      return "";
  }
}

// özgün, tamamı-SVG "Prime" (telifli görsel gömülmez — panel tek dosya kalır)
function primeSvg() {
  return `<svg viewBox="0 0 200 210" role="img" aria-label="Prime">
    <g class="prime-glow"><circle cx="100" cy="105" r="92" fill="hsl(210 90% 60% / .16)"/></g>
    <rect x="40" y="32" width="9" height="30" rx="2" fill="#94a3b8"/>
    <rect x="151" y="32" width="9" height="30" rx="2" fill="#94a3b8"/>
    <rect x="46" y="52" width="22" height="18" rx="4" fill="#dc2626"/>
    <rect x="132" y="52" width="22" height="18" rx="4" fill="#dc2626"/>
    <rect x="49" y="70" width="16" height="24" rx="4" fill="#dc2626"/>
    <rect x="135" y="70" width="16" height="24" rx="4" fill="#dc2626"/>
    <rect x="49" y="94" width="16" height="26" rx="4" fill="#cbd5e1"/>
    <rect x="135" y="94" width="16" height="26" rx="4" fill="#cbd5e1"/>
    <rect x="48" y="120" width="18" height="12" rx="3" fill="#1d4ed8"/>
    <rect x="134" y="120" width="18" height="12" rx="3" fill="#1d4ed8"/>
    <rect x="66" y="50" width="68" height="62" rx="6" fill="#dc2626"/>
    <rect x="73" y="57" width="24" height="17" rx="2" fill="#7dd3fc" stroke="#1e3a8a" stroke-width="2"/>
    <rect x="103" y="57" width="24" height="17" rx="2" fill="#7dd3fc" stroke="#1e3a8a" stroke-width="2"/>
    <rect x="80" y="82" width="40" height="16" rx="2" fill="#cbd5e1"/>
    <line x1="88" y1="82" x2="88" y2="98" stroke="#64748b" stroke-width="2"/>
    <line x1="100" y1="82" x2="100" y2="98" stroke="#64748b" stroke-width="2"/>
    <line x1="112" y1="82" x2="112" y2="98" stroke="#64748b" stroke-width="2"/>
    <polygon points="100,74 103,80 110,80 104,84 106,91 100,87 94,91 96,84 90,80 97,80" fill="#facc15"/>
    <rect x="78" y="112" width="44" height="14" rx="3" fill="#94a3b8"/>
    <rect x="76" y="126" width="20" height="48" rx="4" fill="#1d4ed8"/>
    <rect x="104" y="126" width="20" height="48" rx="4" fill="#1d4ed8"/>
    <rect x="78" y="146" width="16" height="8" rx="2" fill="#cbd5e1"/>
    <rect x="106" y="146" width="16" height="8" rx="2" fill="#cbd5e1"/>
    <rect x="70" y="172" width="28" height="11" rx="3" fill="#1e3a8a"/>
    <rect x="102" y="172" width="28" height="11" rx="3" fill="#1e3a8a"/>
    <rect x="82" y="16" width="36" height="28" rx="5" fill="#1d4ed8"/>
    <rect x="93" y="8" width="14" height="10" rx="2" fill="#facc15"/>
    <rect x="76" y="20" width="7" height="16" rx="2" fill="#1e3a8a"/>
    <rect x="117" y="20" width="7" height="16" rx="2" fill="#1e3a8a"/>
    <rect x="88" y="24" width="10" height="6" rx="1" fill="#7df3ff"/>
    <rect x="102" y="24" width="10" height="6" rx="1" fill="#7df3ff"/>
    <rect x="87" y="33" width="26" height="10" rx="2" fill="#cbd5e1"/>
  </svg>`;
}

function robotSection(state) {
  const p = progress(state);
  const allDone = p.done === p.total;
  const xp = xpOf(state);
  const rank = rankOf(xp);
  const xpPct = Math.round((xp / XP_TOTAL) * 100);
  const hangar = gameAsset("hangar.jpg");
  const pad = gameAsset("platform.jpg");
  const orb = gameAsset("orb.jpg");

  const bays = ROBOT_GROUPS.map((g) => {
    const doneCnt = g.phases.filter((k) => statusOf(state, k) === "completed").length;
    const buildingCnt = g.phases.filter((k) => statusOf(state, k) === "in_progress").length;
    const units = doneCnt + 0.5 * buildingCnt;
    const unitPct = Math.round((units / g.phases.length) * 100);
    const uri = robotAsset(g.img);
    let figure;
    if (uri) {
      // görsel mod: robot alttan yukarı "inşa edilerek" belirir;
      // devam eden faz varsa parlayan nabız efekti eklenir
      const cut = Math.max(0, 100 - unitPct);
      figure =
        `<div class="robot-fig" style="--cut:${cut}%">` +
        `<img class="robot-img base" src="${uri}" alt="" aria-hidden="true">` +
        `<img class="robot-img reveal${buildingCnt ? " building" : ""}" src="${uri}" alt="${esc(g.name)}">` +
        `</div>`;
    } else {
      const roles = g.phases.length === 4 ? ["legs", "torso", "arms", "head"] : ["legs", "torso", "head"];
      const parts = roles
        .map((role, i) => {
          const st = statusOf(state, g.phases[i]);
          const cls = st === "completed" ? "unlocked" : st === "in_progress" ? "building" : "locked";
          return `<g class="part ${cls}" style="animation-delay:${(0.15 * i).toFixed(2)}s">${robotPart(
            role, g.hue, g.phases.length === 3 && role === "torso"
          )}</g>`;
        })
        .join("");
      figure = `<svg class="robot-fig" viewBox="0 0 120 140" role="img" aria-label="${esc(g.name)}">${parts}</svg>`;
    }
    return (
      `<div class="bay${allDone ? " merging" : ""}" title="${esc(
        g.phases.map((k) => `${k}: ${STATUS_TR[statusOf(state, k)]}`).join(" · ")
      )}">` +
      figure +
      (pad ? `<img class="pad" src="${pad}" alt="" aria-hidden="true">` : `<div class="pad-css"></div>`) +
      `<div class="plate">${esc(g.name)}</div>` +
      `<div class="hp"><i style="width:${unitPct}%"></i></div>` +
      `<div class="bay-sub">${doneCnt}/${g.phases.length} MODÜL</div></div>`
    );
  }).join("");

  const primeUri = robotAsset("prime.png");
  const primeStage = allDone
    ? `<div class="prime-stage">` +
      (orb ? `<img class="orb" src="${orb}" alt="" aria-hidden="true">` : "") +
      (primeUri ? `<img class="prime-img" src="${primeUri}" alt="Prime">` : primeSvg()) +
      `<div class="prime-banner">⚡ PRIME MODU AKTİF — ${p.total}/${p.total} GÖREV</div></div>`
    : "";

  const achRow = ACHIEVEMENTS.map((a) => {
    const ok = a.need.every((k) => statusOf(state, k) === "completed");
    return `<span class="ach ${ok ? "unlocked" : "locked"}" title="${esc(
      a.need.map((k) => LABELS[k] || k).join(" + ")
    )}">${a.icon} ${esc(a.name)}</span>`;
  }).join("");

  return (
    `<section class="card game-card"><h2>Robot Hangarı</h2>` +
    `<div class="hangar"${hangar ? ` style="background-image:url(${hangar})"` : ""}>` +
    `<div class="scanlines" aria-hidden="true"></div>` +
    `<div class="hud"><span class="hud-title">SEO-OS</span>` +
    `<span class="lvl" title="Rütbeler: ${RANKS.map((r) => `${r.name} ${r.min}+`).join(" · ")}">⭐ ${rank.name}</span>` +
    `<div class="xp" title="${xp}/${XP_TOTAL} XP"><i style="width:${xpPct}%"></i></div>` +
    `<span class="hud-count">${xp}/${XP_TOTAL} XP · ${p.done}/${p.total} GÖREV</span></div>` +
    `<div class="bays">${bays}</div>${primeStage}</div>` +
    `<div class="ach-row">${achRow}${
      allDone
        ? `<button id="victory-btn" type="button" data-project="${esc(state.project || "?")}"` +
          ` data-before="${(state.aiVisibilityScore || {}).before ?? "—"}"` +
          ` data-current="${(state.aiVisibilityScore || {}).current ?? "—"}"` +
          ` data-xp="${xp}/${XP_TOTAL}">🏆 Zafer Kartını İndir (PNG)</button>`
        : ""
    }</div>` +
    (allDone
      ? ""
      : `<p class="muted merge-hint">Her tamamlanan görev robotuna yeni modül ekler; aktif görevler parlar.
         ${p.total}/${p.total} olduğunda dört robot birleşip <strong>Prime</strong>'ı oluşturur — kalan: <strong>${p.total - p.done} görev</strong>.</p>`) +
    `</section>`
  );
}

// 14 günden eski (ya da hiç olmayan) ölçüm için uyarı satırı
function stalenessLine(history) {
  if (!history.length) return "";
  const lastAt = Date.parse(history[history.length - 1].at);
  if (isNaN(lastAt)) return "";
  const days = Math.floor((Date.now() - lastAt) / 86400000);
  if (days < 14) return "";
  return (
    `<div class="guide-line">📡 Telemetri bayat: son ölçüm <strong>${days} gün önce</strong>. ` +
    `Yenile: <code>node "\${CLAUDE_PLUGIN_ROOT}/tools/seo-os-dashboard.js" --measure --url=https://siten.com --snapshot</code></div>`
  );
}

// Görev rehberi: paneli açan kişiyi bir sonraki adıma yönlendirir
function guideSection(state, history) {
  const p = progress(state);
  const label = (k) => `${k.replace("FAZ", "FAZ ")} — ${LABELS[k] || k}`;
  if (p.done === p.total) {
    return (
      `<section class="card guide"><h2>Görev Rehberi</h2>` +
      `<div class="guide-line">👑 Tüm görevler tamamlandı — <strong>PRIME MODU aktif</strong>. Skoru korumak için Doğrulama (L) ölçümlerini periyodik tekrarla.</div>` +
      stalenessLine(history) +
      `<p>Yeni ölçümü geçmişe işlemek için: <code>node "\${CLAUDE_PLUGIN_ROOT}/tools/seo-os-dashboard.js" --measure --url=https://siten.com --snapshot --note="periyodik kontrol"</code></p></section>`
    );
  }
  const untouched = ALL_KEYS.every((k) => statusOf(state, k) === "not_started");
  if (untouched) {
    return (
      `<section class="card guide"><h2>Görev Rehberi — Başlangıç</h2>` +
      `<ol class="guide-steps">` +
      `<li>Projenin kökünde Claude Code'u aç ve <code>/seo-audit</code> yaz — keşif görevi (FAZ 0A) otomatik başlar.</li>` +
      `<li>Hedef/risk sorularını yanıtla (FAZ 0B) — sistem görev listesini ve robotlarını kurar.</li>` +
      `<li>Bu paneli açık tut: her tamamlanan görevde robotların gelişir, seviye atlarsın; 14/14'te <strong>Prime</strong> gelir.</li>` +
      `</ol>` +
      `<p>Panel canlıdır: her sayfa yenilemede <code>.seo-os/seo-os-state.json</code>'dan taze okunur — ekstra kurulum gerekmez.</p></section>`
    );
  }
  const active = ALL_KEYS.filter((k) => statusOf(state, k) === "in_progress");
  const blocked = ALL_KEYS.filter((k) => statusOf(state, k) === "blocked");
  const next = ALL_KEYS.find((k) => statusOf(state, k) === "not_started");
  const lines = [
    ...active.map((k) => {
      const note = noteOf(state, k);
      return `<div class="guide-line active">⚔ Aktif görev: <strong>${esc(label(k))}</strong>${note ? ` <span class="muted">— ${esc(note)}</span>` : ""}</div>`;
    }),
    next ? `<div class="guide-line next">🎯 Sıradaki görev: <strong>${esc(label(next))}</strong></div>` : "",
    ...blocked.map((k) => {
      const note = noteOf(state, k);
      return `<div class="guide-line">⛔ Bekleyen engel: <strong>${esc(label(k))}</strong>${note ? ` <span class="muted">— ${esc(note)}</span>` : ""}</div>`;
    }),
  ].join("");
  return (
    `<section class="card guide"><h2>Görev Rehberi — Sıradaki Adım</h2>${lines}` +
    stalenessLine(history) +
    `<p>Devam etmek için projende Claude Code'a <code>/seo-audit</code> yaz — kaldığın görevden sürdürür ve bitince bu paneli günceller. ` +
    `Ölçümü geçmişe işlemek için: <code>node "\${CLAUDE_PLUGIN_ROOT}/tools/seo-os-dashboard.js" --snapshot --note="görev tamamlandı"</code></p></section>`
  );
}

// ---- render sections ----------------------------------------------------------
function kpiSection(state, history, engines) {
  const vis = state.aiVisibilityScore || {};
  const p = progress(state);
  const before = vis.before, current = vis.current;
  const delta = before != null && current != null ? current - before : null;
  const engineAvg = engines
    ? Math.round(
        Object.values(engines).reduce((a, e) => a + e.score, 0) / Object.keys(engines).length
      )
    : null;
  const citing = engines ? Object.values(engines).filter((e) => e.wouldCite).length : null;
  const kpis = [
    {
      label: "AI Visibility",
      value:
        (before == null ? "—" : before) +
        ` <span class="arrow">→</span> ` +
        `<strong>${current == null ? "—" : current}</strong><span class="sub">/100</span>`,
      chip: deltaChip(delta),
    },
    {
      label: "Faz İlerlemesi",
      value: `<strong>${p.pct}%</strong><span class="sub"> · ${p.done}/${p.total} tamam</span>`,
      chip: p.blocked ? `<span class="chip down">${p.blocked} engelli</span>` : "",
    },
    {
      label: "AI Motor Ortalaması",
      value:
        engineAvg == null
          ? `<span class="muted">veri yok</span>`
          : `<strong>${engineAvg}</strong><span class="sub">/100 · ${citing}/${Object.keys(engines).length} motor alıntılar</span>`,
      chip: "",
    },
    {
      label: "Ölçüm Sayısı",
      value: `<strong>${history.length}</strong><span class="sub"> snapshot</span>`,
      chip: "",
    },
  ];
  return `<section class="kpis">${kpis
    .map(
      (k) =>
        `<div class="card kpi"><div class="kpi-label">${k.label}</div><div class="kpi-value">${k.value}</div>${k.chip}</div>`
    )
    .join("")}</section>`;
}

function trendSection(history) {
  const visPts = history
    .filter((s) => typeof s.aiVisibility === "number")
    .map((s) => ({ t: Date.parse(s.at), y: s.aiVisibility, note: s.note }));
  const progPts = history
    .filter((s) => typeof s.progressPct === "number")
    .map((s) => ({ t: Date.parse(s.at), y: s.progressPct, note: s.note }));
  const series = [];
  if (visPts.length) series.push({ label: "AI Visibility", points: visPts });
  if (progPts.length) series.push({ label: "Faz ilerlemesi %", points: progPts });
  const body = series.length
    ? svgLineChart(series)
    : `<p class="muted">Henüz ölçüm geçmişi yok. Her faz sonunda şunu çalıştır:<br><code>node seo-os-dashboard.js --snapshot --note="D fazı tamamlandı"</code></p>`;
  return `<section class="card"><h2>Telemetri — Zaman İçinde Kazanım</h2>${body}</section>`;
}

function phaseSection(state) {
  const row = (k) => {
    const st = statusOf(state, k);
    const note = noteOf(state, k);
    const icon =
      st === "completed" ? "✔" : st === "in_progress" ? "⚔" : st === "blocked" ? "⛔" : "🔒";
    const xpVal = XP_MAP[k] || 100;
    const reward =
      st === "completed"
        ? `+${xpVal} XP`
        : st === "in_progress"
          ? `AKTİF · ${xpVal} XP`
          : st === "blocked"
            ? "ENGELLENDİ"
            : `🔒 ${xpVal} XP`;
    return (
      `<div class="quest ${st}" title="${esc(note)}">` +
      `<span class="q-icon">${icon}</span>` +
      `<span class="q-key">${k.replace("FAZ", "0").replace("00", "0")}</span>` +
      `<span class="q-name">${esc(LABELS[k] || k)}${note ? ` <span class="muted">— ${esc(note)}</span>` : ""}</span>` +
      `<span class="q-reward">${reward}</span></div>`
    );
  };
  return `<section class="card"><h2>Görev Günlüğü</h2><div class="quests">${ALL_KEYS.map(row).join("")}</div></section>`;
}

function engineSection(engines, history) {
  if (!engines) {
    return `<section class="card"><h2>AI Motor Taraması — Alıntılanma</h2><p class="muted">geo-report.json bulunamadı. GEO simülasyonu (D / L görevleri) çalıştırıldığında motor skorları burada görünür.</p></section>`;
  }
  const firstWithEngines = history.find((s) => s.engines);
  const cards = Object.entries(engines)
    .map(([name, e]) => {
      const prev = firstWithEngines && typeof firstWithEngines.engines[name] === "number"
        ? firstWithEngines.engines[name]
        : null;
      const d = prev != null ? e.score - prev : null;
      return (
        `<div class="card engine">` +
        `<div class="engine-head"><span>${esc(name)}</span>` +
        `<span class="cite ${e.wouldCite ? "yes" : "no"}">${e.wouldCite ? "alıntılar" : "alıntılamaz"}</span></div>` +
        `<div class="engine-score">${prev != null && prev !== e.score ? `<span class="muted">${prev} →</span> ` : ""}<strong>${e.score}</strong><span class="sub">/100</span> ${deltaChip(d)}</div>` +
        `<div class="engine-reason">${esc(e.reason)}</div></div>`
      );
    })
    .join("");
  return `<section><h2>AI Motor Taraması — Alıntılanma</h2><div class="engines">${cards}</div></section>`;
}

function cwvSection(cwv, history) {
  const current = pickCwv(cwv);
  if (!current) {
    return `<section class="card"><h2>Performans Çekirdeği — Core Web Vitals</h2><p class="muted">cwv-report.json bulunamadı. Lighthouse/PSI ölçümü sonrası CWV durumu burada görünür.</p></section>`;
  }
  const firstWithCwv = history.find((s) => s.cwv);
  const tiles = CWV_DEFS.filter((d) => current[d.key] != null)
    .map((d) => {
      const v = current[d.key];
      const cls = v <= d.target ? "good" : v <= d.warn ? "warn" : "bad";
      const prev = firstWithCwv ? firstWithCwv.cwv[d.key] : null;
      return (
        `<div class="card cwv ${cls}"><div class="kpi-label">${d.label}</div>` +
        `<div class="kpi-value">${prev != null && prev !== v ? `<span class="muted">${prev}${d.unit} →</span> ` : ""}<strong>${v}</strong><span class="sub">${d.unit}</span></div>` +
        `<div class="cwv-target">hedef ≤ ${d.target}${d.unit}</div></div>`
      );
    })
    .join("");
  return `<section><h2>Performans Çekirdeği — Core Web Vitals</h2><div class="kpis">${tiles}</div></section>`;
}

function deltaSection(delta) {
  if (!delta || !delta.before || !delta.after) return "";
  const list = (a, label, cls) =>
    a && a.length
      ? `<div><h3 class="${cls}">${label} (${a.length})</h3><ul>${a
          .map((x) => `<li><code>${esc(x)}</code></li>`)
          .join("")}</ul></div>`
      : "";
  const moves = delta.moves || {};
  return (
    `<section class="card"><h2>Doğrulama Delta Raporu ` +
    `<span class="chip ${delta.verdict === "IMPROVED" ? "up" : delta.verdict === "REGRESSED" ? "down" : "flat"}">${esc(delta.verdict || "")}</span></h2>` +
    `<p>Toplam skor: <strong>${delta.before.totalScore} → ${delta.after.totalScore}</strong> ${deltaChip(
      delta.delta ? delta.delta.totalScore : null
    )}</p>` +
    `<div class="delta-lists">${list(moves.newlyFixed, "Yeni düzeltilenler", "good-t")}${list(
      moves.newlyDetected, "Yeni tespit edilenler", "warn-t"
    )}${list(moves.regressed, "Gerileyenler", "bad-t")}</div></section>`
  );
}

function logSection(state) {
  const log = Array.isArray(state.log) ? state.log.slice(-10).reverse() : [];
  if (!log.length) return "";
  const items = log
    .map((entry) => {
      if (typeof entry === "string") return `<li>${esc(entry)}</li>`;
      const ts = entry.at || entry.ts || "";
      const msg = entry.msg || entry.message || JSON.stringify(entry);
      return `<li><span class="muted">${fmtDate(ts)}</span> ${esc(msg)}</li>`;
    })
    .join("");
  return `<section class="card"><h2>Seyir Defteri — Son Aktivite</h2><ul class="log">${items}</ul></section>`;
}

// Filo kokpiti: kayıtlı tüm projelerin özet kartları (serve modunda /p/N linkli)
function renderFleetHtml(serveMode) {
  const entries = loadRegistry().map((r) => {
    try {
      return { ...r, ok: true, m: loadModelFrom(r.statePath) };
    } catch (e) {
      return { ...r, ok: false, error: e.message };
    }
  });
  const cards = entries
    .map((e, i) => {
      if (!e.ok)
        return (
          `<div class="card fcard dead"><div class="fname">${esc(e.project)}</div>` +
          `<div class="muted">ulaşılamıyor — ${esc(e.error)}</div>` +
          `<div class="fpath">${esc(e.statePath)}</div></div>`
        );
      const s = e.m.state;
      const p = progress(s);
      const vis = s.aiVisibilityScore || {};
      const href = serveMode
        ? `/p/${i}`
        : "file://" + path.join(path.dirname(e.statePath), "dashboard.html");
      return (
        `<a class="card fcard" href="${href}">` +
        `<div class="fhead"><span class="fname">${esc(s.project || e.project)}</span>` +
        `<span class="mode ${esc(s.mode || "ANALYZE")}">${esc(s.mode || "ANALYZE")}</span></div>` +
        `<div class="fbar"><i style="width:${p.pct}%"></i></div>` +
        `<div class="fstats"><span>${p.done}/${p.total} görev</span>` +
        `<span>AI Vis: ${vis.before ?? "—"} → <strong>${vis.current ?? "—"}</strong></span>` +
        (p.blocked ? `<span class="fbad">⛔ ${p.blocked}</span>` : "") +
        (p.done === p.total ? `<span>👑 PRIME</span>` : "") +
        `</div><div class="fpath">güncelleme: ${fmtDate(s.updatedAt)}</div></a>`
      );
    })
    .join("");
  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>SEO-OS Filo Kokpiti</title>
<style>
  :root { color-scheme: light; --bg:#f4f6fb; --card:#fff; --border:#e2e8f0; --text:#1e293b;
          --strong:#0f172a; --muted:#64748b; --accent:#0369a1; --gridline:rgba(15,23,42,.05);
          --ok-bg:#dcfce7; --ok-fg:#15803d; --bad-fg:#b91c1c;
          --warn-bg:#fef9c3; --warn-fg:#a16207; --bad-bg:#fee2e2; --info-bg:#e0f2fe; --info-fg:#0369a1; }
  .dark { color-scheme: dark; --bg:#0b1220; --card:#101a2e; --border:#1e293b; --text:#e2e8f0;
          --strong:#f8fafc; --muted:#64748b; --accent:#22d3ee; --gridline:rgba(125,211,252,.07);
          --ok-bg:#052e1b; --ok-fg:#4ade80; --bad-fg:#fb7185;
          --warn-bg:#2a2206; --warn-fg:#facc15; --bad-bg:#3f1120; --info-bg:#082f3a; --info-fg:#22d3ee; }
  * { box-sizing:border-box; } body { margin:0; padding:24px; background:var(--bg); color:var(--text);
      font:15px/1.55 -apple-system,"Segoe UI",Roboto,sans-serif; }
  body::before { content:""; position:fixed; inset:0; z-index:0; pointer-events:none;
      background-image:linear-gradient(var(--gridline) 1px,transparent 1px),linear-gradient(90deg,var(--gridline) 1px,transparent 1px);
      background-size:30px 30px; }
  .wrap { max-width:960px; margin:0 auto; position:relative; z-index:1; }
  header { display:flex; align-items:center; gap:10px; margin-bottom:16px; }
  h1 { font:700 19px ui-monospace,Menlo,monospace; letter-spacing:.14em; text-transform:uppercase;
       color:var(--strong); margin:0; } h1 span { color:var(--accent); }
  #theme-toggle { margin-left:auto; cursor:pointer; border:1px solid var(--border); background:var(--card);
       color:var(--text); border-radius:999px; padding:3px 12px; font:inherit; font-size:12.5px; }
  .fleet { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:14px; }
  .card { background:var(--card); border:1px solid var(--border); border-radius:10px; padding:14px;
          position:relative; text-decoration:none; color:inherit; display:block; }
  .card::before,.card::after { content:""; position:absolute; width:12px; height:12px;
          border:2px solid var(--accent); opacity:.5; pointer-events:none; }
  .card::before { top:-1px; left:-1px; border-right:none; border-bottom:none; border-top-left-radius:10px; }
  .card::after { bottom:-1px; right:-1px; border-left:none; border-top:none; border-bottom-right-radius:10px; }
  a.fcard:hover { border-color: var(--accent); }
  .fhead { display:flex; justify-content:space-between; align-items:center; gap:8px; }
  .fname { font-weight:700; color:var(--strong); }
  .mode { padding:1px 9px; border-radius:999px; font-size:11px; font-weight:700; }
  .mode.EXECUTE { background:var(--bad-bg); color:var(--bad-fg); }
  .mode.PROPOSE { background:var(--warn-bg); color:var(--warn-fg); }
  .mode.ANALYZE { background:var(--info-bg); color:var(--info-fg); }
  .fbar { height:8px; border-radius:999px; background:var(--bg); border:1px solid var(--border);
          overflow:hidden; margin:10px 0 8px; }
  .fbar i { display:block; height:100%; background:linear-gradient(90deg,#0ea5e9,#5eead4); }
  .fstats { display:flex; flex-wrap:wrap; gap:10px; font-size:13px; }
  .fbad { color: var(--bad-fg); font-weight:600; }
  .fpath { font:11px ui-monospace,Menlo,monospace; color:var(--muted); margin-top:8px;
           overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .dead { opacity:.7; } .muted { color:var(--muted); }
  .empty { text-align:center; color:var(--muted); padding:40px 0; }
</style></head><body><div class="wrap">
<header><h1>SEO-OS <span>Filo Kokpiti</span></h1>
<button id="theme-toggle" type="button">🌙 Gece</button></header>
${entries.length ? `<div class="fleet">${cards}</div>` : `<p class="empty">Kayıtlı proje yok. Bir projede paneli bir kez çalıştır — otomatik kaydolur.</p>`}
<script>(function(){var KEY="seo-os-theme",b=document.getElementById("theme-toggle");
function a(t){document.documentElement.classList.toggle("dark",t==="dark");b.textContent=t==="dark"?"☀️ Açık":"🌙 Gece"}
var t="light";try{t=localStorage.getItem(KEY)||"light"}catch(e){}a(t);
b.addEventListener("click",function(){t=t==="dark"?"light":"dark";try{localStorage.setItem(KEY,t)}catch(e){}a(t)})})();
</script></div></body></html>`;
}

function renderHtml(model) {
  const { state, history, engines, cwv, delta, statePath = STATE_PATH } = model;
  const p = progress(state);
  const mode = state.mode || "ANALYZE";
  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SEO-OS Komuta Merkezi — ${esc(state.project || "?")}</title>
<style>
  /* AÇIK TEMA varsayılandır; .dark sınıfı (sağ üst düğme) gece moduna geçirir */
  :root {
    color-scheme: light;
    --bg: #f4f6fb; --card: #ffffff; --border: #e2e8f0;
    --text: #1e293b; --strong: #0f172a; --muted: #64748b; --heading: #64748b;
    --code-bg: #eef2f7; --grid: #e2e8f0; --tick: #94a3b8; --footer: #94a3b8;
    --chart1: #0369a1; --chart2: #7c3aed;
    --accent: #0369a1; --gridline: rgba(15, 23, 42, .05);
    --ok-bg: #dcfce7; --ok-fg: #15803d; --ok-bd: #86efac;
    --warn-bg: #fef9c3; --warn-fg: #a16207; --warn-bd: #fde047;
    --bad-bg: #fee2e2; --bad-fg: #b91c1c; --bad-bd: #fca5a5;
    --flat-bg: #e2e8f0; --flat-fg: #475569;
    --info-bg: #e0f2fe; --info-fg: #0369a1;
  }
  .dark {
    color-scheme: dark;
    --bg: #0b1220; --card: #101a2e; --border: #1e293b;
    --text: #e2e8f0; --strong: #f8fafc; --muted: #64748b; --heading: #94a3b8;
    --code-bg: #1e293b; --grid: #1e293b; --tick: #64748b; --footer: #475569;
    --chart1: #38bdf8; --chart2: #a78bfa;
    --accent: #22d3ee; --gridline: rgba(125, 211, 252, .07);
    --ok-bg: #052e1b; --ok-fg: #4ade80; --ok-bd: #14532d;
    --warn-bg: #2a2206; --warn-fg: #facc15; --warn-bd: #713f12;
    --bad-bg: #2e0e1a; --bad-fg: #fb7185; --bad-bd: #881337;
    --flat-bg: #1e293b; --flat-fg: #94a3b8;
    --info-bg: #082f3a; --info-fg: #22d3ee;
  }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 24px; background: var(--bg); color: var(--text);
         font: 15px/1.55 -apple-system, "Segoe UI", Roboto, sans-serif; }
  /* oyun zemini: tüm sayfada hafif taktik grid */
  body::before { content: ""; position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background-image: linear-gradient(var(--gridline) 1px, transparent 1px),
                      linear-gradient(90deg, var(--gridline) 1px, transparent 1px);
    background-size: 30px 30px; }
  .wrap { max-width: 960px; margin: 0 auto; display: grid; gap: 16px; position: relative; z-index: 1; }
  header { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
  h1 { font-size: 19px; margin: 0; color: var(--strong);
       font-family: ui-monospace, Menlo, monospace; letter-spacing: .14em; text-transform: uppercase; }
  h1 .h1-sub { color: var(--accent); }
  .dark h1 { text-shadow: 0 0 12px rgba(34, 211, 238, .5); }
  h2 { font-size: 13.5px; margin: 0 0 10px; color: var(--heading); text-transform: uppercase;
       letter-spacing: .1em; font-family: ui-monospace, Menlo, monospace; }
  h2::before { content: "▮ "; color: var(--accent); }
  h3 { font-size: 13px; margin: 8px 0 4px; }
  .card { background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 16px;
          box-shadow: 0 1px 2px rgba(15, 23, 42, .04); }
  /* bölüm panelleri: HUD köşe braketleri */
  section.card { position: relative; }
  section.card::before, section.card::after { content: ""; position: absolute; width: 14px; height: 14px;
    border: 2px solid var(--accent); opacity: .5; pointer-events: none; }
  section.card::before { top: -1px; left: -1px; border-right: none; border-bottom: none; border-top-left-radius: 10px; }
  section.card::after { bottom: -1px; right: -1px; border-left: none; border-top: none; border-bottom-right-radius: 10px; }
  .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
  .kpi-label { font-size: 11px; color: var(--heading); text-transform: uppercase; letter-spacing: .1em;
               font-family: ui-monospace, Menlo, monospace; }
  .kpi-value { font-size: 24px; margin-top: 4px; font-family: ui-monospace, Menlo, monospace; }
  .kpi-value strong { color: var(--strong); }
  .sub { font-size: 13px; color: var(--muted); }
  .arrow { color: var(--muted); }
  .muted { color: var(--muted); }
  .chip { display: inline-block; padding: 1px 8px; border-radius: 999px; font-size: 12px; font-weight: 600; }
  .chip.up { background: var(--ok-bg); color: var(--ok-fg); }
  .chip.down { background: var(--bad-bg); color: var(--bad-fg); }
  .chip.flat { background: var(--flat-bg); color: var(--flat-fg); }
  .mode { padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
  .mode.EXECUTE { background: var(--bad-bg); color: var(--bad-fg); }
  .mode.PROPOSE { background: var(--warn-bg); color: var(--warn-fg); }
  .mode.ANALYZE { background: var(--info-bg); color: var(--info-fg); }
  #theme-toggle { margin-left: auto; cursor: pointer; border: 1px solid var(--border);
                  background: var(--card); color: var(--text); border-radius: 999px;
                  padding: 3px 12px; font: inherit; font-size: 12.5px; }
  svg { width: 100%; height: auto; }
  .tick { fill: var(--tick); font-size: 11px; }
  .grid-line { stroke: var(--grid); }
  .chart-line.s0 { stroke: var(--chart1); } .chart-dot.s0 { fill: var(--chart1); }
  .chart-line.s1 { stroke: var(--chart2); } .chart-dot.s1 { fill: var(--chart2); }
  .dark .chart-line.s0 { filter: drop-shadow(0 0 4px var(--chart1)); }
  .dark .chart-line.s1 { filter: drop-shadow(0 0 4px var(--chart2)); }
  /* görev günlüğü (quest log) */
  .quests { display: grid; gap: 5px; margin-top: 4px; }
  .quest { display: flex; align-items: center; gap: 10px; padding: 7px 12px;
           border: 1px solid var(--border); border-radius: 8px; font-size: 13px; }
  .quest.completed { background: var(--ok-bg); border-color: var(--ok-bd); }
  .quest.in_progress { background: var(--warn-bg); animation: questPulse 1.8s ease-in-out infinite; }
  @keyframes questPulse { 0%, 100% { box-shadow: inset 0 0 0 1px var(--warn-bd); }
                          50% { box-shadow: inset 0 0 12px 1px var(--warn-bd); } }
  .quest.blocked { background: var(--bad-bg); border-color: var(--bad-bd); }
  .quest.not_started { opacity: .6; }
  .q-icon { width: 20px; text-align: center; }
  .q-key { font-family: ui-monospace, Menlo, monospace; width: 28px; color: var(--muted); font-size: 12px; }
  .q-name { flex: 1; font-weight: 600; }
  .q-reward { font-size: 10.5px; letter-spacing: .08em; color: var(--muted); white-space: nowrap; }
  .quest.completed .q-reward { color: var(--ok-fg); font-weight: 700; }
  .quest.in_progress .q-reward { color: var(--warn-fg); font-weight: 700; }
  .engines { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 12px; }
  .engine-head { display: flex; justify-content: space-between; align-items: center; font-weight: 600; }
  .engine-score { font-size: 22px; margin: 6px 0 4px; }
  .engine-score strong { color: var(--strong); }
  .engine-reason { font-size: 12px; color: var(--heading); }
  .cite { font-size: 11px; padding: 1px 8px; border-radius: 999px; font-weight: 700; }
  .cite.yes { background: var(--ok-bg); color: var(--ok-fg); } .cite.no { background: var(--bad-bg); color: var(--bad-fg); }
  .cwv.good { border-color: var(--ok-bd); } .cwv.warn { border-color: var(--warn-bd); } .cwv.bad { border-color: var(--bad-bd); }
  .cwv-target { font-size: 11px; color: var(--muted); margin-top: 2px; }
  .good-t { color: var(--ok-fg); } .warn-t { color: var(--warn-fg); } .bad-t { color: var(--bad-fg); }
  .delta-lists { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 8px; }
  .delta-lists ul { margin: 4px 0; padding-left: 18px; } .delta-lists li { font-size: 13px; }
  ul.log { margin: 0; padding-left: 18px; } ul.log li { font-size: 13px; margin: 2px 0; }
  code { background: var(--code-bg); padding: 1px 5px; border-radius: 4px; font-size: 12.5px; }
  footer { color: var(--footer); font-size: 11px; text-align: center; padding: 8px 0 2px;
           font-family: ui-monospace, Menlo, monospace; letter-spacing: .06em; }
  /* görev rehberi (yönlendirme) */
  .guide-line { display: flex; align-items: baseline; gap: 8px; padding: 6px 10px; border-radius: 8px;
                border: 1px dashed var(--border); margin-bottom: 6px; font-size: 14px; }
  .guide-line strong { color: var(--strong); }
  .guide-line.active { border-color: var(--warn-bd); background: var(--warn-bg); }
  .guide-line.next { border-color: var(--border); }
  .guide-steps { margin: 6px 0 0; padding-left: 22px; }
  .guide-steps li { margin: 6px 0; }
  .guide p { margin: 10px 0 0; font-size: 13.5px; }
  /* --- Komuta Merkezi: hangar sahnesi (oyun arayüzü) --- */
  .game-card { padding: 12px; }
  .game-card h2 { margin-bottom: 8px; }
  .hangar { position: relative; border-radius: 10px; overflow: hidden; padding: 12px 12px 20px;
            background: #05070d center / cover no-repeat; min-height: 300px;
            border: 1px solid #123; box-shadow: inset 0 0 60px rgba(0, 0, 0, .6); }
  .hangar::after { content: ""; position: absolute; inset: 0; pointer-events: none;
                   background: radial-gradient(ellipse at 50% 62%, transparent 42%, rgba(2, 6, 14, .62)); }
  .scanlines { position: absolute; inset: 0; pointer-events: none; z-index: 4; opacity: .5;
               background: repeating-linear-gradient(0deg, rgba(160, 220, 255, .05) 0 1px, transparent 1px 3px); }
  .hud { position: relative; z-index: 5; display: flex; align-items: center; gap: 10px;
         color: #d9f2ff; font-family: ui-monospace, Menlo, monospace; font-size: 11px;
         letter-spacing: .14em; text-transform: uppercase; }
  .hud-title { font-weight: 700; text-shadow: 0 0 10px rgba(64, 224, 255, .8); }
  .lvl { border: 1px solid rgba(94, 234, 212, .6); padding: 1px 9px; border-radius: 4px;
         background: rgba(8, 47, 58, .75); color: #5eead4; white-space: nowrap; }
  .xp { flex: 1; height: 9px; border: 1px solid rgba(94, 234, 212, .45); border-radius: 999px;
        background: rgba(2, 12, 20, .85); overflow: hidden; }
  .xp i { display: block; height: 100%; background: linear-gradient(90deg, #0ea5e9, #5eead4);
          box-shadow: 0 0 10px #22d3ee; transform-origin: left; animation: xpFill 1.2s ease-out both; }
  @keyframes xpFill { from { transform: scaleX(0); } }
  .hud-count { white-space: nowrap; color: #9adcff; }
  .bays { position: relative; z-index: 3; display: flex; justify-content: space-around;
          align-items: flex-end; gap: 6px; flex-wrap: wrap; margin-top: 16px; }
  .bay { position: relative; width: 150px; text-align: center; }
  .bay .robot-fig { position: relative; z-index: 2; height: 150px; width: 100%; }
  .bay .pad { display: block; width: 132px; margin: -36px auto 0; mix-blend-mode: screen;
              border-radius: 50%; aspect-ratio: 1 / 1; object-fit: cover;
              -webkit-mask-image: radial-gradient(circle, #000 58%, transparent 72%);
              mask-image: radial-gradient(circle, #000 58%, transparent 72%);
              animation: padPulse 3s ease-in-out infinite; }
  @keyframes padPulse { 0%, 100% { opacity: .7; } 50% { opacity: 1; } }
  .pad-css { width: 110px; height: 26px; margin: -12px auto 0; border-radius: 50%;
             background: radial-gradient(ellipse, rgba(34, 211, 238, .55), transparent 70%); }
  .plate { position: relative; z-index: 3; margin-top: -20px; font-family: ui-monospace, Menlo, monospace;
           font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: #c9ecff;
           text-shadow: 0 0 8px rgba(64, 224, 255, .9); }
  .hp { width: 92px; height: 6px; margin: 4px auto 0; border-radius: 999px; position: relative; z-index: 3;
        border: 1px solid rgba(94, 234, 212, .45); background: rgba(2, 12, 20, .85); overflow: hidden; }
  .hp i { display: block; height: 100%; background: linear-gradient(90deg, #22c55e, #a3e635);
          box-shadow: 0 0 8px #4ade80; transform-origin: left; animation: xpFill 1s ease-out both; }
  .bay-sub { position: relative; z-index: 3; font-family: ui-monospace, Menlo, monospace;
             font-size: 9.5px; letter-spacing: .14em; color: #7fb8d8; margin-top: 3px; }
  .bay.merging { animation: mergeOut .9s ease-in .5s forwards; }
  @keyframes mergeOut { to { transform: scale(.05) translateY(70px); opacity: 0; } }
  .prime-stage { position: absolute; inset: 0; z-index: 4; display: grid; place-items: center; }
  .prime-stage .orb { position: absolute; width: 240px; mix-blend-mode: screen; opacity: 0;
                      border-radius: 50%; aspect-ratio: 1 / 1; object-fit: cover;
                      -webkit-mask-image: radial-gradient(circle, #000 55%, transparent 70%);
                      mask-image: radial-gradient(circle, #000 55%, transparent 70%);
                      animation: orbIn .8s ease 1.15s forwards, orbSpin 14s linear 2s infinite; }
  @keyframes orbIn { to { opacity: .95; } }
  @keyframes orbSpin { to { transform: rotate(360deg); } }
  .prime-stage .prime-img, .prime-stage svg { position: relative; z-index: 2; }
  .ach-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
  .ach { display: inline-flex; gap: 6px; align-items: center; font-size: 11.5px; font-weight: 600;
         border: 1px solid var(--border); padding: 3px 10px; border-radius: 999px; }
  .ach.locked { opacity: .45; filter: grayscale(1); }
  .ach.unlocked { background: var(--ok-bg); color: var(--ok-fg); border-color: var(--ok-bd); }
  #victory-btn { margin-left: auto; cursor: pointer; font: 600 12.5px -apple-system, sans-serif;
                 border: 1px solid #facc15; color: #a16207; background: #fef9c3;
                 border-radius: 999px; padding: 4px 14px; }
  .dark #victory-btn { background: #3a2b05; color: #facc15; }
  /* SVG yedek robotlar (görsel dosyaları yoksa) */
  .part { transform-box: fill-box; transform-origin: center; }
  .part.unlocked { animation: partIn .55s cubic-bezier(.2, 1.4, .4, 1) both; }
  .part.building { animation: buildPulse 1.2s ease-in-out infinite; }
  .part.locked { opacity: .1; filter: grayscale(1); }
  @keyframes partIn { from { opacity: 0; transform: translateY(-14px) scale(.5); } to { opacity: 1; transform: none; } }
  @keyframes buildPulse { 0%, 100% { opacity: .22; } 50% { opacity: .65; } }
  .prime-stage svg { max-width: 230px; opacity: 0; animation: primeIn 1s cubic-bezier(.2, 1.3, .4, 1) 1.35s forwards; }
  @keyframes primeIn { from { opacity: 0; transform: scale(.15); } to { opacity: 1; transform: none; } }
  .prime-glow circle { transform-box: fill-box; transform-origin: center; animation: glowPulse 2.4s ease-in-out 2.4s infinite; }
  @keyframes glowPulse { 0%, 100% { opacity: .45; } 50% { opacity: 1; } }
  .prime-banner { position: absolute; bottom: 10px; left: 0; right: 0; text-align: center; z-index: 3;
                  font-family: ui-monospace, Menlo, monospace; font-size: 13px; font-weight: 700;
                  letter-spacing: .14em; color: #ffe9a8; text-shadow: 0 0 12px rgba(250, 204, 21, .8);
                  opacity: 0; animation: bannerIn .6s ease 2.1s forwards; }
  @keyframes bannerIn { to { opacity: 1; } }
  .merge-hint { font-size: 13px; }
  /* görsel-tabanlı robotlar (tools/assets/robots/*.png varsa) */
  .robot-fig { position: relative; height: 160px; }
  .robot-fig img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; }
  /* hangar zemini her temada koyu — silüet soluk beyaz "hologram hayaleti" olmalı */
  .robot-img.base { filter: grayscale(1) brightness(2.6) contrast(.35); opacity: .3; }
  .robot-img.reveal { clip-path: inset(var(--cut, 100%) 0 0 0); animation: revealUp 1.3s ease-out both; }
  @keyframes revealUp { from { clip-path: inset(100% 0 0 0); } to { clip-path: inset(var(--cut, 100%) 0 0 0); } }
  .robot-img.reveal.building { animation: revealUp 1.3s ease-out both, buildGlow 1.6s ease-in-out 1.4s infinite; }
  @keyframes buildGlow { 0%, 100% { filter: drop-shadow(0 0 2px hsl(200 90% 60% / 0)); } 50% { filter: drop-shadow(0 0 12px hsl(200 90% 60% / .8)); } }
  .prime-img { max-height: 250px; opacity: 0;
               animation: primeIn 1s cubic-bezier(.2, 1.3, .4, 1) 1.35s forwards, primeGlowImg 2.4s ease-in-out 2.5s infinite; }
  @keyframes primeGlowImg { 0%, 100% { filter: drop-shadow(0 0 6px hsl(210 90% 60% / .3)); } 50% { filter: drop-shadow(0 0 24px hsl(210 90% 60% / .8)); } }
</style>
</head>
<body><div class="wrap">
  <header>
    <h1>SEO-OS <span class="h1-sub">Komuta Merkezi</span></h1>
    <span class="mode ${esc(mode)}">${esc(mode)}</span>
    <span class="muted">${esc(state.project || "?")} · güncelleme: ${fmtDate(state.updatedAt)}</span>
    <button id="theme-toggle" type="button" aria-label="Tema değiştir">🌙 Gece</button>
  </header>
  ${state.currentTask ? `<div class="card"><span class="kpi-label">Aktif operasyon</span><div>${esc(state.currentTask)}</div></div>` : ""}
  ${kpiSection(state, history, engines)}
  ${robotSection(state)}
  ${guideSection(state, history)}
  ${trendSection(history)}
  ${phaseSection(state)}
  ${engineSection(engines, history)}
  ${cwvSection(cwv, history)}
  ${deltaSection(delta)}
  ${logSection(state)}
  <footer>seo-os-dashboard.js · ${p.done}/${p.total} faz tamam · üretim: ${fmtDate(new Date().toISOString())} · kaynak: ${esc(path.relative(process.cwd(), statePath) || statePath)}</footer>
</div>
<script>
(function () {
  // varsayılan AÇIK tema; gece modu tercihi localStorage'da saklanır
  var KEY = "seo-os-theme";
  var btn = document.getElementById("theme-toggle");
  function apply(t) {
    document.documentElement.classList.toggle("dark", t === "dark");
    btn.textContent = t === "dark" ? "☀️ Açık" : "🌙 Gece";
  }
  var theme = "light";
  try { theme = localStorage.getItem(KEY) || "light"; } catch (e) {}
  apply(theme);
  btn.addEventListener("click", function () {
    theme = theme === "dark" ? "light" : "dark";
    try { localStorage.setItem(KEY, theme); } catch (e) {}
    apply(theme);
  });

  // 🏆 Zafer kartı: 1200x630 paylaşılabilir PNG (tamamı istemci tarafında çizilir)
  var vb = document.getElementById("victory-btn");
  if (vb) vb.addEventListener("click", function () {
    var c = document.createElement("canvas");
    c.width = 1200; c.height = 630;
    var x = c.getContext("2d");
    var g = x.createLinearGradient(0, 0, 0, 630);
    g.addColorStop(0, "#0b1220"); g.addColorStop(1, "#041a2e");
    x.fillStyle = g; x.fillRect(0, 0, 1200, 630);
    x.strokeStyle = "rgba(125,211,252,.07)"; x.lineWidth = 1;
    for (var i = 0; i <= 1200; i += 30) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 630); x.stroke(); }
    for (var j = 0; j <= 630; j += 30) { x.beginPath(); x.moveTo(0, j); x.lineTo(1200, j); x.stroke(); }
    var img = document.querySelector(".prime-img");
    if (img && img.naturalWidth) {
      var boxW = 330, boxH = 470;
      var r = Math.min(boxW / img.naturalWidth, boxH / img.naturalHeight);
      var w = img.naturalWidth * r, h = img.naturalHeight * r;
      var grd = x.createRadialGradient(970, 320, 40, 970, 320, 240);
      grd.addColorStop(0, "rgba(56,189,248,.35)"); grd.addColorStop(1, "rgba(56,189,248,0)");
      x.fillStyle = grd; x.fillRect(730, 80, 480, 480);
      x.drawImage(img, 970 - w / 2, 320 - h / 2, w, h);
    }
    x.fillStyle = "#facc15"; x.font = "700 30px Menlo, monospace";
    x.fillText("⚡ PRIME MODU", 70, 120);
    x.fillStyle = "#f8fafc"; x.font = "700 52px Menlo, monospace";
    x.fillText(vb.dataset.project, 70, 190);
    x.fillStyle = "#94a3b8"; x.font = "24px Menlo, monospace";
    x.fillText("SEO-OS Growth Optimization — 14/14 görev tamamlandı", 70, 240);
    x.fillStyle = "#5eead4"; x.font = "700 44px Menlo, monospace";
    x.fillText("AI Visibility: " + vb.dataset.before + " → " + vb.dataset.current + " / 100", 70, 330);
    x.fillStyle = "#7dd3fc"; x.font = "26px Menlo, monospace";
    x.fillText("XP: " + vb.dataset.xp + "  ·  RÜTBE: PRIME", 70, 390);
    x.fillStyle = "#475569"; x.font = "20px Menlo, monospace";
    x.fillText(new Date().toLocaleDateString("tr-TR"), 70, 560);
    x.fillText("seo-geo-optimizer · claude-web-toolkit", 70, 590);
    var a = document.createElement("a");
    a.download = "seo-os-zafer-karti.png";
    a.href = c.toDataURL("image/png");
    a.click();
  });
})();
</script>
</body></html>`;
}

// ---- main --------------------------------------------------------------------
// re-callable so --serve can re-read everything per request (live panel)
function pathsFor(statePath) {
  const base = path.dirname(statePath);
  return {
    history: path.join(base, "metrics-history.jsonl"),
    geo: path.join(base, "geo-report.json"),
    cwv: path.join(base, "cwv-report.json"),
    delta: path.join(base, "delta-report.json"),
  };
}
function loadModelFrom(statePath, overrides) {
  const p = overrides || pathsFor(statePath);
  const state = loadJson(statePath, true);
  const geo = loadJson(p.geo, false);
  return {
    statePath,
    state,
    geo,
    cwv: loadJson(p.cwv, false),
    delta: loadJson(p.delta, false),
    history: loadHistory(p.history),
    engines: enginesOf(geo),
  };
}
function loadModel() {
  return loadModelFrom(STATE_PATH, {
    history: HISTORY_PATH,
    geo: GEO_PATH,
    cwv: CWV_PATH,
    delta: DELTA_PATH,
  });
}

// ---- filo kaydı (~/.seo-os/registry.json) --------------------------------------
// Her başarılı render projeyi kaydeder; --fleet tüm kayıtlı projeleri tek kokpitte gösterir.
const REGISTRY_PATH = path.join(require("os").homedir(), ".seo-os", "registry.json");
function loadRegistry() {
  try {
    const r = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
    return Array.isArray(r) ? r : [];
  } catch {
    return [];
  }
}
function registerProject(state, statePath) {
  try {
    const reg = loadRegistry();
    const entry = {
      project: state.project || path.basename(path.dirname(path.dirname(statePath))),
      statePath,
      lastSeen: new Date().toISOString(),
    };
    const idx = reg.findIndex((r) => r.statePath === statePath);
    if (idx >= 0) reg[idx] = entry;
    else reg.push(entry);
    fs.mkdirSync(path.dirname(REGISTRY_PATH), { recursive: true });
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(reg, null, 2) + "\n");
  } catch {
    /* kayıt hatası aracı asla durdurmaz */
  }
}

function openInBrowser(target) {
  const { spawn } = require("child_process");
  const opener =
    process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  spawn(opener, [target], { stdio: "ignore", detached: true }).unref();
}

// ---- gerçek CWV ölçümü (PageSpeed Insights API) --------------------------------
// Lab metrikleri + varsa CrUX alan verisi (gerçek kullanıcı INP'si) -> cwv-report.json
function measurePsi(url) {
  if (opt.psiMock) {
    return Promise.resolve(JSON.parse(fs.readFileSync(path.resolve(opt.psiMock), "utf8"))).then(writeCwvFromPsi);
  }
  if (!url) return Promise.reject(new Error("--measure için --url=https://… gerekli"));
  const https = require("https");
  const key = process.env.PSI_API_KEY ? `&key=${process.env.PSI_API_KEY}` : "";
  const api =
    "https://www.googleapis.com/pagespeedonline/v5/runPagespeed" +
    `?url=${encodeURIComponent(url)}&strategy=mobile&category=performance${key}`;
  console.error(`[dashboard] PSI ölçümü -> ${url} … (30-60 sn sürebilir)`);
  return new Promise((resolve, reject) => {
    const req = https.get(api, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        let json;
        try {
          json = JSON.parse(data);
        } catch {
          return reject(new Error(`PSI ${res.statusCode}: JSON olmayan yanıt`));
        }
        if (res.statusCode >= 400)
          return reject(new Error(`PSI ${res.statusCode}: ${(json.error && json.error.message) || data.slice(0, 200)}`));
        resolve(json);
      });
    });
    req.on("error", reject);
    req.setTimeout(120000, () => req.destroy(new Error("PSI 120 sn'de yanıt vermedi (timeout)")));
  }).then(writeCwvFromPsi);
}

function writeCwvFromPsi(data) {
  {
    const url = opt.url || (data.lighthouseResult && data.lighthouseResult.finalUrl) || "";
    const audits = (data.lighthouseResult && data.lighthouseResult.audits) || {};
    const num = (id) =>
      audits[id] && typeof audits[id].numericValue === "number" ? audits[id].numericValue : null;
    const report = { $schema: "seo-os/cwv-report-v1", url, at: new Date().toISOString(), source: "psi-lab" };
    const lcp = num("largest-contentful-paint");
    if (lcp != null) report.LCP_s = Math.round(lcp / 100) / 10;
    const cls = num("cumulative-layout-shift");
    if (cls != null) report.CLS = Math.round(cls * 1000) / 1000;
    const ttfb = num("server-response-time");
    if (ttfb != null) report.TTFB_ms = Math.round(ttfb);
    // INP lab'da ölçülmez: önce CrUX alan verisi (gerçek kullanıcı), yoksa TBT vekili
    const field = data.loadingExperience && data.loadingExperience.metrics;
    const inp =
      field &&
      field.INTERACTION_TO_NEXT_PAINT &&
      field.INTERACTION_TO_NEXT_PAINT.percentile;
    if (inp != null) {
      report.INP_ms = inp;
      report.source = "psi-lab+crux";
    } else {
      const tbt = num("total-blocking-time");
      if (tbt != null) {
        report.INP_ms = Math.round(tbt);
        report.inpNote = "lab TBT vekili (bu URL için CrUX alan verisi yok)";
      }
    }
    const perf =
      data.lighthouseResult && data.lighthouseResult.categories && data.lighthouseResult.categories.performance;
    if (perf && typeof perf.score === "number") report.lighthousePerf = Math.round(perf.score * 100);
    fs.mkdirSync(path.dirname(CWV_PATH), { recursive: true });
    fs.writeFileSync(CWV_PATH, JSON.stringify(report, null, 2) + "\n");
    console.error(
      `[dashboard] CWV yazıldı -> ${CWV_PATH} (kaynak: ${report.source}` +
        `${report.lighthousePerf != null ? `, Lighthouse perf ${report.lighthousePerf}` : ""})`
    );
  }
}

// ---- daemon yönetimi (panel oturumdan bağımsız yaşar) --------------------------
const PID_PATH = path.join(BASE_DIR, "dashboard.pid");
const LOG_PATH = path.join(BASE_DIR, "dashboard.log");

function daemonPid() {
  try {
    const pid = Number(fs.readFileSync(PID_PATH, "utf8").trim());
    if (!pid) return null;
    process.kill(pid, 0); // sinyal 0: süreç yaşıyor mu?
    return pid;
  } catch {
    return null;
  }
}

if (opt.stop) {
  const pid = daemonPid();
  if (pid) {
    process.kill(pid);
    fs.rmSync(PID_PATH, { force: true });
    console.log(`[dashboard] panel durduruldu (pid ${pid}).`);
  } else {
    fs.rmSync(PID_PATH, { force: true }); // bayat pid dosyasını temizle
    console.log("[dashboard] çalışan panel yok.");
  }
  process.exit(0);
}
if (opt.status) {
  const pid = daemonPid();
  console.log(
    pid
      ? `[dashboard] çalışıyor — http://localhost:${opt.port} (pid ${pid}, log: ${LOG_PATH})`
      : "[dashboard] çalışmıyor. Başlatmak için: seo-os-dashboard.js --serve --daemon"
  );
  process.exit(pid ? 0 : 1);
}
if (opt.serve && opt.daemon) {
  const running = daemonPid();
  const url = `http://localhost:${opt.port}`;
  if (running) {
    console.log(`[dashboard] zaten çalışıyor — ${url} (pid ${running})`);
    if (opt.open) openInBrowser(url);
    process.exit(0);
  }
  const { spawn } = require("child_process");
  fs.mkdirSync(BASE_DIR, { recursive: true });
  const logFd = fs.openSync(LOG_PATH, "a");
  // --daemon ve --open hariç tüm argümanları çocuğa aynen aktar
  const fwd = argv.filter((a) => a !== "--daemon" && a !== "--open");
  const child = spawn(process.execPath, [__filename, ...fwd], {
    detached: true,
    stdio: ["ignore", logFd, logFd],
    cwd: process.cwd(),
  });
  child.unref();
  fs.writeFileSync(PID_PATH, String(child.pid) + "\n");
  console.log(`[dashboard] arka planda başladı — ${url} (pid ${child.pid}, log: ${LOG_PATH})`);
  console.log(`[dashboard] durdurmak için: seo-os-dashboard.js --stop`);
  // sunucunun dinlemeye geçmesine küçük bir pay bırakıp tarayıcıyı aç
  setTimeout(() => {
    if (opt.open) openInBrowser(url);
    process.exit(0);
  }, 500);
} else if (opt.fleet && !opt.serve) {
  // statik filo kokpiti (yerel state gerekmez — kayıt defterinden okur)
  const out = path.join(path.dirname(REGISTRY_PATH), "fleet.html");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, renderFleetHtml(false));
  console.log(`[dashboard] filo kokpiti -> ${out} (${loadRegistry().length} proje)`);
  if (opt.open) openInBrowser(out);
} else if (opt.measure) {
  measurePsi(opt.url)
    .then(() => mainCli())
    .catch((e) => {
      console.error(`[dashboard] ölçüm hatası: ${e.message}`);
      process.exit(1);
    });
} else {
  mainCli();
}

function mainCli() {
let state, geo, cwv, delta, history, engines;
try {
  ({ state, geo, cwv, delta, history, engines } = loadModel());
} catch (e) {
  console.error(`! ${e.message}\n  Bir yol ver (node seo-os-dashboard.js path/to/${STATE_NAME}) ya da SEO-OS'u Faz 0-A'da baslatip state olusturt.`);
  process.exit(1);
}

if (opt.snapshot) {
  const snap = buildSnapshot(state, geo, cwv);
  fs.mkdirSync(path.dirname(HISTORY_PATH), { recursive: true });
  fs.appendFileSync(HISTORY_PATH, JSON.stringify(snap) + "\n");
  console.error(`[dashboard] snapshot eklendi -> ${HISTORY_PATH}`);
  history = loadHistory(HISTORY_PATH);
}

const model = { state, history, engines, cwv, delta, statePath: STATE_PATH };
registerProject(state, STATE_PATH); // filo kokpiti bu projeyi görsün

if (opt.json) {
  const vis = state.aiVisibilityScore || {};
  console.log(
    JSON.stringify(
      {
        project: state.project || null,
        mode: state.mode || "ANALYZE",
        aiVisibilityScore: { before: vis.before ?? null, current: vis.current ?? null },
        progress: progress(state),
        snapshots: history.length,
        engines: model.engines,
        cwv: pickCwv(cwv),
        deltaVerdict: delta ? delta.verdict || null : null,
      },
      null,
      2
    )
  );
  process.exit(0);
}

if (opt.serve) {
  const http = require("http");
  // filo değilse yerel projeyi kayda geçir (kokpit onu da görsün)
  if (!opt.fleet) {
    try {
      registerProject(loadModel().state, STATE_PATH);
    } catch {}
  }
  const server = http.createServer((req, res) => {
    try {
      let html;
      const pm = opt.fleet && (req.url || "").match(/^\/p\/(\d+)/);
      if (opt.fleet && !pm) {
        html = renderFleetHtml(true);
      } else {
        let m;
        if (pm) {
          const r = loadRegistry()[Number(pm[1])];
          if (!r) {
            res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
            return res.end("proje bulunamadı — filo kokpitine dön: /");
          }
          m = loadModelFrom(r.statePath);
        } else {
          // her istekte taze oku: state/ölçüm dosyaları değiştikçe panel canlı kalır
          m = loadModel();
        }
        // önizleme: ?prime=1 tüm fazları tamamlanmış sayar (birleşme finalini göster)
        if (/[?&]prime=1/.test(req.url || "")) {
          for (const k of Object.keys(m.state.phases || {}))
            m.state.phases[k] = { ...m.state.phases[k], status: "completed" };
        }
        html = renderHtml(m);
      }
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
      res.end(html);
    } catch (e) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(`panel render hatası: ${e.message}`);
    }
  });
  // yalnızca loopback: panel dışarıya asla açılmaz
  server.listen(opt.port, SERVE_HOST, () => {
    const addr = `http://localhost:${opt.port}`;
    console.log(`[dashboard] canlı panel -> ${addr}  (sadece ${SERVE_HOST}, Ctrl+C ile kapat)`);
    if (opt.open) openInBrowser(addr);
  });
  server.on("error", (e) => {
    console.error(
      e.code === "EADDRINUSE"
        ? `! port ${opt.port} dolu — çalışan bir panel olabilir (${SERVE_HOST}:${opt.port}); --port= ile değiştir.`
        : `! sunucu hatası: ${e.message}`
    );
    process.exit(1);
  });
} else {
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, renderHtml(model));
  console.log(`[dashboard] HTML -> ${OUT_PATH}`);
  if (opt.open) openInBrowser(OUT_PATH);
}
} // mainCli sonu
