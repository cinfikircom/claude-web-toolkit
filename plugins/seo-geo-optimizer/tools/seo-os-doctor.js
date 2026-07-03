#!/usr/bin/env node
/**
 * SEO-OS DOCTOR — state sağlık kontrolü ve onarım
 * ------------------------------------------------------------------
 * `.seo-os/seo-os-state.json`'u (ve yan ölçüm dosyalarını) doğrular:
 * eksik fazlar, geçersiz statüler, bozuk alanlar, parse edilemeyen
 * history satırları… `--repair` ile güvenli biçimde onarır (önce yedek alır).
 *
 * Usage:
 *   node seo-os-doctor.js [state.json]        # sadece teşhis (exit 1 = sorun var)
 *   node seo-os-doctor.js --repair            # yedekle + onar (exit 0 = artık sağlıklı)
 *   node seo-os-doctor.js --json              # makine-okunur rapor
 *
 * Onarım kuralları:
 *   - eksik faz anahtarı  -> { status: "not_started", notes: "" } eklenir
 *   - geçersiz status     -> "not_started" (eski değer notes'a işlenir)
 *   - geçersiz mode       -> "ANALYZE"
 *   - bilinmeyen currentPhase -> null
 *   - bozuk history satırı    -> atılır (yedek dosyada durur)
 *   - aiVisibilityScore/blocked/log tip bozuklukları -> varsayılana çekilir
 *
 * No external dependencies. Pure Node.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { findStateFile, ALL_KEYS, STATE_NAME } = require("./seo-os-state-lib");

const argv = process.argv.slice(2);
const has = (n) => argv.includes(`--${n}`);
const positional = argv.filter((a) => !a.startsWith("--"));
if (has("help") || argv.includes("-h")) {
  console.log(
    [
      "SEO-OS Doctor — state sağlık kontrolü ve onarım",
      "",
      "Usage: node seo-os-doctor.js [state.json] [--repair] [--json]",
      "  --repair  sorunları onar (önce .seo-os/ içine zaman damgalı yedek alır)",
      "  --json    makine-okunur rapor bas",
    ].join("\n")
  );
  process.exit(0);
}
const repair = has("repair");
const asJson = has("json");

const STATE_PATH = findStateFile(positional[0]);
const BASE_DIR = path.dirname(STATE_PATH);

const problems = []; // { level: "error"|"warn", msg, fixed?: true }
const note = (level, msg, fixed) => problems.push({ level, msg, fixed: !!fixed });

// ---- state dosyası -----------------------------------------------------------
if (!fs.existsSync(STATE_PATH)) {
  note("error", `${STATE_NAME} yok: ${STATE_PATH} — /seo-audit ile Faz 0-A'yı çalıştırıp oluşturt.`);
  finish(null);
}
let raw = fs.readFileSync(STATE_PATH, "utf8");
let state;
try {
  state = JSON.parse(raw);
} catch (e) {
  note("error", `${STATE_NAME} parse edilemedi: ${e.message} — elle bozulmuş; onarım için geçerli bir yedeğe dönün.`);
  finish(null);
}

let dirty = false;
const MODES = ["ANALYZE", "PROPOSE", "EXECUTE"];
const STATUSES = ["not_started", "in_progress", "completed", "blocked"];

if (state.$schema !== "seo-os-state/v2") {
  note("warn", `$schema "${state.$schema || "yok"}" — beklenen "seo-os-state/v2".`, repair);
  if (repair) { state.$schema = "seo-os-state/v2"; dirty = true; }
}
if (typeof state.project !== "string" || !state.project) {
  note("warn", `project alanı eksik/boş.`, repair);
  if (repair) { state.project = path.basename(path.dirname(BASE_DIR)) || "proje"; dirty = true; }
}
if (!MODES.includes(state.mode)) {
  note("error", `mode "${state.mode}" geçersiz (${MODES.join("/")}).`, repair);
  if (repair) { state.mode = "ANALYZE"; dirty = true; }
}
if (state.currentPhase != null && !ALL_KEYS.includes(state.currentPhase)) {
  note("error", `currentPhase "${state.currentPhase}" bilinen bir faz değil.`, repair);
  if (repair) { state.currentPhase = null; dirty = true; }
}
if (typeof state.phases !== "object" || state.phases == null) {
  note("error", "phases nesnesi yok.", repair);
  if (repair) { state.phases = {}; dirty = true; }
  else state = { ...state, phases: {} };
}
for (const k of ALL_KEYS) {
  const ph = state.phases[k];
  if (!ph || typeof ph !== "object") {
    note("error", `faz eksik: ${k}`, repair);
    if (repair) { state.phases[k] = { status: "not_started", notes: "" }; dirty = true; }
  } else if (!STATUSES.includes(ph.status)) {
    note("error", `faz ${k}: status "${ph.status}" geçersiz.`, repair);
    if (repair) {
      state.phases[k] = {
        ...ph,
        status: "not_started",
        notes: `${ph.notes ? ph.notes + " · " : ""}(doctor: geçersiz status "${ph.status}" sıfırlandı)`,
      };
      dirty = true;
    }
  }
}
for (const k of Object.keys(state.phases)) {
  if (!ALL_KEYS.includes(k)) note("warn", `bilinmeyen faz anahtarı: "${k}" (dokunulmadı — özel alan olabilir).`);
}
const vis = state.aiVisibilityScore;
if (vis == null || typeof vis !== "object" ||
    (vis.before != null && typeof vis.before !== "number") ||
    (vis.current != null && typeof vis.current !== "number")) {
  note("error", "aiVisibilityScore { before, current } sayı/null olmalı.", repair);
  if (repair) {
    state.aiVisibilityScore = {
      before: typeof (vis && vis.before) === "number" ? vis.before : null,
      current: typeof (vis && vis.current) === "number" ? vis.current : null,
    };
    dirty = true;
  }
}
if (!Array.isArray(state.blocked)) {
  note("error", "blocked bir dizi olmalı.", repair);
  if (repair) { state.blocked = []; dirty = true; }
}
if (!Array.isArray(state.log)) {
  note("error", "log bir dizi olmalı.", repair);
  if (repair) { state.log = []; dirty = true; }
}
if (state.updatedAt && isNaN(Date.parse(state.updatedAt))) {
  note("warn", `updatedAt "${state.updatedAt}" ISO-8601 değil.`, repair);
  if (repair) { state.updatedAt = new Date().toISOString(); dirty = true; }
}

// ---- yan dosyalar --------------------------------------------------------------
const HISTORY_PATH = path.join(BASE_DIR, "metrics-history.jsonl");
let historyFixLines = null;
if (fs.existsSync(HISTORY_PATH)) {
  const lines = fs.readFileSync(HISTORY_PATH, "utf8").split("\n").filter((l) => l.trim());
  const good = [];
  let bad = 0;
  for (const l of lines) {
    try {
      const s = JSON.parse(l);
      if (s && s.at) good.push(l);
      else bad++;
    } catch {
      bad++;
    }
  }
  if (bad) {
    note("error", `metrics-history.jsonl: ${bad} bozuk satır (${good.length} sağlam).`, repair);
    if (repair) historyFixLines = good;
  }
}
for (const f of ["geo-report.json", "cwv-report.json", "delta-report.json"]) {
  const p = path.join(BASE_DIR, f);
  if (fs.existsSync(p)) {
    try {
      JSON.parse(fs.readFileSync(p, "utf8"));
    } catch (e) {
      note("warn", `${f} parse edilemedi (${e.message}) — panel bu bölümü atlar; yeniden üretin.`);
    }
  }
}

// ---- onarımı yaz ----------------------------------------------------------------
if (repair && (dirty || historyFixLines)) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  if (dirty) {
    const bak = path.join(BASE_DIR, `seo-os-state.backup-${stamp}.json`);
    fs.writeFileSync(bak, raw);
    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + "\n");
    console.error(`[doctor] state onarıldı (yedek: ${path.basename(bak)})`);
  }
  if (historyFixLines) {
    const bak = path.join(BASE_DIR, `metrics-history.backup-${stamp}.jsonl`);
    fs.copyFileSync(HISTORY_PATH, bak);
    fs.writeFileSync(HISTORY_PATH, historyFixLines.join("\n") + (historyFixLines.length ? "\n" : ""));
    console.error(`[doctor] history temizlendi (yedek: ${path.basename(bak)})`);
  }
}

finish(state);

function finish(finalState) {
  const errors = problems.filter((p) => p.level === "error");
  const unfixed = problems.filter((p) => p.level === "error" && !p.fixed);
  if (asJson) {
    console.log(JSON.stringify({
      statePath: STATE_PATH,
      healthy: errors.length === 0,
      repaired: repair && problems.some((p) => p.fixed),
      problems,
    }, null, 2));
  } else {
    if (!problems.length) {
      console.log(`[doctor] ✓ sağlıklı — ${STATE_PATH}`);
    } else {
      for (const p of problems)
        console.log(`[doctor] ${p.level === "error" ? "✗" : "!"} ${p.msg}${p.fixed ? " → ONARILDI" : ""}`);
      if (unfixed.length && !repair)
        console.log(`[doctor] ${unfixed.length} sorun bulundu. Onarmak için: --repair (önce yedek alınır)`);
    }
  }
  process.exit(finalState == null ? 1 : unfixed.length && !repair ? 1 : 0);
}
