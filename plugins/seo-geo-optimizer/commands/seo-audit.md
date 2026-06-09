---
description: "AI Search & Growth Optimization denetimini başlatır (SEO + GEO + Entity/Knowledge Graph + CWV + İş Hedefi + Rakip + Topical + Yerel SEO + CRO). İnteraktif keşifle açılır, görevleri tek tek onayla uygular, off-site adımları yönlendirir."
---

# SEO / GEO / Growth Optimizasyon Denetimi

Kullanıcı bu projede SEO + GEO denetimi başlatmak istiyor.

`seo-geo-audit` becerisini (skill) uygula. **Önce skill'in tamamını + `references/execution-model.md`'i oku.**
SEO-OS v2 protokolüyle çalış: `seo-os-state.json`'u boot'ta oku/oluştur, deterministic dashboard göster,
ANALYZE → PROPOSE → EXECUTE modlarıyla ilerle. **Faz 0 İKİ ayrı tur:** önce 0-A (Tech Scan, kod taraması),
state'i yaz; sonra 0-B'de kullanıcıya hedef/rakip/risk sorularını (AskUserQuestion) sor.

KRİTİK kurallar (skill içinde detaylı):
- Onay almadan kod değiştirme.
- Her başlığı tek tek uygula, raporla, onay al, sonrakine geç.
- Framework değiştirmeyi önerme; yalnızca mevcut mimariye uygun öneri üret.
- Kazanım %5'in altındaysa dokunma.

Eğer kullanıcı `$ARGUMENTS` ile bir başlık adı verdiyse, doğrudan o başlıktan başla;
yoksa Faz 0 keşiften başla. Geçerli argümanlar (başlık eşlemesi):

| Argüman | Başlık | Kapsam |
|---------|--------|--------|
| `hedef` / `goal` | A | İş hedefi & dönüşüm önceliklendirme |
| `rakip` / `competitor` / `gap` | B | Rakip & içerik boşluğu analizi |
| `topical` / `cluster` | C | Topical authority, pillar/cluster haritası |
| `geo` / `llm` | D | GEO/LLM altyapısı, llms.txt, AI citation |
| `entity` / `schema` | E | Entity SEO, JSON-LD, knowledge graph, knowledge conflict |
| `seo` / `marka` | F | Klasik SEO, metadata, favicon/OG, başlık hiyerarşisi, E-E-A-T |
| `local` / `yerel` | G | Yerel SEO: NAP, LocalBusiness, GBP, yerel landing page |
| `metadata` / `crawler` | H | Metadata tutarlılığı, crawlability, AI bot erişimi |
| `cwv` / `performans` | I | Core Web Vitals, Lighthouse, resource hints, Cloudflare edge |
| `cro` / `donusum` | J | Dönüşüm optimizasyonu: CTA, form, telefon/WhatsApp |
| `setup` / `kurulum` | K | Off-site: Search Console, Bing, GA4, Google Business, sitemap gönderimi |
| `dogrula` / `verify` | L | Harici skor döngüsü: PageSpeed/Pingdom/DebugBear → hedef skor |
| `score` / `skor` | — | AI Visibility Score (0-100) hesapla ve raporla |
| `rapor` | — | Mevcut tespitlerle son rapor üret (kod değiştirme) |
| `derin` / `deep` | — | Derin mod: 4 uzman ajana böl (growth/seo-geo/entity/performance) |

> Bilinmeyen/eşleşmeyen argümanda Faz 0 keşiften başla ve hangi başlığı kastettiğini sor.
> `accessibility` ayrı başlık değildir — F + I + Lighthouse A11y içinde ele alınır.
> Önerilen sıra: A→B→C→D→E→F→G→H→I→J→K→L.
