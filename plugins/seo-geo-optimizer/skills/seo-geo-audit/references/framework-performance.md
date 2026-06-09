# Framework Performans Rehberi

Amaç: Her framework'ün **kendi** performans araçlarını ve idiom'larını kullanarak CWV
optimizasyonu yapmak. Framework'e yabancı desenler dayatma.

## Next.js (App Router)

### Görsel optimizasyonu
```tsx
import Image from 'next/image'
// Hero/LCP görsel: priority + fetchpriority=high otomatik
<Image src="/hero.webp" width={1200} height={630} priority alt="…" />
// Below-the-fold: lazy default
<Image src="/other.webp" width={800} height={600} alt="…" />
```

### Font optimizasyonu
```tsx
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin', 'latin-ext'], display: 'swap' })
// ✅ Self-host edilir (Google Fonts'a preconnect GEREKMEZ)
// ✅ Subset: latin-ext → Türkçe karakterler (ğ, ş, ı, ç, ö, ü) pakete dahil
```

### Render stratejisi
```tsx
// SSG (build zamanı) — en hızlı TTFB
export const dynamic = 'force-static'

// ISR (belli aralıkla yenile) — iyi denge
export const revalidate = 3600 // 1 saat

// SSR (istek zamanı) — en ağır TTFB, sadece kişisel veri varsa kullan
export const dynamic = 'force-dynamic'
```

### Kod bölme & lazy
```tsx
import dynamic from 'next/dynamic'
const HeavyComponent = dynamic(() => import('./Heavy'), {
  loading: () => <Skeleton />,
  ssr: false // yalnızca client, SSR bloklamasın
})
```

### Streaming / Suspense
```tsx
<Suspense fallback={<Skeleton />}>
  <SlowDataComponent />
</Suspense>
// ✅ Sayfa render'ını bloklamaz, TTFH (Time to First HTML) düşer
```

## Astro

### Sıfır JS mimarisi (varsayılan)
```astro
// Astro'da tüm component'ler varsayılan OLARAK sıfır JS
// Yalnızca client:* directive'i verirsen JS yüklenir
<InteractiveWidget client:load />   <!-- sayfa yüklenirken -->
<InteractiveWidget client:idle />   <!-- boşta kalınca -->
<InteractiveWidget client:visible /> <!-- görününce -->
```

### Görsel optimizasyonu
```astro
---
import { Image } from 'astro:assets';
import heroImage from '../assets/hero.jpg';
---
<Image src={heroImage} alt="…" width={1200} format="avif" loading="eager" />
<!-- format="avif" → otomatik dönüşüm -->
```

### View Transitions
```astro
---
// SPA benzeri sayfa geçişi — prefetch + morph
import { ViewTransitions } from 'astro:transitions';
---
<head>
  <ViewTransitions />
</head>
<!-- ✅ Sonraki sayfa kaynaklarını prefetch eder -->
```
> Astro 5+: `ViewTransitions` bileşeni `<ClientRouter />` olarak yeniden adlandırıldı
> (`import { ClientRouter } from 'astro:transitions'`). Sürümü kontrol et.

## Nuxt

### Görsel optimizasyonu
```vue
<NuxtImg src="/hero.jpg" format="webp" loading="lazy" />
<NuxtPicture src="/hero.jpg" format="avif;webp" />
```

### Render stratejisi
```ts
// nuxt.config.ts
routeRules: {
  '/': { prerender: true },           // SSG
  '/blog/**': { swr: 3600 },          // ISR
  '/dashboard/**': { ssr: true },     // SSR — sadece kişisel veri
}
```

### Kod bölme
```vue
<script setup>
const Heavy = defineAsyncComponent(() => import('./Heavy.vue'))
</script>
```

## SvelteKit

### Görsel optimizasyonu
```svelte
<enhanced:img src="./hero.jpg" alt="…" />
<!-- @sveltejs/enhanced-img → otomatik AVIF/WebP + srcset -->
```

### Render stratejisi
```ts
// +page.ts
export const prerender = true       // SSG
export const ssr = false            // CSR (SPA)
// +page.server.ts → varsayılan SSR
```

### Preload stratejisi
```svelte
<a href="/next" data-sveltekit-preload-data="hover">…</a>
<!-- hover'da sonraki sayfa verisi ön-yükleme -->
```

## Düz HTML / Statik

```html
<!-- Görseller: AVIF/WebP + fallback -->
<picture>
  <source srcset="hero.avif" type="image/avif">
  <source srcset="hero.webp" type="image/webp">
  <img src="hero.jpg" loading="eager" fetchpriority="high" width="1200" height="630" alt="…">
</picture>

<!-- Font: self-host + subset + display:swap -->
<style>
@font-face {
  font-family: 'SiteFont';
  src: url('/fonts/site-font-latin-ext.woff2') format('woff2');
  font-display: swap; /* CLS önleme */
  unicode-range: U+0000-00FF, U+0131, U+015E-015F, U+011E-011F, U+00D6, U+00F6,
                 U+00DC, U+00FC, U+00C7, U+00E7; /* Latin Ext — Türkçe karakterler */
}
</style>

<!-- JS: defer/async -->
<script src="/app.js" defer></script>
```

## Render stratejisi seçim tablosu

| İçerik tipi | Önerilen strateji | TTFB | Tazelik |
|-------------|------------------|------|---------|
| Statik sayfa (hakkımızda, iletişim) | SSG / static | < 100ms | Deploy'da güncel |
| Blog / içerik sayfası (seyrek değişir) | ISR (1-24 saat) | < 200ms (CDN) | revalidate |
| Liste/kategori sayfası | ISR (5-60 dk) | < 200ms (CDN) | revalidate |
| Kullanıcı dashboard'u | SSR + streaming | 200-800ms | Her istek |
| Arama sonuçları | SSR / CSR | Değişken | Her istek |

## Denetim adımları

1. Framework'ü tespit et (`package.json` → dependencies).
2. Görsel bileşenleri tara: framework'ün kendi Image bileşeni mi kullanılıyor, yoksa ham `<img>` mi?
3. Font yükleme: self-host mu Google Fonts mu? `display:swap` var mı? Türkçe karakter subset var mı?
4. Render stratejisi: her sayfa tipi için doğru strateji seçilmiş mi?
5. Bundle boyutu: kullanılmayan kod var mı? (Next.js: `@next/bundle-analyzer`, Nuxt: `analyze`)

## Beklenen kazanç

| İyileştirme | Beklenen CWV etkisi |
|-------------|-------------------|
| `<img>` → `<Image />` (framework) | LCP 0.3–1.5s ↓, CLS ↓ |
| Google Fonts → self-host + subset | LCP 0.2–0.5s ↓, dışa bağımlılık yok |
| SSR → ISR (içerik sayfaları) | TTFB 0.3–1.0s ↓ |
| Bundle bölme + lazy | INP 50–200ms ↓ |
| Streaming / Suspense | TTFH algısal ↓ |
