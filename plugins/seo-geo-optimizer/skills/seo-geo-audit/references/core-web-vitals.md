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
- **INP:** Ağır client JS'i azalt, dynamic import / code splitting, ana thread'i bloklayan işleri böl. (Detaylı teşhis ↓)
- **CLS:** Görsel/iframe/embed'lere boyut ver; font `display: swap` + doğru subset; reklam/banner alanı rezerve et.
- **TTFB:** force-dynamic/SSR yerine cache'lenebilir ISR/SSG; CDN cache; DB sorgu optimizasyonu.
- **Font:** Çok dilli sitelerde doğru subset (örn. Türkçe için `latin-ext`); `display: swap`; self-host/`next/font`.

## INP derin teşhis (en karmaşık metrik)

INP (2024'te FID'in yerini aldı) bir etkileşimden sonraki **bir sonraki boyamaya** kadar geçen
süredir. Üç alt bileşene ayrılır — hangisinin baskın olduğunu bul, müdahale ona göre değişir:

| Alt bileşen | Nedir | Tipik neden | Çözüm |
|-------------|-------|-------------|-------|
| **Input delay** | Etkileşim olayı işlenmeye başlayana kadar geçen gecikme | Ana thread başka işle (long task) meşgul | Long task'ları böl, 3. parti JS ertele |
| **Processing time** | Olay handler'ının çalışma süresi | Ağır event handler, senkron hesap, gereksiz re-render | Handler'ı hafiflet, `scheduler.yield()` ile böl, memoization |
| **Presentation delay** | Handler bitti → ekran boyanana kadar | Ağır layout/paint, büyük DOM, senkron stil hesabı | DOM küçült, `content-visibility`, layout thrashing'i önle |

### Chrome DevTools ile teşhis adımları
1. **Performance paneli** → kaydet → sayfada etkileşim yap (tıkla/yaz) → durdur.
2. **Interactions** track'inde en uzun etkileşimi seç; input delay / processing / presentation kırılımını gör.
3. **Main** track'inde kırmızı köşeli **Long Task**'ları (>50ms) bul → "Bottom-Up" ile hangi fonksiyon kaç ms blokluyor tespit et.
4. Saha verisi için **PerformanceObserver** ile `event` / `long-animation-frame` (LoAF) entry'lerini logla:
   ```js
   new PerformanceObserver((list) => {
     for (const e of list.getEntries()) console.log(e.name, e.duration, e.scripts)
   }).observe({ type: 'long-animation-frame', buffered: true })
   ```

### Modern API'lerle çözüm
- **`scheduler.yield()`** — uzun bir işi bölüp ana thread'i etkileşimlere geri verir (en pratik yeni araç).
- **`scheduler.postTask()`** — işleri öncelikli kuyruğa koy (`'user-blocking'` / `'background'`).
- **`isInputPending()`** — döngü içinde bekleyen kullanıcı girdisi var mı kontrol edip işi duraklat.
- **`requestIdleCallback`** — kritik olmayan işi boşta zamana ertele.
- **CSS `content-visibility: auto`** — ekran dışı bölümlerin render/layout maliyetini ertele (presentation delay ↓).

> Hedef: her etkileşim için en uzun frame < 200ms. Önce input delay (long task) → sonra processing → sonra presentation sırasıyla bak.

## Framework'e özel araçlar
- **Next.js:** `next/image`, `next/font`, `dynamic()` import, `revalidate` (ISR), `loading.tsx`/streaming.
- **Astro:** islands architecture (varsayılan sıfır JS), `<Image />`, partial hydration.
- **Nuxt/SvelteKit:** kendi image/font modülleri, prerender/ISR seçenekleri.
- **Düz HTML:** `loading="lazy"`, `<link rel=preload/preconnect>`, kritik CSS inline.

## Risk notu
Render stratejisi değişimi (SSR→ISR) ve görsel/font pipeline değişiklikleri **High Risk**'tir.
Anlık/kullanıcıya özel veri içeren sayfaları ISR'ye çevirme — veri bayatlar. Madde madde, onayla ilerle.
