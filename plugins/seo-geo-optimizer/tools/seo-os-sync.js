#!/usr/bin/env node
/**
 * SEO-OS SYNC BRIDGE — GitHub Issues + Notion
 * ------------------------------------------------------------------
 * `.seo-os/seo-os-state.json`'u (SSOT) okuyup durumu dışarıya senkronlar:
 *
 *   GitHub : "SEO-OS: <proje> durum takibi" başlıklı TEK izleme issue'sunu
 *            oluşturur/günceller (gh CLI gerekir, `seo-os` etiketi).
 *   Notion : NOTION_DATABASE_ID veritabanında proje adıyla sayfayı
 *            upsert eder (NOTION_TOKEN + NOTION_DATABASE_ID env).
 *
 * Kullanım:
 *   node seo-os-sync.js [state.json] [--github] [--notion] [--apply] [--md]
 *
 *   Varsayılan DRY-RUN'dır: ne gönderileceğini yazar, göndermez.
 *   --apply     gerçekten gönder
 *   --github    GitHub Issues senkronu
 *   --notion    Notion senkronu
 *   --md        sadece render edilen markdown'ı bas (sync yok)
 *
 * Notion veritabanı sözleşmesi (property adı → tipi):
 *   Name → title · Phase → rich_text · Mode → rich_text ·
 *   Progress → number · UpdatedAt → date
 *
 * Bağımlılıksız saf Node (GitHub için sistemde `gh` CLI aranır).
 */
"use strict";
const { spawnSync } = require("child_process");
const fs = require("fs");
const https = require("https");
const path = require("path");

const args = process.argv.slice(2);
const has = (n) => args.includes(`--${n}`);
const positional = args.filter((a) => !a.startsWith("--"));

// ---------------------------------------------------------------- state
function findState() {
  if (positional[0]) return path.resolve(positional[0]);
  let dir = process.cwd();
  for (;;) {
    for (const rel of [".seo-os/seo-os-state.json", "seo-os-state.json"]) {
      const p = path.join(dir, rel);
      if (fs.existsSync(p)) return p;
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}
const statePath = findState();
if (!statePath) {
  console.error("seo-os-state.json bulunamadı (CWD'den yukarı arandı). Yol verin: node seo-os-sync.js path/to/state.json");
  process.exit(2);
}
const state = JSON.parse(fs.readFileSync(statePath, "utf8"));

// ---------------------------------------------------------------- render
const phases = state.phases || {};
const phaseIds = Object.keys(phases);
const count = (s) => phaseIds.filter((id) => phases[id].status === s).length;
const done = count("completed");
const progressPct = phaseIds.length ? Math.round((done / phaseIds.length) * 100) : 0;
const SYM = { not_started: "[ ]", in_progress: "[~]", completed: "[✓]", blocked: "[!]" };

function renderMarkdown() {
  const rows = phaseIds
    .map((id) => `| ${id} | ${SYM[phases[id].status] || "[?]"} \`${phases[id].status}\` | ${phases[id].notes || ""} |`)
    .join("\n");
  const blocked = (state.blocked || []).map((b) => `- ⏳ ${typeof b === "string" ? b : JSON.stringify(b)}`).join("\n");
  const logs = (state.log || []).slice(-5).map((l) => `- ${typeof l === "string" ? l : JSON.stringify(l)}`).join("\n");
  const aivs = state.aiVisibilityScore || {};
  return `## SEO-OS Durum — ${state.project || "?"}

**Mod:** \`${state.mode || "?"}\` · **Aktif faz:** \`${state.currentPhase || "—"}\` · **İlerleme:** ${progressPct}% (${done}/${phaseIds.length})
**AI Visibility Score:** önce ${aivs.before ?? "—"} → şimdi ${aivs.current ?? "—"}
**Son güncelleme:** ${state.updatedAt || "—"}

| Faz | Durum | Not |
|-----|-------|-----|
${rows}

${blocked ? `### Dış bekleyenler (blocked)\n${blocked}\n` : ""}${logs ? `### Son log\n${logs}\n` : ""}
---
_Bu issue [seo-os-sync](https://github.com/cinfikircom/claude-web-toolkit) tarafından \`${path.basename(statePath)}\` SSOT'undan otomatik üretildi — elle düzenlemeyin._`;
}
const md = renderMarkdown();

if (has("md")) {
  console.log(md);
  process.exit(0);
}
const apply = has("apply");
if (!has("github") && !has("notion")) {
  console.error("en az bir hedef seçin: --github ve/veya --notion (--md = sadece önizleme)");
  process.exit(2);
}
if (!apply) console.error("[sync] DRY-RUN — gönderim için --apply ekleyin\n");

// ---------------------------------------------------------------- github
function gh(ghArgs, input) {
  const res = spawnSync("gh", ghArgs, { encoding: "utf8", input });
  if (res.error && res.error.code === "ENOENT")
    throw new Error("`gh` CLI bulunamadı — GitHub senkronu için GitHub CLI kurun ve `gh auth login` yapın.");
  if (res.status !== 0) throw new Error(`gh ${ghArgs[0]} ${ghArgs[1] || ""} hata:\n${res.stderr}`);
  return res.stdout.trim();
}

function syncGithub() {
  const title = `SEO-OS: ${state.project || "proje"} durum takibi`;
  if (!apply) {
    console.error(`[github] issue upsert edilecek: "${title}" (label: seo-os)`);
    console.error(md.split("\n").slice(0, 8).map((l) => "  | " + l).join("\n") + "\n  | …\n");
    return;
  }
  // seo-os etiketi yoksa oluştur (varsa hata verir — yoksay)
  spawnSync("gh", ["label", "create", "seo-os", "--color", "1D76DB", "--description", "SEO-OS otomatik durum takibi"], { encoding: "utf8" });

  const found = gh(["issue", "list", "--label", "seo-os", "--state", "all", "--search", `in:title "${title}"`, "--json", "number,title"]);
  const hit = (JSON.parse(found || "[]") || []).find((i) => i.title === title);
  if (hit) {
    gh(["issue", "edit", String(hit.number), "--body-file", "-"], md);
    if (progressPct === 100) spawnSync("gh", ["issue", "close", String(hit.number)], { encoding: "utf8" });
    console.error(`[github] issue #${hit.number} güncellendi${progressPct === 100 ? " (tamamlandı, kapatıldı)" : ""}`);
  } else {
    const url = gh(["issue", "create", "--title", title, "--label", "seo-os", "--body-file", "-"], md);
    console.error(`[github] issue oluşturuldu: ${url}`);
  }
}

// ---------------------------------------------------------------- notion
function notionReq(method, apiPath, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "api.notion.com",
        path: apiPath,
        method,
        headers: {
          Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          const json = JSON.parse(data || "{}");
          if (res.statusCode >= 400)
            return reject(new Error(`Notion ${res.statusCode}: ${json.message || data.slice(0, 300)}`));
          resolve(json);
        });
      }
    );
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function syncNotion() {
  const dbId = process.env.NOTION_DATABASE_ID;
  const props = {
    Name: { title: [{ text: { content: state.project || "SEO-OS projesi" } }] },
    Phase: { rich_text: [{ text: { content: String(state.currentPhase || "—") } }] },
    Mode: { rich_text: [{ text: { content: String(state.mode || "—") } }] },
    Progress: { number: progressPct },
    UpdatedAt: state.updatedAt ? { date: { start: state.updatedAt } } : undefined,
  };
  if (!props.UpdatedAt) delete props.UpdatedAt;

  if (!apply) {
    console.error(`[notion] DB ${dbId || "(NOTION_DATABASE_ID tanımsız!)"} içinde upsert edilecek properties:`);
    console.error("  " + JSON.stringify(props));
    return;
  }
  if (!process.env.NOTION_TOKEN || !dbId)
    throw new Error("NOTION_TOKEN ve NOTION_DATABASE_ID env değişkenleri gerekli.");

  const q = await notionReq("POST", `/v1/databases/${dbId}/query`, {
    filter: { property: "Name", title: { equals: state.project || "SEO-OS projesi" } },
    page_size: 1,
  });
  if (q.results && q.results.length) {
    await notionReq("PATCH", `/v1/pages/${q.results[0].id}`, { properties: props });
    console.error(`[notion] sayfa güncellendi: ${q.results[0].id}`);
  } else {
    const created = await notionReq("POST", "/v1/pages", {
      parent: { database_id: dbId },
      properties: props,
    });
    console.error(`[notion] sayfa oluşturuldu: ${created.id}`);
  }
}

// ---------------------------------------------------------------- main
(async () => {
  if (has("github")) syncGithub();
  if (has("notion")) await syncNotion();
  console.error("[sync] bitti.");
})().catch((e) => {
  console.error("[sync] HATA:", e.message);
  process.exit(1);
});
