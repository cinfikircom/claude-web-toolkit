# Yüksek Öncelikli Referans Kaynaklar (tam liste)

Bu projede çalışırken aşağıdaki kaynaklar **yüksek öncelikli referans dokümanlar** kabul edilir.
Erişim varsa WebFetch ile oku; yoksa hafızandaki en güncel sürümü baz al.

## Öncelik sırası

| # | Konu | URL |
|---|------|-----|
| 1 | GEO / LLM SEO checklist | https://github.com/alexandrebrt14/geo-checklist |
| 2 | Generative Engine Optimization kaynakları | https://github.com/amplifying-ai/awesome-generative-engine-optimization |
| 3 | Agentic SEO Skill | https://github.com/Bhanunamikaze/Agentic-SEO-Skill |
| 4 | SEO teknik standartları | https://github.com/marcobiedermann/search-engine-optimization |
| 5 | Ek SEO checklist | https://github.com/anupammo/seo-checklist |
| 6 | Web performance checklist | https://github.com/flowforfrank/performance-checklist |
| 7 | Schema.org (yapılandırılmış veri) | https://schema.org/ |
| 8 | **Google Search Quality Rater Guidelines** (E-E-A-T, ~170 sf PDF) | https://static.googleusercontent.com/media/guidelines.raterhub.com/en//searchqualityevaluatorguidelines.pdf |
| 9 | Google Core Web Vitals | https://web.dev/vitals/ |
| 10 | Lighthouse dokümantasyonu | https://developer.chrome.com/docs/lighthouse |
| 11 | MDN Web Performance | https://developer.mozilla.org/en-US/docs/Web/Performance |
| 12 | Chrome Aurora performans rehberleri | https://developer.chrome.com/blog/tags/aurora/ |
| 13 | Google Search Console | https://search.google.com/search-console |
| 14 | Bing Webmaster Tools (DuckDuckGo/Yahoo'yu kapsar) | https://www.bing.com/webmasters |
| 15 | IndexNow (anında URL bildirimi) | https://www.indexnow.org/ |
| 16 | Google Analytics 4 | https://analytics.google.com |
| 17 | PageSpeed Insights | https://pagespeed.web.dev/ |
| 18 | DebugBear Website Speed Test | https://www.debugbear.com/test/website-speed |
| 19 | Pingdom Tools | https://tools.pingdom.com/ |
| 20 | GTmetrix | https://gtmetrix.com/ |

## Hangi başlıkta hangi kaynak (12 başlık)

- **A — İş Hedefi:** `references/business-goal.md` (+ Faz 0 hedef sorusu)
- **B — Rakip & İçerik Boşluğu:** rakip URL'leri (WebFetch) + `references/competitor-content-gap.md`
- **C — Topical Authority:** `references/topical-authority.md` (+ #1, #2 GEO)
- **D — GEO/LLM:** #1, #2, #3 + `references/llms-txt-generator.md`, `references/geo-citation.md`
- **E — Entity, Schema & Knowledge Graph:** #7 (schema.org) + Wikidata + `references/schema-jsonld.md`, `references/entity-graph.md`
- **F — Klasik SEO & Marka + E-E-A-T:** #4, #5, #8 + `references/semantic-structure.md`, `references/eeat-quality-rater.md`
- **G — Yerel SEO:** #13, #16 + `references/local-seo.md`
- **H — Metadata & Crawlability:** #4, #5 + `references/ai-crawler-audit.md`, `references/cloudflare-edge.md`
- **I — Core Web Vitals:** #6, #9, #10, #11, #12 + `references/resource-hints.md`, `framework-performance.md`, `lighthouse-rubric.md`, `cloudflare-edge.md`
- **J — CRO:** `references/cro-audit.md` (+ Başlık A iş hedefi)
- **K — Off-site Kurulum:** #13–#16 + `references/offsite-setup.md`
- **L — Harici Doğrulama:** #17–#20 + `references/audit-tools.md`
- **Skor:** `references/ai-visibility-score.md` (son raporda 0-100)

## 4 uzman ajana bölme (derin mod)
Tek seferde tüm denetim geniş sitelerde yüzeysel kalabilir. Daha derin sonuç için iş, plugin'in
`agents/` altındaki 4 uzman ajanına bölünür:
1. **`growth-strategy-agent`** — Başlık A, B, C, J
2. **`seo-geo-agent`** — Başlık D, F, G, H
3. **`entity-knowledge-graph-agent`** — Başlık E
4. **`performance-cwv-agent`** — Başlık I

> Bu ajanlar **mevcuttur** (`plugins/seo-geo-optimizer/agents/`). Kullanımı SKILL.md "DERİN MOD"
> bölümünde: Faz 0 keşfini ana akışta yap, başlıkları ilgili ajana devret. **Bellek:** her ajan
> `.seo-os/seo-gorev-listesi.md`'yi okuyup günceller (bağlam devri). Off-site (K) + doğrulama (L) ana akışta.
