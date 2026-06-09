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
| **Cache Rules / Tiered Cache** | Statik içeriği edge'de tut, origin yükünü azalt | "Cache Everything" yalnızca gerçekten statik yollarda |
| **R2** | Sıfır-egress nesne deposu (görsel/asset) | Asset dağıtımını R2 + CDN'den yap |
| **Workers** | Edge'de SSR/transform/redirect | Origin TTFB'yi edge'e taşır |

> **Not (Auto Minify):** Cloudflare Auto Minify 2024'te kaldırıldı — **minify'ı build aşamasında** yap
> (framework bundler'ı). CF'ye güvenme.

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
