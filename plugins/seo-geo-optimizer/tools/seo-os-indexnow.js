#!/usr/bin/env node
/**
 * SEO-OS INDEXNOW — anında indeksleme bildirimi
 * ------------------------------------------------------------------
 * Yeni/güncellenen URL'leri IndexNow protokolüyle (api.indexnow.org)
 * Bing + ortak motor ekosistemine anında bildirir. Deploy sonrası veya
 * içerik güncellemesinde çalıştır — tarama kuyruğunu beklemeden indekslen.
 * (Google IndexNow kullanmaz; Google tarafı sitemap + GSC ile yürür.)
 *
 * Kurulum (bir kez):
 *   node seo-os-indexnow.js --setup --site=https://siten.com [--public=public]
 *     -> rastgele anahtar üretir, {key}.txt dosyasını public dizinine yazar,
 *        yapılandırmayı .seo-os/indexnow.json'a kaydeder.
 *     Deploy'dan sonra https://siten.com/{key}.txt erişilebilir OLMALI.
 *
 * Bildirim:
 *   node seo-os-indexnow.js --url=https://siten.com/yeni-sayfa
 *   node seo-os-indexnow.js --sitemap=https://siten.com/sitemap.xml   # tümü (<=10000)
 *   node seo-os-indexnow.js --list=urls.txt                           # satır başına URL
 *   ... [--dry-run]  # gönderilecek payload'ı göster, gönderme
 *
 * No external dependencies. Pure Node.
 */
"use strict";
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const https = require("https");
const { findSeoOsDir } = require("./seo-os-state-lib");

const argv = process.argv.slice(2);
const flagVal = (n, d) => {
  const hit = argv.find((a) => a.startsWith(`--${n}=`));
  return hit ? hit.slice(n.length + 3) : d;
};
const has = (n) => argv.includes(`--${n}`);
if (has("help") || argv.includes("-h")) {
  console.log(
    [
      "SEO-OS IndexNow — yeni/güncellenen URL'leri arama motorlarına anında bildir",
      "",
      "Usage:",
      "  node seo-os-indexnow.js --setup --site=https://siten.com [--public=public]",
      "  node seo-os-indexnow.js --url=… | --sitemap=… | --list=urls.txt [--dry-run]",
    ].join("\n")
  );
  process.exit(0);
}

const SEO_OS_DIR = findSeoOsDir();
const CONF_PATH = path.join(SEO_OS_DIR, "indexnow.json");

// ---- kurulum --------------------------------------------------------------------
if (has("setup")) {
  const site = flagVal("site", "");
  if (!/^https?:\/\//.test(site)) {
    console.error("indexnow: --setup için --site=https://siten.com gerekli.");
    process.exit(2);
  }
  const host = new URL(site).host;
  const key = crypto.randomBytes(16).toString("hex");
  // anahtar dosyasının gideceği public dizinini bul
  const candidates = flagVal("public", "") ? [flagVal("public", "")] : ["public", "static", "dist", "out", "."];
  const pubDir = candidates.map((c) => path.resolve(c)).find((c) => fs.existsSync(c));
  const keyFile = path.join(pubDir || process.cwd(), `${key}.txt`);
  fs.writeFileSync(keyFile, key);
  fs.mkdirSync(SEO_OS_DIR, { recursive: true });
  fs.writeFileSync(
    CONF_PATH,
    JSON.stringify({ host, key, keyLocation: `https://${host}/${key}.txt`, createdAt: new Date().toISOString() }, null, 2) + "\n"
  );
  console.log(`[indexnow] anahtar üretildi ve kaydedildi:`);
  console.log(`  anahtar dosyası : ${keyFile}`);
  console.log(`  yapılandırma    : ${CONF_PATH}`);
  console.log(`[indexnow] ŞART: deploy sonrası https://${host}/${key}.txt 200 dönmeli.`);
  console.log(`[indexnow] sonra bildir: node seo-os-indexnow.js --sitemap=https://${host}/sitemap.xml`);
  process.exit(0);
}

// ---- yardımcılar -----------------------------------------------------------------
function fetchText(u) {
  return new Promise((resolve, reject) => {
    const lib = u.startsWith("https:") ? https : require("http");
    const req = lib.get(u, { headers: { "User-Agent": "seo-os-indexnow/1.0" } }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve({ status: res.statusCode, body: data }));
    });
    req.on("error", reject);
    req.setTimeout(20000, () => req.destroy(new Error("timeout")));
  });
}

async function collectUrls() {
  const single = flagVal("url", "");
  if (single) return [single];
  const listFile = flagVal("list", "");
  if (listFile) {
    return fs
      .readFileSync(path.resolve(listFile), "utf8")
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => /^https?:\/\//.test(s));
  }
  const sitemap = flagVal("sitemap", "");
  if (sitemap) {
    const res = await fetchText(sitemap);
    if (res.status !== 200) throw new Error(`sitemap ${res.status} döndü: ${sitemap}`);
    let urls = [...res.body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
    // sitemap index ise alt sitemap'leri de aç
    const subMaps = urls.filter((u) => /\.xml(\?|$)/i.test(u));
    if (subMaps.length && subMaps.length === urls.length) {
      urls = [];
      for (const sm of subMaps.slice(0, 50)) {
        const r = await fetchText(sm);
        if (r.status === 200) urls.push(...[...r.body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]));
      }
    }
    return urls.filter((u) => !/\.xml(\?|$)/i.test(u)).slice(0, 10000);
  }
  return [];
}

// ---- gönderim ---------------------------------------------------------------------
(async () => {
  if (!fs.existsSync(CONF_PATH)) {
    console.error(`indexnow: yapılandırma yok (${CONF_PATH}). Önce: --setup --site=https://siten.com`);
    process.exit(2);
  }
  const conf = JSON.parse(fs.readFileSync(CONF_PATH, "utf8"));
  const urls = await collectUrls();
  if (!urls.length) {
    console.error("indexnow: bildirilecek URL yok — --url= / --sitemap= / --list= verin.");
    process.exit(2);
  }
  const wrongHost = urls.filter((u) => {
    try { return new URL(u).host !== conf.host; } catch { return true; }
  });
  if (wrongHost.length) {
    console.error(`indexnow: ${wrongHost.length} URL yapılandırılmış host (${conf.host}) ile eşleşmiyor — atlandı.`);
  }
  const send = urls.filter((u) => !wrongHost.includes(u));
  if (!send.length) process.exit(2);

  const payload = { host: conf.host, key: conf.key, keyLocation: conf.keyLocation, urlList: send };
  if (has("dry-run")) {
    console.log(JSON.stringify(payload, null, 2));
    console.error(`[indexnow] dry-run — ${send.length} URL gönderilMEdi.`);
    process.exit(0);
  }

  // anahtar dosyası canlıda erişilebilir mi? (403'ün 1 numaralı sebebi)
  try {
    const chk = await fetchText(conf.keyLocation);
    if (chk.status !== 200 || chk.body.trim() !== conf.key)
      console.error(`[indexnow] UYARI: ${conf.keyLocation} doğrulanamadı (HTTP ${chk.status}) — 403 alırsan sebep bu.`);
  } catch (e) {
    console.error(`[indexnow] UYARI: anahtar dosyası kontrol edilemedi (${e.message}).`);
  }

  const body = JSON.stringify(payload);
  await new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "api.indexnow.org",
        path: "/indexnow",
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(body) },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          if (res.statusCode === 200 || res.statusCode === 202) {
            console.log(`[indexnow] ✓ ${send.length} URL bildirildi (HTTP ${res.statusCode}).`);
            resolve();
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200) || "(gövde yok)"} — 403=anahtar doğrulanamadı, 422=geçersiz URL, 429=çok sık`));
          }
        });
      }
    );
    req.on("error", reject);
    req.setTimeout(30000, () => req.destroy(new Error("timeout")));
    req.write(body);
    req.end();
  });
})().catch((e) => {
  console.error(`[indexnow] HATA: ${e.message}`);
  process.exit(1);
});
