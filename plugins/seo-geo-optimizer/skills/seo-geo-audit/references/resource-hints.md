# Resource Hints & Öncelik İpuçları

Amaç: Tarayıcıya kritik kaynakları önceden yüklemesini söyleyerek LCP, TTFB ve algılanan
performansı iyileştirmek. Yanlış kullanımda zarar verir — her hint'in maliyeti vardır.

## Hint türleri & kullanım yerleri

| Hint | Sözdizimi | Ne zaman kullan | Maliyet |
|------|-----------|-----------------|---------|
| **preload** | `<link rel="preload" href="…" as="…">` | Kritik, sayfa yüklemesinde hemen gereken kaynak (hero görsel, kritik font, kritik CSS) | Yüksek — bant genişliği çalar |
| **preconnect** | `<link rel="preconnect" href="…">` | 3. parti origin (CDN, font, analytics) — erken bağlantı | Düşük — yalnızca DNS+TCP+TLS el sıkışması |
| **dns-prefetch** | `<link rel="dns-prefetch" href="…">` | preconnect'in daha hafif versiyonu; yalnızca DNS çözümleme | En düşük |
| **prefetch** | `<link rel="prefetch" href="…">` | Sonraki sayfada kesin kullanılacak kaynak (sonraki sayfa JS/CSS) | Orta — boşta kalan bant genişliğinde |
| **fetchpriority** | `fetchpriority="high"` (img/script/link) | Hero görsel, LCP elemanı | Sıfır — yalnızca öncelik sinyali |

## Preload detay — ne ZAMAN ve NASIL

```
İYİ preload:
✅ Hero/ilk ekrandaki LCP görseli (as="image")
✅ Kritik font dosyası (as="font", crossorigin)
✅ İlk etkileşim için kritik JS modülü
✅ Kritik CSS (inline üstüne ek olarak preload)

KÖTÜ preload:
❌ Sayfadaki her görsel (bant genişliği israfı, LCP gecikir)
❌ 3. parti analytics JS (sayfa render'ını bloklar)
❌ WebP/AVIF olmayan dev görsel (LCP'yi iyileştirmez)
❌ zaten inline olan kritik CSS
```

## Preconnect karar matrisi

| Kaynak tipi | Hint | Gerekçe |
|-------------|------|---------|
| Google Fonts | `preconnect` + `dns-prefetch` fallback | Font erken yüklenmezse CLS patlar |
| Kendi CDN'in (görsel/font) | `preconnect` | Her görsel yüklemesinde 1 RTT tasarruf |
| 3. parti analytics (GA, Meta) | `dns-prefetch` (preconnect DEĞİL) | Ölçüm kritik değil, TCP el sıkışması boşa |
| 3. parti widget (harita, chat) | `preconnect` | Kullanıcı etkileşime geçtiğinde gecikme azalır |
| API endpoint (client-side fetch) | Hiçbiri | Kullanıcı tetikli; önceden yükleme gereksiz |

## fetchpriority kullanımı

```html
<!-- Hero görsel: LCP'yi doğrudan etkiler -->
<img src="hero.webp" fetchpriority="high" alt="…">

<!-- Footer logosu: en düşük öncelik -->
<img src="footer-logo.svg" fetchpriority="low" loading="lazy" alt="…">

<!-- Kritik script -->
<script src="interaction.js" fetchpriority="high"></script>
```

## Framework implementasyonları

### Next.js
```tsx
// next/image ile priority (preload + fetchpriority=high)
<Image src="/hero.webp" priority alt="…" />

// next/head ile preconnect
<Head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
</Head>
```

### Astro
```astro
// frontmatter'da preload tanımı
---
import { Image } from 'astro:assets';
---
<Image src={hero} preload alt="…" />
```

### Nuxt
```ts
// nuxt.config.ts
app: {
  head: {
    link: [
      { rel: 'preconnect', href: 'https://cdn.example.com' }
    ]
  }
}
```

### Düz HTML
```html
<head>
  <!-- SIRALAMA ÖNEMLİ: preconnect → preload → CSS → JS -->
  <link rel="preconnect" href="https://cdn.example.com">
  <!-- Font preload: as="font" + type + crossorigin ZORUNLU (yoksa çift indirme olur) -->
  <link rel="preload" href="/fonts/site-latin-ext.woff2" as="font" type="font/woff2" crossorigin="anonymous">
  <link rel="preload" href="/hero.webp" as="image" fetchpriority="high">
  <link rel="stylesheet" href="/critical.css">
  <script src="/app.js" defer></script>
</head>
```

## modulepreload — ES modülleri için

ES modülü tabanlı uygulamalarda (`<script type="module">`) normal `preload` yetmez; tarayıcı
modül grafiğini (import zincirini) önceden çözemez. `modulepreload` modülü **ve bağımlılıklarını**
ayrıştırıp derler:

```html
<link rel="modulepreload" href="/app.js">
<link rel="modulepreload" href="/vendor/framework.js">
```
- Yalnızca kritik, ilk etkileşim için gereken modüllerde kullan (hepsinde değil).
- Vite/Rollup üretim build'i kritik chunk'lar için `modulepreload` polyfill'ini otomatik enjekte eder.
- `as="script"` gerekmez; tip modül olarak bilinir.

## Speculation Rules API — prerender / prefetch (modern, en güçlü)

`<link rel="prefetch">`'in modern halefi. Tarayıcıya **bir sonraki gezinmeyi** (sayfayı tamamen
arka planda render etmeye kadar) tahmini olarak hazırlatır → tıklamada **anında** geçiş (LCP ~0).

```html
<script type="speculationrules">
{
  "prerender": [
    { "where": { "href_matches": "/urunler/*" }, "eagerness": "moderate" }
  ],
  "prefetch": [
    { "where": { "selector_matches": "a.nav-link" }, "eagerness": "conservative" }
  ]
}
</script>
```
| `eagerness` | Ne zaman tetiklenir | Kullanım |
|-------------|---------------------|----------|
| `immediate` | Kural okunur okunmaz | Çok emin olunan tek hedef |
| `eager` | Hover/temas başlar başlamaz | Yüksek niyet |
| `moderate` | ~200ms hover | Dengeli (önerilen başlangıç) |
| `conservative` | pointerdown (tıklama anı) | Kaynak korumalı |

- **prerender** pahalıdır (tam sayfa render + JS çalışır) — yalnızca yüksek olasılıklı hedeflerde.
- Analytics/oto-çalan medya/yan etkili sayfalarda dikkat: prerender sayfayı gerçekten çalıştırır.
  `document.prerendering` ve `prerenderingchange` ile yan etkileri ertele.
- Çapraz-origin prerender kısıtlıdır; aynı-origin için idealdir.

## Early Hints (HTTP 103) — sunucu seviyesinde preload

Sunucu, asıl `200` yanıtından **önce** `103 Early Hints` ile kritik kaynakları bildirir; tarayıcı
sunucu HTML'i hazırlarken (TTFB beklerken) preload/preconnect'e başlar → LCP ve FCP kazancı.

```http
HTTP/1.1 103 Early Hints
Link: </styles/critical.css>; rel=preload; as=style
Link: <https://cdn.example.com>; rel=preconnect
```
- Destek: Chrome + CDN/sunucu (Cloudflare, Fastly, Vercel kısmen). Origin sunucu 103 üretebilmeli.
- Statik `<link rel=preload>`'un aksine **TTFB penceresini** kullanır (sunucu düşünürken boş geçmez).
- Yalnızca gerçekten kritik 1-3 kaynakla sınırla; aşırı kullanım faydayı götürür.

## Denetim adımları

1. Lighthouse / PageSpeed Insights "Preload key requests" ve "Preconnect to required origins" uyarılarını tara.
2. LCP elemanını tespit et (Chrome DevTools → Performance → LCP işaretçisi).
3. LCP elemanı için `preload` veya `fetchpriority="high"` var mı?
4. 3. parti origin'lere preconnect/dns-prefetch var mı?
5. Gereksiz preload'ları ayıkla (Waterfall chart'ta bant genişliği çalan kaynaklar).

## Beklenen etki

| İyileştirme | Beklenen LCP kazancı |
|-------------|---------------------|
| Hero görsele preload + fetchpriority=high | 0.3–1.0s |
| 3. parti CDN'e preconnect | 0.1–0.3s (origin başına) |
| Gereksiz preload'ları kaldırma | 0–0.5s (negatif etkiyi geri alma) |
| Font preload + display:swap | CLS düşüşü + algılanan FCP ↑ |
| Speculation Rules `prerender` | Sonraki gezinmede LCP ~0 (anında geçiş) |
| Early Hints (103) | LCP/FCP 0.1–0.5s ↓ (TTFB penceresini kullanır) |

> Kaynaklar:
> https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/resource_hints
> https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API
> https://developer.chrome.com/docs/web-platform/early-hints
> https://developer.chrome.com/blog/tags/aurora/ (Chrome Aurora — framework performans rehberleri)
