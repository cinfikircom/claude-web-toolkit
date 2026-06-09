# Off-Site Kurulum & Arama Motoru Kaydı (rehberli)

Bu görevlerin çoğu **kod tabanının dışındadır** — hesap açma, doğrulama, gönderim. Claude senin
hesaplarına giriş yapamaz; ama **adım adım yönlendirir**, kod tarafını hazırlar (doğrulama dosyası/
etiketi, sitemap, analytics tag'i) ve sonucu kontrol eder.

> **Rehberli kural:** Her adımı **tek tek** sun. Claude'un yapabileceğini yap; kullanıcının yapması
> gerekeni net talimatla iste, **"tamamlandı"** onayını bekle, doğrula, `seo-gorev-listesi.md`'de işaretle,
> sonra bir sonraki adıma geç. Sırayı atlamayı kullanıcı isterse atla.

## Sorumluluk paylaşımı
| Görev | Claude yapabilir | Kullanıcı yapmalı |
|-------|------------------|-------------------|
| Doğrulama HTML dosyası / meta tag | ✅ üretir + head'e/public'e koyar | DNS TXT eklemeyi tercih ederse registrar'da ekler |
| sitemap.xml üretimi | ✅ (framework'e uygun) | — |
| sitemap'i GSC/Bing'e gönderme | ❌ (hesap erişimi yok) | ✅ panelden gönderir |
| GA4 ölçüm kodunu enjekte etme | ✅ (framework-aware) | GA4 property'i kullanıcı açar, ID'yi verir |
| Hesap açma / doğrulama onayı | ❌ | ✅ |

---

## 1. Google Search Console (GSC) — en kritik
URL: **https://search.google.com/search-console**

1. **Property tipi seç:** *Domain* (DNS — tüm alt alan adı + http/https'i kapsar, önerilen) ya da
   *URL prefix* (tek protokol/host).
2. **Doğrulama:**
   - **DNS TXT** (en sağlam, Domain için zorunlu) → kullanıcı registrar'a (GoDaddy, Cloudflare…) TXT kaydı ekler.
   - **HTML dosyası** → Claude `public/google*.html` dosyasını oluşturur, deploy edilir.
   - **HTML meta tag** → Claude `<head>`'e `<meta name="google-site-verification" …>` ekler.
   - **GA / GTM** → zaten kuruluysa tek tık.
3. **Sitemap gönder:** *Sitemaps* → `https://SITE/sitemap.xml` ekle.
4. **URL Inspection** → önemli sayfalar için *Request indexing*.
5. **İzle:** *Pages* (indeksleme), *Core Web Vitals* raporu, *Enhancements* (rich result), *Performance* (sorgular).

## 2. Bing Webmaster Tools — DuckDuckGo, Yahoo, Ecosia'yı da kapsar
URL: **https://www.bing.com/webmasters**

> **Not:** DuckDuckGo'nun ayrı bir gönderim formu **yoktur** — sonuçlarını büyük ölçüde Bing
> indeksinden + kendi `DuckDuckBot`'undan üretir. Yani **Bing'e kayıt = DuckDuckGo kapsamı**.
> `robots.txt`'te `DuckDuckBot` ve `Bingbot` engellenmemeli.

1. *Import from GSC* (tek tık, en hızlı) veya XML dosyası / meta / CNAME ile doğrula.
2. Sitemap gönder.
3. **IndexNow** (anında URL bildirimi — Bing, Yandex, Seznam destekler): Claude bir anahtar dosyası
   (`/{key}.txt`) oluşturur ve değişen URL'leri IndexNow endpoint'ine ping'ler. URL: https://www.indexnow.org/

## 3. Yandex Webmaster (opsiyonel — RU/TR trafiği belirginse)
URL: **https://webmaster.yandex.com** — doğrula, sitemap gönder.

## 4. Google Analytics 4 (GA4)
URL: **https://analytics.google.com**

1. Kullanıcı: *Property* oluştur → *Web data stream* → **Measurement ID** (`G-XXXXXXX`) alır.
2. Claude: ölçüm kodunu **framework'e uygun** enjekte eder:
   - Next.js: `@next/third-parties/google` → `<GoogleAnalytics gaId="G-…" />`
   - Nuxt: `nuxt-gtag` modülü · SvelteKit/Astro: gtag snippet ya da GTM
   - Düz HTML: `<head>`'e gtag.js snippet'i
3. **GSC ↔ GA4 bağla:** GA4 *Admin → Product links → Search Console links*.
4. **KVKK/GDPR:** çerez/rıza banner'ı + Google *Consent Mode v2* değerlendir (yasal gereklilik).

## 5. Google Business Profile (yerel SEO — LocalBusiness entity ile bağ)
URL: **https://business.google.com**

- İşletmeyi talep et/doğrula. **NAP** (Name-Address-Phone) sitedeki `LocalBusiness` schema ile **birebir aynı** olsun.
- Profil URL'sini schema `sameAs`'a ekle (otorite sinyali → bkz. `references/entity-graph.md`).

## 6. Sitemap & robots — gönderim özeti
- `sitemap.xml` var, geçerli ve `robots.txt`'te referanslı olsun (→ `references/ai-crawler-audit.md`).
- GSC **ve** Bing'e gönderilmiş olsun. Değişiklikte IndexNow ile hızlandır.

## Bitiş doğrulaması
- [ ] GSC doğrulandı + sitemap gönderildi + önemli sayfalar indeksleniyor
- [ ] Bing doğrulandı + sitemap gönderildi (DuckDuckGo/Yahoo kapsanır)
- [ ] GA4 kurulu, veri akıyor, GSC'ye bağlı
- [ ] (Yerelse) Google Business Profile doğrulandı, NAP tutarlı
- [ ] AI/arama botları `robots.txt`'te engellenmemiş

> Bu adımlar tamamlandıktan sonra **harici skor doğrulaması** için → `references/audit-tools.md`.
