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
Cloudflare'in **"Block AI Bots / AI Scrapers and Crawlers"** özelliği (Dashboard → Security → Bots,
veya WAF managed rule) GPTBot, ClaudeBot, PerplexityBot, CCBot gibi botları **engeller**.
- AI motorlarında **kaynak gösterilmek istiyorsan** bu özelliği **açma** (ya da ilgili botlara izin ver).
- "Bot Fight Mode" / "Super Bot Fight Mode" da meşru arama botlarını yanlışlıkla engelleyebilir → AI/arama UA'larını allowlist'e al.
- Doğrula: `curl -A "GPTBot" https://SITE/` edge'den 403/challenge dönüyor mu? (→ `references/ai-crawler-audit.md`)

## Framework + Cloudflare
- **Next.js:** `@cloudflare/next-on-pages` (Pages) — edge runtime uyumlu route'lar; `next/image` loader'ını CF'ye uyarla.
- **Astro:** `@astrojs/cloudflare` adapter (SSR) ya da statik + Pages.
- **SvelteKit/Nuxt:** Cloudflare adapter/preset.
- Render stratejisi (Başlık I): statik → Pages CDN; dinamik → Workers/edge SSR; kişisel veri → origin.

## Çıktı
- CF kullanımı tespiti + aktif/pasif edge özellikleri.
- Açılması önerilen (Polish, Fonts, Early Hints, Cache Rules) ve **AI bot bloklamasının durumu**.
- Framework-CF uyum önerileri (Low/Medium/High risk).
