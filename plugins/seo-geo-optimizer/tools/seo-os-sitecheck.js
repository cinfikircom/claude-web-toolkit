#!/usr/bin/env node
/**
 * SEO-OS SITECHECK — iç linkleme, yetim sayfa, alt metin ve metadata taraması
 * ------------------------------------------------------------------
 * Siteyi tarayıp /seo-wizard'ın (ve Başlık F/H'nin) işleyeceği somut bir
 * bulgu listesi çıkarır: yetim sayfalar, zayıf anchor metinleri, alt'sız
 * görseller, kopya <title> ve eksik meta description.
 * Rapor: .seo-os/sitecheck-report.json (+ konsol özeti).
 *
 * Usage:
 *   node seo-os-sitecheck.js --url=https://siten.com [--max=200]   # canlı tarama (BFS, aynı origin)
 *   node seo-os-sitecheck.js --dir=dist                            # build çıktısındaki *.html
 *   node seo-os-sitecheck.js --url=… --json                        # raporu stdout'a da bas
 *
 * Yetim tespiti:
 *   URL modunda sitemap.xml (varsa) sayfa listesi kabul edilir; ana sayfadan
 *   BFS ile ulaşılamayan sitemap sayfaları "yetim" raporlanır.
 *   DIR modunda başka hiçbir sayfadan link almayan .html dosyaları yetimdir.
 *
 * No external dependencies. Pure Node (regex tabanlı HTML analizi — rapor amaçlı).
 */
"use strict";
const fs = require("fs");
const path = require("path");

const argv = process.argv.slice(2);
const flagVal = (n, d) => {
  const hit = argv.find((a) => a.startsWith(`--${n}=`));
  return hit ? hit.slice(n.length + 3) : d;
};
const has = (n) => argv.includes(`--${n}`);
if (has("help") || argv.includes("-h")) {
  console.log(
    [
      "SEO-OS Sitecheck — iç link / yetim sayfa / alt / title taraması -> sitecheck-report.json",
      "",
      "Usage: node seo-os-sitecheck.js (--url=https://siten.com | --dir=dist) [--max=200] [--json] [--out=path]",
    ].join("\n")
  );
  process.exit(0);
}
const startUrl = flagVal("url", "");
const dirMode = flagVal("dir", "");
const MAX_PAGES = Math.max(1, Number(flagVal("max", "200")));
const asJson = has("json");
if (!startUrl && !dirMode) {
  console.error("sitecheck: --url=https://… ya da --dir=build-çıktısı verin.");
  process.exit(2);
}

// .seo-os dizinini bul (probe ile aynı yukarı yürüyüş)
function findSeoOsDir() {
  let dir = process.cwd();
  for (let i = 0; i < 12; i++) {
    if (fs.existsSync(path.join(dir, ".seo-os"))) return path.join(dir, ".seo-os");
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(".seo-os");
}
const OUT_PATH = path.resolve(flagVal("out", path.join(findSeoOsDir(), "sitecheck-report.json")));

// ---- HTML analizi (regex tabanlı; rapor amaçlı yeterli) -------------------------
const GENERIC_ANCHORS = new Set([
  "buraya", "buraya tıkla", "tıkla", "tıklayın", "burada", "devamı", "devamını oku",
  "daha fazla", "detay", "detaylar", "incele", "link", "click here", "here", "click",
  "read more", "more", "learn more", "details", "this", "page",
]);
function stripTags(s) {
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
function analyzeHtml(html, pageId) {
  const out = { links: [], genericAnchors: [], imagesNoAlt: [], title: null, hasDesc: false, h1Count: 0 };
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (t) out.title = stripTags(t[1]);
  out.hasDesc = /<meta[^>]+name=["']description["'][^>]*content=["'][^"']+["']/i.test(html) ||
                /<meta[^>]+content=["'][^"']+["'][^>]*name=["']description["']/i.test(html);
  out.h1Count = (html.match(/<h1[\s>]/gi) || []).length;
  const aRe = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = aRe.exec(html))) {
    const attrs = m[1];
    const href = (attrs.match(/href=["']([^"']+)["']/i) || [])[1];
    if (!href || href.startsWith("#") || /^(mailto:|tel:|javascript:)/i.test(href)) continue;
    const text = stripTags(m[2]);
    const ariaLabel = (attrs.match(/aria-label=["']([^"']+)["']/i) || [])[1];
    out.links.push({ href, text });
    const label = (text || ariaLabel || "").toLowerCase();
    if (!label || GENERIC_ANCHORS.has(label))
      out.genericAnchors.push({ page: pageId, href, text: text || "(boş)" });
  }
  const imgRe = /<img\b[^>]*>/gi;
  let im;
  while ((im = imgRe.exec(html))) {
    const tag = im[0];
    const altM = tag.match(/alt=["']([^"']*)["']/i);
    if (!altM || !altM[1].trim()) {
      const src = (tag.match(/src=["']([^"']+)["']/i) || [])[1] || "(src yok)";
      if (!/aria-hidden=["']true["']|role=["']presentation["']/i.test(tag))
        out.imagesNoAlt.push({ page: pageId, src });
    }
  }
  return out;
}

// ---- URL modu -------------------------------------------------------------------
function fetchUrl(u, redirects = 3) {
  return new Promise((resolve, reject) => {
    const lib = u.startsWith("https:") ? require("https") : require("http");
    const req = lib.get(u, { headers: { "User-Agent": "seo-os-sitecheck/1.0" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects > 0) {
        res.resume();
        return resolve(fetchUrl(new URL(res.headers.location, u).href, redirects - 1));
      }
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve({ status: res.statusCode, body: data, url: u }));
    });
    req.on("error", reject);
    req.setTimeout(20000, () => req.destroy(new Error("timeout")));
  });
}
const norm = (u) => u.replace(/#.*$/, "").replace(/\/$/, "") || u;

async function crawlUrlMode() {
  const origin = new URL(startUrl).origin;
  const start = norm(startUrl);
  const queue = [start];
  const seen = new Set([start]);
  const pages = new Map(); // url -> analysis
  const errors = [];
  while (queue.length && pages.size < MAX_PAGES) {
    const u = queue.shift();
    try {
      const res = await fetchUrl(u);
      if (res.status >= 400) { errors.push({ page: u, error: `HTTP ${res.status}` }); continue; }
      const a = analyzeHtml(res.body, u);
      pages.set(u, a);
      for (const l of a.links) {
        let abs;
        try { abs = new URL(l.href, u).href; } catch { continue; }
        if (!abs.startsWith(origin)) continue;
        if (/\.(png|jpe?g|gif|svg|webp|pdf|zip|css|js|ico|xml|txt)(\?|$)/i.test(abs)) continue;
        const n = norm(abs);
        if (!seen.has(n)) { seen.add(n); queue.push(n); }
      }
    } catch (e) {
      errors.push({ page: u, error: e.message });
    }
  }
  // sitemap -> yetimler
  let sitemapUrls = [];
  try {
    const sm = await fetchUrl(origin + "/sitemap.xml");
    if (sm.status === 200) {
      sitemapUrls = [...sm.body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((x) => norm(x[1]))
        .filter((u) => u.startsWith(origin) && !/\.xml$/i.test(u));
    }
  } catch { /* sitemap yoksa yetim analizi crawl-only olur */ }
  const reached = new Set(pages.keys());
  const orphans = sitemapUrls.filter((u) => !reached.has(u));
  return { base: origin, pages, errors, orphans, sitemapCount: sitemapUrls.length };
}

// ---- DIR modu -------------------------------------------------------------------
function crawlDirMode() {
  const root = path.resolve(dirMode);
  if (!fs.existsSync(root)) { console.error(`sitecheck: dizin yok: ${root}`); process.exit(2); }
  const files = [];
  (function walk(d) {
    for (const f of fs.readdirSync(d)) {
      const p = path.join(d, f);
      const st = fs.statSync(p);
      if (st.isDirectory()) walk(p);
      else if (/\.html?$/i.test(f)) files.push(p);
    }
  })(root);
  const pages = new Map();
  const incoming = new Map(files.map((f) => [f, 0]));
  for (const f of files.slice(0, MAX_PAGES)) {
    const rel = path.relative(root, f);
    const a = analyzeHtml(fs.readFileSync(f, "utf8"), rel);
    pages.set(rel, a);
    for (const l of a.links) {
      if (/^https?:/i.test(l.href)) continue;
      let target = l.href.replace(/[?#].*$/, "");
      if (!target) continue;
      if (target.endsWith("/")) target += "index.html";
      if (!/\.html?$/i.test(target)) target += ".html"; // pretty URL -> dosya tahmini
      const cand = [path.resolve(path.dirname(f), target), path.resolve(root, target.replace(/^\//, ""))];
      for (const c of cand) if (incoming.has(c)) { incoming.set(c, incoming.get(c) + 1); break; }
    }
  }
  const orphans = files
    .filter((f) => incoming.get(f) === 0 && !/index\.html?$/i.test(f))
    .map((f) => path.relative(root, f));
  return { base: root, pages, errors: [], orphans, sitemapCount: 0 };
}

// ---- rapor ----------------------------------------------------------------------
(async () => {
  console.error(`[sitecheck] tarama başlıyor: ${startUrl || dirMode} (en çok ${MAX_PAGES} sayfa)`);
  const r = startUrl ? await crawlUrlMode() : crawlDirMode();

  const genericAnchors = [];
  const imagesNoAlt = [];
  const missingDesc = [];
  const multiH1 = [];
  const titleMap = new Map();
  for (const [page, a] of r.pages) {
    genericAnchors.push(...a.genericAnchors);
    imagesNoAlt.push(...a.imagesNoAlt);
    if (!a.hasDesc) missingDesc.push(page);
    if (a.h1Count !== 1) multiH1.push({ page, h1Count: a.h1Count });
    const key = a.title || "(title yok)";
    if (!titleMap.has(key)) titleMap.set(key, []);
    titleMap.get(key).push(page);
  }
  const dupTitles = [...titleMap.entries()]
    .filter(([t, ps]) => ps.length > 1 || t === "(title yok)")
    .map(([title, pages2]) => ({ title, pages: pages2 }));

  const report = {
    $schema: "seo-os/sitecheck-v1",
    at: new Date().toISOString(),
    mode: startUrl ? "url" : "dir",
    base: r.base,
    pagesScanned: r.pages.size,
    sitemapCount: r.sitemapCount,
    orphans: r.orphans,
    genericAnchors,
    imagesNoAlt,
    dupTitles,
    missingDesc,
    multiH1,
    crawlErrors: r.errors,
  };
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + "\n");

  console.error(`[sitecheck] ${r.pages.size} sayfa tarandı${r.sitemapCount ? ` · sitemap: ${r.sitemapCount} URL` : ""}`);
  console.error(`[sitecheck] yetim sayfa: ${r.orphans.length} · zayıf anchor: ${genericAnchors.length} · alt'sız görsel: ${imagesNoAlt.length}`);
  console.error(`[sitecheck] kopya/eksik title: ${dupTitles.length} grup · description eksik: ${missingDesc.length} · h1≠1: ${multiH1.length}`);
  console.error(`[sitecheck] rapor -> ${OUT_PATH}`);
  console.error(`[sitecheck] bulguları adım adım işlemek için: /seo-wizard`);
  if (asJson) console.log(JSON.stringify(report, null, 2));
})().catch((e) => {
  console.error(`[sitecheck] HATA: ${e.message}`);
  process.exit(1);
});
