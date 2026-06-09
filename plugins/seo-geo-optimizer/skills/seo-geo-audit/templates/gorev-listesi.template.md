# SEO + GEO + GROWTH GÖREV LİSTESİ — {SITE_ADI}

> Bu dosya projenin **execution state**'idir (tek doğruluk kaynağı). Durum: `[ ]` Not Started ·
> `[~]` In Progress · `[✓]` Completed · `[!]` Blocked/Waiting (dış aksiyon). Sorumlu: **C** = Claude ·
> **K** = Kullanıcı · **C+K** = Claude hazırlar, kullanıcı onaylar/gönderir. Hedef etkisi: 🟢 doğrudan ·
> 🟡 dolaylı · ⚪ nötr. Aynı anda yalnızca **bir** başlık `[~]`. **Derin modda ajanlar bu dosyadan bağlam devralır.**

**Framework:** {…} · **Hosting/Cloudflare:** {…} · **Birincil iş hedefi:** {…} · **Risk toleransı:** {…}
**AI Visibility Score (başlangıç):** {…}/100

## DURUM PANOSU
`FAZ0 [ ] · A [ ] · B [ ] · C [ ] · D [ ] · E [ ] · F [ ] · G [ ] · H [ ] · I [ ] · J [ ] · K [ ] · L [ ]`

---

## STRATEJİ KATMANI
### A. İş Hedefi & Dönüşüm Önceliklendirme — `references/business-goal.md`
- [ ] (C) Birincil/ikincil hedef netleştir, tüm önerileri 🟢/🟡/⚪ etiketle
### B. Rakip & İçerik Boşluğu — `references/competitor-content-gap.md`
- [ ] (C) 5 rakibi incele → içerik/entity/schema/GEO/hız gap tablosu
### C. Topical Authority — `references/topical-authority.md`
- [ ] (C) Pillar→cluster haritası + eksik cluster'lar + iç linkleme planı

## ARAMA GÖRÜNÜRLÜĞÜ KATMANI
### D. GEO / LLM Altyapısı — `references/geo-citation.md`, `llms-txt-generator.md`
- [ ] (C) `/llms.txt` · `/llms-full.txt` · `/ai-agents.json` (template'lerden)
- [ ] (C) AI citation blokları (birincil cevap, özet, FAQ)
### E. Entity SEO, Schema & Knowledge Graph — `references/entity-graph.md`, `schema-jsonld.md`
- [ ] (C) Entity haritası + `@id` bağlı JSON-LD `@graph`
- [ ] (C) Knowledge Conflict Audit · sameAs Validation · Wikidata Mapping · Brand Consistency
- [ ] (C+K) Rich Results Test + Schema Validator ile doğrula
### F. Klasik SEO & Marka + E-E-A-T — `references/semantic-structure.md`, `eeat-quality-rater.md`
- [ ] (C) title/description, canonical, OG/Twitter, favicon, alt metin, hreflang
- [ ] (C) tek H1 + sıralı başlık + semantik HTML; E-E-A-T/Trust sinyalleri
### G. Yerel SEO — `references/local-seo.md`
- [ ] (C) NAP tutarlılığı + `LocalBusiness`/`GeoCoordinates` schema + yerel landing page
### H. Metadata & Crawlability — `references/ai-crawler-audit.md`
- [ ] (C) robots/sitemap, kırık link, redirect zinciri, orphan sayfa
- [ ] (C) AI bot erişimi (Cloudflare bot bloklaması dahil → `cloudflare-edge.md`)

## PERFORMANS KATMANI
### I. Core Web Vitals & Performans *(en yüksek risk — madde madde onay)* — `references/core-web-vitals.md`
- [ ] (C) görsel (AVIF/WebP, srcset, LCP preload), font (subset, swap), CSS/JS (split, defer)
- [ ] (C) render stratejisi (SSR→ISR/SSG) — *High Risk, geri alma planı*
- [ ] (C) resource hints / Speculation Rules / Early Hints; Cloudflare Polish/Fonts (varsa)

## BÜYÜME KATMANI
### J. CRO / Dönüşüm — `references/cro-audit.md`
- [ ] (C) CTA görünürlüğü, form sürtünmesi, tıkla-ara/WhatsApp, mobil akış

## OFF-SITE & DOĞRULAMA *(rehberli)*
### K. Off-site Kurulum — `references/offsite-setup.md`
- [ ] (C+K) Google Search Console: doğrula → sitemap → indexing
- [ ] (C+K) Bing Webmaster (DuckDuckGo/Yahoo kapsanır) + IndexNow
- [ ] (C+K) Google Analytics 4: kod enjekte + GSC'ye bağla
- [ ] (K) Google Business Profile (yerelse) · (ops.) Yandex
### L. Harici Doğrulama & Hedef Skor *(en son — döngü)* — `references/audit-tools.md`
- [ ] (C+K) PageSpeed Insights: Mobil ≥90 · Desktop ≥90 · CWV Passed
- [ ] (C+K) DebugBear (CWV yeşil) · Pingdom (A) · GTmetrix (A) · Lighthouse (Perf 90+ / SEO/A11y/BP 100)

---

## İLERLEME
| Katman | Toplam | Tamam |
|--------|--------|-------|
| Strateji (A–C) | {n} | {n} |
| Arama görünürlüğü (D–H) | {n} | {n} |
| Performans (I) | {n} | {n} |
| Büyüme (J) | {n} | {n} |
| Off-site & doğrulama (K–L) | {n} | {n} |

**AI Visibility Score:** {başlangıç} → {güncel} / 100
