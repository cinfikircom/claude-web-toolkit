"use strict";
/**
 * SEO-OS STATE LIB — tracker / sync / dashboard'un paylaştığı çekirdek.
 * State dosyası keşfi (CWD'den yukarı, 12 seviye), sabit faz ızgarası,
 * etiketler, durum sembolleri ve ilerleme matematiği TEK yerde yaşar —
 * araçlar arasında sapma riski kalmaz. Bağımlılıksız saf Node.
 */
const fs = require("fs");
const path = require("path");

const STATE_NAME = "seo-os-state.json";
const STATE_DIR = ".seo-os";

// CWD'den (veya fromDir'den) yukarı doğru state dosyasını ara.
// explicit verilirse doğrudan onu çözer; bulunamazsa best-effort varsayılan döner.
function findStateFile(explicit, fromDir) {
  if (explicit) return path.resolve(explicit);
  let dir = fromDir || process.cwd();
  for (let i = 0; i < 12; i++) {
    for (const candidate of [
      path.join(dir, STATE_DIR, STATE_NAME),
      path.join(dir, STATE_NAME), // eski kök konumu
    ]) {
      if (fs.existsSync(candidate)) return candidate;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(fromDir || process.cwd(), STATE_DIR, STATE_NAME);
}

// .seo-os DİZİNİNİ bul (yardımcı araçlar için: probe/sitecheck/indexnow/gsc).
// DİKKAT: $HOME'da durur — ~/.seo-os filo kayıt dizinidir, bir proje dizini DEĞİLDİR;
// oraya kilitlenmek config/raporları yanlış projeye yazardı.
function findSeoOsDir(fromDir) {
  const home = require("os").homedir();
  let dir = fromDir || process.cwd();
  for (let i = 0; i < 12; i++) {
    if (dir === home) break;
    if (fs.existsSync(path.join(dir, STATE_DIR))) return path.join(dir, STATE_DIR);
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(fromDir || process.cwd(), STATE_DIR);
}

// sabit dashboard ızgarası (references/execution-model.md ile birebir)
const TOP = ["FAZ0A", "FAZ0B"];
const GRID = [
  ["A", "B", "C"],
  ["D", "E", "F"],
  ["G", "H", "I"],
  ["J", "K", "L"],
];
const ALL_KEYS = [...TOP, ...GRID.flat()];

const LABELS = {
  FAZ0A: "Tech Scan",
  FAZ0B: "Business Input",
  A: "İş Hedefi",
  B: "Rakip / İçerik Boşluğu",
  C: "Topical Authority",
  D: "GEO / LLM Görünürlüğü",
  E: "Entity SEO & Knowledge Graph",
  F: "Klasik SEO + E-E-A-T",
  G: "Yerel SEO",
  H: "Metadata / Crawlability",
  I: "Core Web Vitals + Cloudflare",
  J: "CRO",
  K: "Off-site Kurulum",
  L: "Doğrulama",
};

const SYMBOL = {
  not_started: "[ ]",
  in_progress: "[~]",
  completed: "[✓]",
  blocked: "[!]",
};

const STATUS_TR = {
  not_started: "başlamadı",
  in_progress: "devam ediyor",
  completed: "tamamlandı",
  blocked: "engelli",
};

const statusOf = (state, key) =>
  (state.phases && state.phases[key] && state.phases[key].status) || "not_started";
const noteOf = (state, key) =>
  (state.phases && state.phases[key] && state.phases[key].notes) || "";

// sabit ALL_KEYS üzerinden ilerleme (kanonik ölçüm)
function progress(state) {
  const counts = ALL_KEYS.reduce((acc, k) => {
    const s = statusOf(state, k);
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  const done = counts.completed || 0;
  return {
    done,
    total: ALL_KEYS.length,
    inProgress: counts.in_progress || 0,
    blocked: counts.blocked || 0,
    notStarted: counts.not_started || 0,
    pct: Math.round((done / ALL_KEYS.length) * 100),
    counts,
  };
}

module.exports = {
  STATE_NAME,
  STATE_DIR,
  findStateFile,
  findSeoOsDir,
  TOP,
  GRID,
  ALL_KEYS,
  LABELS,
  SYMBOL,
  STATUS_TR,
  statusOf,
  noteOf,
  progress,
};
