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
