# tools/ — SEO-OS yardımcı araçları

Bağımsız, bağımlılıksız (saf Node) operasyon araçları. Plugin runtime'ı bunları
zorunlu kılmaz; `seo-os-state.json`'u terminalden izlemek/raporlamak isteyen
kullanıcılar içindir.

## seo-os-tracker.js

`seo-os-state.json`'u (SEO-OS v2 tek doğruluk kaynağı) okuyup
[`references/execution-model.md`](../skills/seo-geo-audit/references/execution-model.md)'deki
**deterministic dashboard**'u terminalde render eder.

```bash
# Proje kökünden (state dosyasını otomatik bulur — üst dizinlere doğru arar)
node seo-os-tracker.js

# Açık yol
node seo-os-tracker.js path/to/seo-os-state.json

# Faz adları + notlar + son 5 log
node seo-os-tracker.js --detail

# Dosya her değiştiğinde canlı yeniden çiz
node seo-os-tracker.js --watch

# Makine-okunur özet (CI / sync için)
node seo-os-tracker.js --json

# ANSI renkleri kapat
node seo-os-tracker.js --no-color
```

Durum sembolleri (`phases[x].status` → sembol):
`not_started [ ]` · `in_progress [~]` · `completed [✓]` · `blocked [!]`.

Çıktı, `=== SEO-OS DASHBOARD ===` bloğu için sabit formatı korur; altına türetilmiş
ilerleme çubuğu (% ve done/active/blocked sayıları) ekler. `--detail` ayrıca faz
etiketlerini, notları ve son log girdilerini gösterir.
