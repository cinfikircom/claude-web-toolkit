# Core Web Vitals & Performans

## Hedef metrikler
| Metrik | Hedef | Açıklama |
|--------|-------|----------|
| **LCP** | < 2.5s | Largest Contentful Paint — en büyük içeriğin boyanması |
| **INP** | < 200ms | Interaction to Next Paint — etkileşim tepkisi (FID'in yerine geçti) |
| **CLS** | < 0.1 | Cumulative Layout Shift — düzen kayması |
| **TTFB** | < 800ms | Time to First Byte — sunucu yanıtı |

Lighthouse hedefleri: Performance 90+, SEO 100, Accessibility 100, Best Practices 100.

## Her problem için raporlama formatı
- **Kaynak dosya** — sorunun bulunduğu dosya/satır
- **Sorun tipi** — render-blocking CSS/JS, unused kod, oversized image, layout shift,
  hydration maliyeti, aşırı DOM derinliği, eksik cache/ISR, font fallback
- **Tahmini etki** — hangi metriği ne kadar kötüleştiriyor
- **Çözüm** — somut kod değişikliği

## Yaygın teşhis & çözümler
- **LCP:** Hero/öne çıkan görsele `preload`/`priority`; diğerlerine `lazy`. Görselleri AVIF/WebP +
  `srcset`/`sizes`. Render stratejisini SSR→ISR/SSG'ye çekerek TTFB düşür.
- **INP:** Ağır client JS'i azalt, dynamic import / code splitting, ana thread'i bloklayan işleri böl.
- **CLS:** Görsel/iframe/embed'lere boyut ver; font `display: swap` + doğru subset; reklam/banner alanı rezerve et.
- **TTFB:** force-dynamic/SSR yerine cache'lenebilir ISR/SSG; CDN cache; DB sorgu optimizasyonu.
- **Font:** Çok dilli sitelerde doğru subset (örn. Türkçe için `latin-ext`); `display: swap`; self-host/`next/font`.

## Framework'e özel araçlar
- **Next.js:** `next/image`, `next/font`, `dynamic()` import, `revalidate` (ISR), `loading.tsx`/streaming.
- **Astro:** islands architecture (varsayılan sıfır JS), `<Image />`, partial hydration.
- **Nuxt/SvelteKit:** kendi image/font modülleri, prerender/ISR seçenekleri.
- **Düz HTML:** `loading="lazy"`, `<link rel=preload/preconnect>`, kritik CSS inline.

## Risk notu
Render stratejisi değişimi (SSR→ISR) ve görsel/font pipeline değişiklikleri **High Risk**'tir.
Anlık/kullanıcıya özel veri içeren sayfaları ISR'ye çevirme — veri bayatlar. Madde madde, onayla ilerle.
