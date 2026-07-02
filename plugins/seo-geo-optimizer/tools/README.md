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

## seo-os-dashboard.js

`.seo-os/seo-os-state.json`'u (+ varsa ölçüm dosyalarını) **kendi kendine yeten bir
`dashboard.html` fayda paneline** çevirir: önce→sonra AI Visibility, zaman içinde kazanım
grafiği (SVG), AI motor alıntılanma skorları (ChatGPT/Perplexity/Gemini/AI Overviews),
Core Web Vitals hedef karşılaştırması, faz haritası ve doğrulama delta raporu.
Harici JS/CSS yok — dosya tek başına paylaşılabilir (müşteri raporu olarak bile).

```bash
DASH="${CLAUDE_PLUGIN_ROOT}/tools/seo-os-dashboard.js"

# HTML üret (varsayılan çıktı: <state-dizini>/dashboard.html) ve tarayıcıda aç
node "$DASH" --open

# Her faz tamamlandığında ölçümü geçmişe işle (append-only JSONL), sonra HTML'i yenile
node "$DASH" --snapshot --note="D fazı: llms.txt yayınlandı"

# CANLI PANEL — proje standardı: SADECE localhost, port 3928
# (127.0.0.1'e bağlanır, dışarıya açılmaz; her istekte state'i taze okur)
node "$DASH" --serve --open        # http://localhost:3928 (ön planda, Ctrl+C ile kapanır)

# KALICI PANEL — terminalden/oturumdan bağımsız arka plan süreci
node "$DASH" --serve --daemon --open   # başlat (pid → .seo-os/dashboard.pid, log → .seo-os/dashboard.log)
node "$DASH" --status                  # çalışıyor mu?
node "$DASH" --stop                    # durdur

# Makine-okunur veri modeli (CI / sync için)
node "$DASH" --json
```

> **Port sözleşmesi:** panel yerelde her zaman `3928` portundan sunulur (`--port=` ile
> geçici olarak değiştirilebilir, ancak varsayılanı değiştirme — dokümanlar ve
> alışkanlıklar bu adrese bağlıdır: `http://localhost:3928`).

Opsiyonel girdiler — state dosyasının yanında otomatik aranır, bayrakla da verilebilir:

| Dosya | Bayrak | İçerik |
|-------|--------|--------|
| `metrics-history.jsonl` | `--history=` | `--snapshot`'ın yazdığı ölçüm geçmişi (trend grafiğinin kaynağı) |
| `geo-report.json` | `--geo=` | `seo-os-validation/geo-simulation-v1` — motor skorları (Başlık D/L çıktısı) |
| `cwv-report.json` | `--cwv=` | `{ "LCP_s": 2.1, "INP_ms": 160, "CLS": 0.04, "TTFB_ms": 920 }` |
| `delta-report.json` | `--delta=` | `seo-os-validation/delta-report-v1` — doğrulama önce/sonra skoru |

Eksik girdiler hata değildir; ilgili bölüm "veri yok" yönlendirmesiyle render edilir.
Snapshot geçmişi biriktikçe motor ve CWV kartları ilk ölçüme göre `önce → sonra` deltası gösterir.

**Tema:** panel varsayılan olarak **açık temada** açılır; sağ üstteki "🌙 Gece" düğmesi koyu moda
geçirir. Tercih tarayıcının `localStorage`'ında saklanır (grafik dahil tüm bölümler iki temada da uyumludur).

**Komuta Merkezi (oyun arayüzü):** panel bir oyun ekranı gibi davranır. Sci-fi hangar sahnesinde
dört robot karakter holografik platformlar üzerinde durur — Strateji-Bot (FAZ 0A/0B + A/B),
GEO-Bot (C–F), Teknik-Bot (G–I), Büyüme-Bot (J–L). Üstte **SEVİYE + XP barı** (tamamlanan görev
sayısı), her robotun altında isim plakası ve **modül/HP barı** vardır. Her tamamlanan görev robotu
alttan yukarı "inşa ederek" geliştirir; aktif görevi olan robot parlayarak titreşir. Faz haritası
**Görev Günlüğü**dür (✔ tamamlandı / ⚔ aktif / ⛔ engelli / 🔒 kilitli; her görev "+1 SEVİYE").
Altta **başarım rozetleri** açılır (Keşif Tamam, Stratejist, AI'da Görünür, Hız Şeytanı… 👑 PRIME).
**14/14 olduğunda** robotlar birleşme animasyonuyla toplanır ve enerji çekirdeği halesi içinde
**Prime** sahneye iner. Finali önceden görmek için: `--serve` çalışırken
`http://localhost:3928/?prime=1` (tüm fazları tamamlanmış sayar, veriyi değiştirmez).

Görsel varlıklar (hepsi base64 gömülür, çıktı tek dosya kalır; eksikse CSS/SVG yedeğe düşülür):
- `tools/assets/robots/{strateji,geo,teknik,buyume,prime}.png` — karakterler (şeffaf PNG)
- `tools/assets/game/{hangar,platform,orb}.jpg` — zemin/sahne, platform halkası, enerji çekirdeği
  (siyah zeminli VFX görüntüleri `mix-blend-mode: screen` ile kaynaştırılır)
Kendi görsellerinle değiştirebilirsin; adlar aynı kalsın yeter.

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
