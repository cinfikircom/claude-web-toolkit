# Cloudflare Edge & Performans

Amaç: Site Cloudflare ekosisteminde (Pages, R2, Workers, Tunnels, Zero Trust) ya da sadece CF
proxy/CDN arkasındaysa, edge yeteneklerini performans (Başlık I) ve crawlability (Başlık H)
adımlarına dahil etmek. Sunucu taraflı optimizasyonu framework ↔ Cloudflare Edge/Worker uyumuna
göre kurgula.

## Cloudflare tespiti
- HTTP yanıt başlıkları: `cf-ray`, `cf-cache-status`, `server: cloudflare`.
- Repo izleri: `wrangler.toml`, `_headers`, `_redirects`, `functions/` (Pages Functions),
  `@cloudflare/next-on-pages` / `@astrojs/cloudflare` bağımlılığı.

## Performans yetenekleri (Başlık I)
| Özellik | Ne yapar | Not |
|---------|----------|-----|
| **Polish** | Görselleri otomatik WebP/AVIF + kayıpsız/kayıplı sıkıştırma | Dashboard → Speed → Optimization. `cf-polished` header'ı doğrular |
| **Mirage** | Mobilde görsel lazy/adaptif yükleme | Düşük bağlantıda LCP'ye yardım |
| **Cloudflare Fonts** | Google Fonts'u edge'den, gizlilik dostu sunar | 3. parti font isteğini kaldırır → LCP/CLS |
| **Early Hints (103)** | `Link: rel=preload/preconnect` erken gönderir | CF destekler; `_headers` ile besle → `resource-hints.md` |
| **Cache Rules** | Yol bazlı edge cache politikası | "Cache Everything" yalnızca gerçekten statik yollarda |
| **Tiered Cache** | Edge'ler arası katmanlı cache — origin isteğini azaltır | Ücretsiz, tek tık; TTFB + cache hit oranı |
| **Cache Reserve** | R2 tabanlı kalıcı cache katmanı (eviction'a karşı) | Ücretli; büyük statik kataloglarda hit oranını korur |
| **APO** (WordPress) | HTML'i edge'de cache'ler, origin'e gitmez | Yalnızca WP; çıkış yapan kullanıcı için TTFB devrimi |
| **R2** | Sıfır-egress nesne deposu (görsel/asset) | Asset dağıtımını R2 + CDN'den yap |
| **Workers** | Edge'de SSR/transform/redirect | Origin TTFB'yi edge'e taşır |
| **Speed Brain** | Speculation Rules'u edge'den enjekte eder | `resource-hints.md` ile çakışmasın — tek kaynaktan yönet |

> **Not (Auto Minify):** Cloudflare Auto Minify 2024'te kaldırıldı — **minify'ı build aşamasında** yap
> (framework bundler'ı). CF'ye güvenme.

### Protokol & teslim katmanı (genelde "aç ve unut")
| Özellik | Kontrol | Not |
|---------|---------|-----|
| **Brotli / Zstandard** | Yanıtta `content-encoding: br` veya `zstd` var mı? | Varsayılan açık; origin'in `Accept-Encoding`'i ezmediğini doğrula |
| **HTTP/3 (QUIC)** | Dashboard → Network; `alt-svc: h3` header'ı | Mobil/kayıplı ağda TTFB iyileşir |
| **0-RTT** | Network → 0-RTT Connection Resumption | Tekrarlayan ziyaretçide TLS gecikmesini düşürür |
| **Early Hints** | yukarıdaki tablo — 103 | `_headers` Link satırı olmadan etkisiz |

### 3. parti script & güvenlik katmanı (INP/TBT ile ilişkili)
| Özellik | Ne yapar | SEO/CWV bağlamı |
|---------|----------|------------------|
| **Zaraz** | GA4/GTM/pikselleri **edge'de** çalıştırır | Ana thread'den 3.parti JS'i kaldırır → INP/TBT kazancı; GA4 kurulumunda (Başlık K) Cloudflare varsa öncelikli seçenek olarak değerlendir |
| **Turnstile** | CAPTCHA alternatifi (görünmez doğrulama) | Form dönüşümünü (Başlık J) reCAPTCHA'ya göre az sürtünmeyle korur; reCAPTCHA JS yükünü kaldırır |

### Cloudflare denetim kontrol listesi (Başlık I'da CF tespit edildiyse)
```
[ ] Polish açık mı (cf-polished header)?       [ ] Mirage (mobil ağırlıklı trafik varsa)
[ ] Cloudflare Fonts / font self-host          [ ] Early Hints + _headers Link satırları
[ ] Tiered Cache açık mı (ücretsiz)?           [ ] Cache Rules yol bazlı doğru mu?
[ ] Cache Reserve gerekli mi (büyük katalog)?  [ ] APO (yalnızca WordPress)
[ ] Brotli/Zstd aktif mi?                      [ ] HTTP/3 + 0-RTT açık mı?
[ ] Zaraz'a taşınabilir 3.parti script var mı? [ ] Turnstile ile reCAPTCHA değişimi?
[ ] Speed Brain ↔ manuel Speculation Rules çakışması yok
[ ] AI bot bloklaması KAPALI mı? (aşağıdaki bölüm — GEO için kritik)
```
Her madde için: mevcut durum → önerilen durum → beklenen metrik etkisi (LCP/TTFB/INP) → risk.

### `_headers` örneği (Pages — cache + preload)
```
/assets/*
  Cache-Control: public, max-age=31536000, immutable
/
  Link: </fonts/site.woff2>; rel=preload; as=font; type=font/woff2; crossorigin
```

## Crawlability uyarısı (Başlık H) — ÇOK ÖNEMLİ

Cloudflare AI botlarını **iki ayrı katmanda** engelleyebilir; ikisi de ayrı ayrı kapatılmalıdır.
Kullanıcıyı **tam ekran/ayar adıyla** yönlendir (gerçek vakada doğrulandı, 2026-06):

### Katman 1 — Yönetilen robots.txt (AI Crawl Control)
**Dashboard → zone → AI Crawl Control → "Managed robots.txt"** — açıklaması:
*"When enabled, Cloudflare creates or updates your robots.txt file to signal that your content
should not be used for AI training."* Bu özellik **varsayılan/teşvikli olarak açık gelebilir** ve
origin'in robots.txt'inin ÖNÜNE şunları enjekte eder: `Content-Signal: search=yes,ai-train=no` +
ClaudeBot/GPTBot/CCBot/Amazonbot/Google-Extended/meta-externalagent için `Disallow: /`.
- AI motorlarında **kaynak gösterilmek istiyorsan bu tiki KALDIRT.** (Koddaki robots dosyası doğru
  olsa bile ezilir; deploy ile düzelmez — yalnızca bu panel ayarıyla düzelir.)
- Belirti: canlı robots.txt'in başında "content signals" yorum bloğu + AI bot Disallow listesi varken
  repo'daki robots çıktısı en altta duruyordur.

### Katman 2 — Edge 403 (bot bloklama)
Robots düzelse bile **AI Crawl Control'deki crawler listesi** (her bot için satır bazında
Allow/Block) veya **Security → Bots → "Block AI Bots" / Super Bot Fight Mode** belirli botlara
(sık görülen: ClaudeBot, PerplexityBot) edge'den **403** döndürmeye devam edebilir — istek origin'e
hiç ulaşmaz (`server: cloudflare` + `cf-ray` ile ayırt edilir). İlgili botları **Allow** yaptırt.

### Doğrulama (iki katmanı ayrı ayrı test et)
```bash
# Katman 1: robots enjeksiyonu kalktı mı?
curl -s https://SITE/robots.txt | grep -iE "content-signal|claudebot|ccbot|gptbot"   # boş dönmeli
# Katman 2: edge 403 kalktı mı? (hepsi 200 olmalı)
for ua in ClaudeBot GPTBot CCBot PerplexityBot Google-Extended; do
  printf "%-16s %s\n" "$ua:" "$(curl -s -o /dev/null -w '%{http_code}' -A "$ua" https://SITE/)"
done
```
Robots temiz + tüm UA'lar 200 olmadan Başlık H'nin bu maddesini `completed` yapma (→ `references/ai-crawler-audit.md`).

## Framework + Cloudflare
- **Next.js:** `@cloudflare/next-on-pages` (Pages) — edge runtime uyumlu route'lar; `next/image` loader'ını CF'ye uyarla.
- **Astro:** `@astrojs/cloudflare` adapter (SSR) ya da statik + Pages.
- **SvelteKit/Nuxt:** Cloudflare adapter/preset.
- Render stratejisi (Başlık I): statik → Pages CDN; dinamik → Workers/edge SSR; kişisel veri → origin.

## Çıktı
- CF kullanımı tespiti + aktif/pasif edge özellikleri.
- Açılması önerilen (Polish, Fonts, Early Hints, Cache Rules) ve **AI bot bloklamasının durumu**.
- Framework-CF uyum önerileri (Low/Medium/High risk).
