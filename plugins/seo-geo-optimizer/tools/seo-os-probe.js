#!/usr/bin/env node
/**
 * SEO-OS AI CITATION PROBE
 * ------------------------------------------------------------------
 * Hedef anahtar kelimelerle GERÇEK AI arama motorlarına sorgu atar ve
 * sitenin yanıt kaynakları arasında alıntılanıp alıntılanmadığını ölçer.
 * Sonuç, panelin okuduğu `geo-report.json`a (geo-simulation-v1 uyumlu)
 * yazılır — böylece "AI Motor Taraması" kartları simülasyon değil GÖZLEM olur.
 *
 * Usage:
 *   node seo-os-probe.js --site=siten.com --keywords="kelime1,kelime2"
 *   node seo-os-probe.js --site=siten.com            # .seo-os/keywords.txt'den okur
 *   node seo-os-probe.js --site=siten.com --dry-run  # ne sorulacağını göster, sorma
 *
 * Sağlayıcılar (env anahtarı olanlar çalışır, olmayanlar atlanır):
 *   PERPLEXITY_API_KEY  → Perplexity (model: PERPLEXITY_MODEL || sonar)
 *   OPENAI_API_KEY      → ChatGPT Search (web_search aracı; model: OPENAI_MODEL || gpt-4o-mini)
 *   GEMINI_API_KEY      → Gemini (google_search grounding; model: GEMINI_MODEL || gemini-2.0-flash)
 *
 * Skorlama: motor başına score = alıntılanan sorgu yüzdesi; wouldCite = en az bir
 * sorguda alıntılandı. Sorgu başına ~maliyet için sağlayıcı fiyatlandırmasına bak.
 * Ölçümden sonra geçmişe işlemek için: seo-os-dashboard.js --snapshot
 *
 * No external dependencies. Pure Node.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const https = require("https");
const { findSeoOsDir } = require("./seo-os-state-lib");

// ---- args -----------------------------------------------------------------
const argv = process.argv.slice(2);
const flagVal = (name, def) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : def;
};
const has = (name) => argv.includes(`--${name}`);
if (has("help") || argv.includes("-h")) {
  console.log(
    [
      "SEO-OS Probe — AI motorlarında gerçek alıntılanma ölçümü -> geo-report.json",
      "",
      "Usage: node seo-os-probe.js --site=siten.com [--keywords=a,b] [--dry-run] [--json]",
      "  --site=       zorunlu; alan adı (protokol/www olmadan da olur)",
      "  --keywords=   virgülle ayrılmış sorgular; yoksa .seo-os/keywords.txt (satır başına bir)",
      "  --template=   sorgu şablonu, {kw} yer tutucusu ile (varsayılan: kelimenin kendisi)",
      "  --dry-run     sağlayıcıları ve planlanan sorguları göster, API çağrısı yapma",
      "  --json        raporu stdout'a da bas",
      "",
      "Env: PERPLEXITY_API_KEY · OPENAI_API_KEY · GEMINI_API_KEY (en az biri gerekli)",
    ].join("\n")
  );
  process.exit(0);
}

const site = (flagVal("site", "") || "")
  .replace(/^https?:\/\//, "")
  .replace(/^www\./, "")
  .replace(/\/.*$/, "")
  .toLowerCase();
if (!site) {
  console.error("probe: --site=siten.com zorunlu.");
  process.exit(2);
}
const template = flagVal("template", "{kw}");
const dryRun = has("dry-run");
const asJson = has("json");

// ---- .seo-os dizini (dashboard/tracker ile aynı yukarı-yürüyüş) -------------
const SEO_OS_DIR = findSeoOsDir();
const OUT_PATH = path.join(SEO_OS_DIR, "geo-report.json");

// ---- keywords ----------------------------------------------------------------
function loadKeywords() {
  const flag = flagVal("keywords", "");
  if (flag) return flag.split(",").map((s) => s.trim()).filter(Boolean);
  const file = path.join(SEO_OS_DIR, "keywords.txt");
  if (fs.existsSync(file)) {
    return fs
      .readFileSync(file, "utf8")
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith("#"));
  }
  return [];
}
const keywords = loadKeywords();
if (!keywords.length) {
  console.error(
    `probe: anahtar kelime yok. --keywords="a,b" ver ya da ${path.join(SEO_OS_DIR, "keywords.txt")} oluştur (satır başına bir sorgu).`
  );
  process.exit(2);
}
const queries = keywords.map((kw) => template.replace("{kw}", kw));

// ---- sağlayıcılar --------------------------------------------------------------
// Her sağlayıcı: ask(query) -> Promise<string> (yanıtın ham JSON metni).
// Alıntı tespiti sağlayıcı-şema-bağımsızdır: yanıt gövdesindeki URL'lerde alan adı aranır.
function postJson({ hostname, path: apiPath, headers, body, timeoutMs = 90000 }) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = https.request(
      {
        hostname,
        path: apiPath,
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload), ...headers },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          if (res.statusCode >= 400) return reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
          resolve(data);
        });
      }
    );
    req.on("error", reject);
    req.setTimeout(timeoutMs, () => req.destroy(new Error(`timeout (${timeoutMs / 1000} sn)`)));
    req.write(payload);
    req.end();
  });
}

const PROVIDERS = [
  {
    name: "Perplexity",
    key: "PERPLEXITY_API_KEY",
    ask: (q) =>
      postJson({
        hostname: "api.perplexity.ai",
        path: "/chat/completions",
        headers: { Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}` },
        body: {
          model: process.env.PERPLEXITY_MODEL || "sonar",
          messages: [{ role: "user", content: q }],
        },
      }),
  },
  {
    name: "ChatGPT Search",
    key: "OPENAI_API_KEY",
    ask: (q) =>
      postJson({
        hostname: "api.openai.com",
        path: "/v1/responses",
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: {
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          tools: [{ type: "web_search" }],
          input: q,
        },
      }),
  },
  {
    name: "Gemini",
    key: "GEMINI_API_KEY",
    ask: (q) =>
      postJson({
        hostname: "generativelanguage.googleapis.com",
        path: `/v1beta/models/${process.env.GEMINI_MODEL || "gemini-2.0-flash"}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        headers: {},
        body: {
          contents: [{ parts: [{ text: q }] }],
          tools: [{ google_search: {} }],
        },
      }),
  },
];

const active = PROVIDERS.filter((p) => process.env[p.key]);

// yanıt gövdesindeki URL'lerde alan adını (alt alanlar dahil) ara
function citesSite(rawText) {
  const urls = rawText.match(/https?:\/\/[^\s"'\\<>)]+/g) || [];
  return urls.some((u) => {
    try {
      const host = new URL(u).hostname.toLowerCase().replace(/^www\./, "");
      return host === site || host.endsWith("." + site);
    } catch {
      return false;
    }
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- dry-run --------------------------------------------------------------------
console.error(`[probe] site: ${site} · ${queries.length} sorgu · sağlayıcılar: ${active.length ? active.map((p) => p.name).join(", ") : "YOK"}`);
if (!active.length) {
  console.error(
    "[probe] Hiç API anahtarı bulunamadı. En az birini ayarla:\n" +
      "  PERPLEXITY_API_KEY (önerilir — alıntı listesi döndürür)\n" +
      "  OPENAI_API_KEY · GEMINI_API_KEY"
  );
  if (!dryRun) process.exit(2);
}
if (dryRun) {
  queries.forEach((q, i) => console.log(`${i + 1}. ${q}`));
  console.log(`[probe] dry-run bitti — API çağrısı yapılmadı. Çıktı hedefi: ${OUT_PATH}`);
  process.exit(0);
}

// ---- ölçüm -----------------------------------------------------------------------
(async () => {
  const engines = {};
  for (const provider of active) {
    const cited = [];
    const failed = [];
    for (const q of queries) {
      try {
        const raw = await provider.ask(q);
        if (citesSite(raw)) cited.push(q);
        console.error(`[probe] ${provider.name} · "${q}" -> ${citesSite(raw) ? "ALINTILANDI ✓" : "alıntı yok"}`);
      } catch (e) {
        failed.push(q);
        console.error(`[probe] ${provider.name} · "${q}" -> HATA: ${e.message}`);
      }
      await sleep(600); // nazik hız sınırı
    }
    const asked = queries.length - failed.length;
    const score = asked ? Math.round((cited.length / asked) * 100) : 0;
    engines[provider.name] = {
      score,
      wouldCite: cited.length > 0,
      reason:
        `${cited.length}/${asked} sorguda ${site} kaynak olarak alıntılandı` +
        (cited.length ? ` (${cited.slice(0, 3).join(" · ")}${cited.length > 3 ? " …" : ""})` : "") +
        (failed.length ? ` · ${failed.length} sorgu hata verdi` : ""),
      citedQueries: cited,
    };
  }

  const scores = Object.values(engines).map((e) => e.score);
  const report = {
    $schema: "seo-os-validation/geo-simulation-v1",
    site,
    at: new Date().toISOString(),
    source: "probe (gerçek API sorguları)",
    keywords,
    overall: {
      citationLikelihoodScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
    },
    engines,
  };
  fs.mkdirSync(SEO_OS_DIR, { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + "\n");
  console.error(`[probe] rapor -> ${OUT_PATH}`);
  console.error(`[probe] geçmişe işlemek için: node seo-os-dashboard.js --snapshot --note="alıntılanma ölçümü"`);
  if (asJson) console.log(JSON.stringify(report, null, 2));
})().catch((e) => {
  console.error(`[probe] HATA: ${e.message}`);
  process.exit(1);
});
