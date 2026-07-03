#!/usr/bin/env node
/**
 * SEO-OS GSC BRIDGE — Google Search Console gerçek arama verisi
 * ------------------------------------------------------------------
 * Service-account ile Search Console Search Analytics API'sinden son N günün
 * tıklama / gösterim / CTR / ortalama pozisyon verisini çeker ve panelin
 * okuduğu `.seo-os/gsc-report.json`a yazar. Dış SEO çalışmasının etkisi
 * böylece panelde GERÇEK trafik verisiyle görünür.
 *
 * Kurulum (bir kez, ~5 dk):
 *   1. https://console.cloud.google.com → proje seç/oluştur →
 *      "APIs & Services" → "Search Console API"yi ETKİNLEŞTİR.
 *   2. "IAM & Admin → Service Accounts" → hesap oluştur → "Keys" → JSON anahtar indir.
 *   3. https://search.google.com/search-console → Ayarlar → Kullanıcılar →
 *      service account e-postasını (…@…iam.gserviceaccount.com) "Tam" yetkiyle ekle.
 *
 * Usage:
 *   node seo-os-gsc.js --site=sc-domain:siten.com --creds=sa.json [--days=28]
 *   node seo-os-gsc.js --site=https://siten.com/ ...   # URL-prefix property
 *   (creds için GOOGLE_APPLICATION_CREDENTIALS env de kullanılabilir)
 *
 * Sonra: node seo-os-dashboard.js --snapshot  → GSC toplamları geçmişe işlenir.
 * No external dependencies. Pure Node (JWT RS256 imzası crypto ile).
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
      "SEO-OS GSC Bridge — Search Console verisini gsc-report.json'a çek",
      "",
      "Usage: node seo-os-gsc.js --site=<property> [--creds=sa.json] [--days=28] [--json]",
      "  --site=   GSC property: sc-domain:siten.com  YA DA  https://siten.com/",
      "  --creds=  service-account JSON anahtarı (veya GOOGLE_APPLICATION_CREDENTIALS env)",
      "  Kurulum adımları dosya başındaki yorumda.",
    ].join("\n")
  );
  process.exit(0);
}

const site = flagVal("site", "");
const days = Math.max(1, Math.min(90, Number(flagVal("days", "28"))));
const mockPath = flagVal("gsc-mock", ""); // test/CI: ağ yerine dosyadan API yanıtı
const asJson = has("json");

const OUT_PATH = path.join(findSeoOsDir(), "gsc-report.json");

if (!site && !mockPath) {
  console.error("gsc: --site=sc-domain:siten.com (veya https://siten.com/) gerekli.");
  process.exit(2);
}

// ---- service-account JWT -> access token ------------------------------------
const b64url = (b) => Buffer.from(b).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
function postForm(hostname, apiPath, form) {
  const body = Object.entries(form).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
  return httpsReq({ hostname, path: apiPath, method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "Content-Length": Buffer.byteLength(body) } }, body);
}
function httpsReq(opts, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(opts, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        let json;
        try { json = JSON.parse(data || "{}"); } catch { return reject(new Error(`HTTP ${res.statusCode}: JSON olmayan yanıt`)); }
        if (res.statusCode >= 400)
          return reject(new Error(`HTTP ${res.statusCode}: ${(json.error && (json.error.message || json.error_description)) || data.slice(0, 200)}`));
        resolve(json);
      });
    });
    req.on("error", reject);
    req.setTimeout(60000, () => req.destroy(new Error("timeout")));
    if (body) req.write(body);
    req.end();
  });
}
async function accessToken() {
  const credsPath = flagVal("creds", process.env.GOOGLE_APPLICATION_CREDENTIALS || "");
  if (!credsPath) throw new Error("--creds=sa.json verin ya da GOOGLE_APPLICATION_CREDENTIALS ayarlayın (kurulum: dosya başı yorum).");
  const creds = JSON.parse(fs.readFileSync(path.resolve(credsPath), "utf8"));
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({
    iss: creds.client_email,
    scope: "https://www.googleapis.com/auth/webmasters.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now, exp: now + 3600,
  }));
  const input = `${header}.${claim}`;
  const sig = crypto.createSign("RSA-SHA256").update(input).sign(creds.private_key);
  const jwt = `${input}.${b64url(sig)}`;
  const tok = await postForm("oauth2.googleapis.com", "/token", {
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: jwt,
  });
  return tok.access_token;
}

// ---- search analytics sorgusu -------------------------------------------------
async function fetchAnalytics() {
  if (mockPath) return JSON.parse(fs.readFileSync(path.resolve(mockPath), "utf8"));
  const token = await accessToken();
  const end = new Date(Date.now() - 2 * 86400000); // GSC verisi ~2 gün geriden gelir
  const start = new Date(end.getTime() - (days - 1) * 86400000);
  const iso = (d) => d.toISOString().slice(0, 10);
  const body = JSON.stringify({ startDate: iso(start), endDate: iso(end), dimensions: ["date"], rowLimit: 1000 });
  console.error(`[gsc] ${site} · ${iso(start)} → ${iso(end)} sorgulanıyor…`);
  return httpsReq({
    hostname: "www.googleapis.com",
    path: `/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`,
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
  }, body);
}

(async () => {
  const data = await fetchAnalytics();
  const rows = (data.rows || []).map((r) => ({
    date: r.keys[0],
    clicks: r.clicks || 0,
    impressions: r.impressions || 0,
    ctr: Math.round((r.ctr || 0) * 1000) / 10,
    position: Math.round((r.position || 0) * 10) / 10,
  })).sort((a, b) => a.date.localeCompare(b.date));
  if (!rows.length) console.error("[gsc] uyarı: satır dönmedi — property adı doğru mu, service account GSC'ye eklendi mi?");
  const sum = (k) => rows.reduce((a, r) => a + r[k], 0);
  const clicks = sum("clicks"), impressions = sum("impressions");
  const totals = {
    clicks,
    impressions,
    ctr: impressions ? Math.round((clicks / impressions) * 1000) / 10 : 0,
    position: rows.length
      ? Math.round((rows.reduce((a, r) => a + r.position * r.impressions, 0) / Math.max(1, impressions)) * 10) / 10
      : 0,
  };
  const report = {
    $schema: "seo-os/gsc-report-v1",
    site: site || "(mock)",
    at: new Date().toISOString(),
    days,
    totals,
    daily: rows,
  };
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + "\n");
  console.error(`[gsc] ${rows.length} gün → ${OUT_PATH}`);
  console.error(`[gsc] toplam: ${totals.clicks} tıklama · ${totals.impressions} gösterim · CTR %${totals.ctr} · ort. pozisyon ${totals.position}`);
  console.error(`[gsc] geçmişe işlemek için: node seo-os-dashboard.js --snapshot --note="GSC ölçümü"`);
  if (asJson) console.log(JSON.stringify(report, null, 2));
})().catch((e) => {
  console.error(`[gsc] HATA: ${e.message}`);
  process.exit(1);
});
