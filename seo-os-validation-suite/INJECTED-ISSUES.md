# INJECTED ISSUES — Answer Key (per page)

This is the **ground truth** of intentional failures in `golden-seo-test-site/`. The SEO-OS agent
should detect these WITHOUT reading this file. Used to grade detection accuracy & false negatives.

> Controlled-failure fixture. **Do not fix the golden site.**

## Global (layout.jsx / SiteNav.jsx)
- Render-blocking 3rd-party `<script>` (no async/defer) — `perf.render-blocking`
- Web font loaded render-blocking, `display=block`, no preconnect/preload — `perf.font-preload`
- No per-page meta description (none in layout, none on pages) — `seo.meta-description`
- No canonical anywhere (no `metadataBase`/`alternates.canonical`) — `seo.canonical`
- Weak internal linking: nav links only Home + Services; **about/blog/contact orphaned** — `seo.internal-linking`
- No `/llms.txt`, `/llms-full.txt`, `/ai-agents.json` — `geo.llms-txt`, `geo.llms-full-txt`, `geo.ai-agents-json`

## / (app/page.jsx)
- **Two `<h1>`** ("Welcome…", "We are the best…") — `seo.single-h1`
- Title `"Acme Inc - Home"` (duplicated on /about) — `seo.unique-titles`
- Raw `<img>` hero, no width/height, no lazy/priority — `perf.image-optimization`, `perf.cls`, `perf.lazy-loading`
- Organization JSON-LD: no `@id`/url/logo, **dangling** `publisher.@id`, no `sameAs` — `schema.organization`, `schema.entity-ids`, `schema.sameas`
- Generic non-citable copy, no FAQ/entity definition — `geo.ai-summaries`, `geo.citation-paragraphs`

## /about (app/about/page.jsx)
- **Duplicate title** (identical to home) — `seo.unique-titles`
- **Two `<h1>`** + heading jump h1→h4 — `seo.single-h1`
- No Organization/AboutPage schema, no NAP/E-E-A-T — `schema.organization`, `schema.contact-local`
- Orphan page (not in nav) — `seo.internal-linking`

## /services (app/services/page.jsx)
- **Four `<h1>`** (page + 3 services) — `seo.single-h1`
- Service JSON-LD incomplete: no `@id`, provider NOT linked to Organization, no offers/areaServed — `schema.service-article`, `schema.entity-ids`
- 3 raw `<img>` (no dims/lazy) — `perf.image-optimization`, `perf.lazy-loading`, `perf.cls`
- No description; no CTA/cross-links — `seo.meta-description`, `seo.internal-linking`

## /blog (app/blog/page.jsx)
- **Three `<h1>`** — `seo.single-h1`
- Article JSON-LD: no `@id`, author bare string (not Person), no publisher, no dates, dangling `mainEntityOfPage` — `schema.service-article`, `schema.entity-ids`
- No citable summary / FAQ / author bio — `geo.citation-paragraphs`, `geo.ai-summaries`
- Raw `<img>` cover — `perf.image-optimization`, `perf.cls`

## /contact (app/contact/page.jsx)
- **Two `<h1>`** — `seo.single-h1`
- No ContactPage/LocalBusiness schema, no ContactPoint, NAP as plain text — `schema.contact-local`
- Phone not click-to-call; 6-field all-required form, no labels (CRO + a11y friction)
- Orphan page (not in nav) — `seo.internal-linking`

## Expected verdicts
- **GEO readiness:** LOW (see `geo-simulation.json`)
- **Core Web Vitals risk:** HIGH (LCP from unoptimized heroes, CLS from missing dims, render-blocking script/font)
- **Schema:** broken @id graph, no sameAs, incomplete types
