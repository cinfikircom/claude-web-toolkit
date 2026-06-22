# tools/ — SEO-OS yardımcı araçları

Bağımsız, bağımlılıksız (saf Node) operasyon araçları. Plugin runtime'ı bunları
zorunlu kılmaz; `.seo-os/seo-os-state.json`'u terminalden izlemek/raporlamak isteyen
kullanıcılar içindir.

## seo-os-tracker.js

`.seo-os/seo-os-state.json`'u (SEO-OS v2 tek doğruluk kaynağı) okuyup
[`references/execution-model.md`](../skills/seo-geo-audit/references/execution-model.md)'deki
**deterministic dashboard**'u terminalde render eder.

> **Yol notu:** Plugin marketplace'ten kurulduğunda bu dosya kullanıcının projesinde değil,
> plugin kurulum dizinindedir. Claude Code içinden çalıştırırken gerçek yol
> `${CLAUDE_PLUGIN_ROOT}/tools/seo-os-tracker.js`'tir. Aşağıdaki örneklerdeki `$TRACKER`
> bunu temsil eder; repo'yu klonlayarak kullanıyorsan
> `TRACKER=plugins/seo-geo-optimizer/tools/seo-os-tracker.js` de diyebilirsin.

```bash
TRACKER="${CLAUDE_PLUGIN_ROOT}/tools/seo-os-tracker.js"

# Proje kökünden (state dosyasını otomatik bulur — CWD'den üst dizinlere doğru
# önce .seo-os/seo-os-state.json, sonra eski kök konumunu arar)
node "$TRACKER"

# Açık yol
node "$TRACKER" path/to/.seo-os/seo-os-state.json

# Faz adları + notlar + son 5 log
node "$TRACKER" --detail

# Dosya her değiştiğinde canlı yeniden çiz
node "$TRACKER" --watch

# Makine-okunur özet (CI / sync için)
node "$TRACKER" --json

# ANSI renkleri kapat
node "$TRACKER" --no-color
```

Durum sembolleri (`phases[x].status` → sembol):
`not_started [ ]` · `in_progress [~]` · `completed [✓]` · `blocked [!]`.

Çıktı, `=== SEO-OS DASHBOARD ===` bloğu için sabit formatı korur; altına türetilmiş
ilerleme çubuğu (% ve done/active/blocked sayıları) ekler. `--detail` ayrıca faz
etiketlerini, notları ve son log girdilerini gösterir.

## seo-os-sync.js

`.seo-os/seo-os-state.json`'u (SSOT) **GitHub Issues** ve/veya **Notion** veritabanına
senkronlayan opsiyonel köprü. Varsayılan **dry-run**'dır — ne gönderileceğini yazar, göndermez.

```bash
SYNC="${CLAUDE_PLUGIN_ROOT}/tools/seo-os-sync.js"

# Önizleme (markdown'ı bas, hiçbir yere gönderme)
node "$SYNC" --md

# Dry-run: ne yapılacağını göster
node "$SYNC" --github --notion

# Gerçekten gönder
node "$SYNC" --github --apply                 # gh CLI + gh auth login gerekir
NOTION_TOKEN=... NOTION_DATABASE_ID=... \
node "$SYNC" --notion --apply
```

- **GitHub:** "SEO-OS: <proje> durum takibi" başlıklı **tek** izleme issue'sunu `seo-os`
  etiketiyle oluşturur/günceller; ilerleme %100 olunca kapatır. `gh` CLI gerekir.
- **Notion:** Veritabanında proje adıyla sayfayı upsert eder. DB sözleşmesi
  (property adı → tipi): `Name` → title · `Phase` → rich_text · `Mode` → rich_text ·
  `Progress` → number · `UpdatedAt` → date.
- State dosyası tracker ile aynı kuralla otomatik bulunur (CWD'den yukarı), açık yol da verilebilir.
