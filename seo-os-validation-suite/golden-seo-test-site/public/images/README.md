# public/images — INTENTIONALLY UNOPTIMIZED (fixture)

The pages reference large hero/cover images by name, e.g.:

- `hero-4000x3000.jpg`     (~referenced on / )
- `service-*-3000x2000.jpg`(~referenced on /services )
- `blog-cover-3500x2000.jpg`(~referenced on /blog )

**By design these are meant to be huge, raw JPEGs (multi-MB), served via plain `<img>`:**
- no `next/image`, no AVIF/WebP, no `srcset`/`sizes`
- no `width`/`height` attributes  → Cumulative Layout Shift (CLS)
- no `loading="lazy"` / no `priority`/preload → poor LCP

This is a controlled-failure fixture for SEO-OS validation. **Do not add optimized images or fix the markup.**
If you need the dev server to render without 404s, drop any placeholder JPEGs with these names here —
but keep them large and unoptimized to preserve the intended Core Web Vitals failures.
