# Claude Web Toolkit

Site-bağımsız **Growth Optimization Framework** — Claude Code eklenti koleksiyonu.
Amaç sadece "Google'da yükselmek" veya trafik değil; siteyi **Google + AI arama motorları (ChatGPT
Search, Gemini, Perplexity, Claude, AI Overviews) + Core Web Vitals + Knowledge Graph** açısından üst
seviyeye çıkarıp **daha fazla lead/satış** üretmek. Strateji → Arama Görünürlüğü → Performans → Büyüme
akışıyla çalışır. Tek repo, her proje/sitede yeniden kullanılır.

## Yetenekler (plugins)

| Plugin | Ne yapar |
|--------|----------|
| **seo-geo-optimizer** | 12 başlıklı denetim: İş Hedefi · Rakip/İçerik Boşluğu · Topical Authority · GEO · Entity/Knowledge Graph · Klasik SEO · Yerel SEO · Crawlability · Core Web Vitals · CRO · Off-site · Doğrulama. Bir **danışman gibi yönlendirir**: framework'ü (+Cloudflare) tespit eder, sorular sorar, görevleri tek tek sunar, kod tarafını yapar, off-site adımları (Search Console, GA4, Bing, hedef skor) adım adım yaptırır, işaretler ve **AI Visibility Score (0-100)** üretir. |

> Yeni yetenekler `plugins/` altına eklenir ve `.claude-plugin/marketplace.json`'a kaydedilir.

## Kurulum

### Yöntem 1 — Marketplace olarak ekle (önerilen, her projede kullanılır)
```
/plugin marketplace add cinfikircom/claude-web-toolkit
/plugin install seo-geo-optimizer@claude-web-toolkit
```
Kurulumdan sonra her projede `/seo-audit` komutu ve `seo-geo-audit` becerisi hazırdır.

### Yöntem 2 — Yerel test (repo klonluyken)
```
/plugin marketplace add /path/to/claude-web-toolkit
/plugin install seo-geo-optimizer@claude-web-toolkit
```

## Kullanım
Herhangi bir web projesinde:
```
/seo-audit
```
veya bir başlıktan başlamak için (12 başlık):
`/seo-audit hedef · rakip · topical · geo · entity · seo · local · metadata · cwv · cro · setup · dogrula`
ek: `score` (AI Visibility Score) · `derin` (4 ajana böl) · `rapor`

Akış:
1. **Faz 0 — İnteraktif Keşif:** Claude framework'ü (+Cloudflare) + mevcut SEO/off-site durumunu tespit eder,
   chat'ten iş hedefi/rakip/risk/off-site sorularını sorar, `seo-kesif-raporu.md` + `seo-gorev-listesi.md`
   (rehberli checklist) + başlangıç AI Visibility Score üretir. (Kod değişmez.)
2. **Rehberli, başlık başlık uygulama** — Strateji → Arama Görünürlüğü → Performans → Büyüme → Off-site → Doğrulama:
   A İş Hedefi → B Rakip → C Topical → D GEO → E Entity/KG → F SEO → G Yerel → H Crawlability → I CWV → J CRO →
   K Off-site → L Doğrulama. Görevler **tek tek** sunulur; her biri: açıklama + risk → **onay** → uygula/yaptır →
   `seo-gorev-listesi.md`'de işaretle → sonraki.

### Rehberli mod — Claude bir danışman gibi yönlendirir
Sadece kod yazmaz; **yapamayacağı işleri sana yaptırır.** Örnekler:
- Google Search Console üyeliği + doğrulama + `sitemap.xml` gönderimi
- Bing Webmaster kaydı (DuckDuckGo/Yahoo bu indeksi kullanır) + IndexNow
- Google Analytics 4 bağlantısı, Google Business Profile
- PageSpeed Insights / Pingdom / DebugBear'da ölç → düzelt → **hedef skora ulaşana kadar** döngü
- Favicon, görsel/CSS/JS optimizasyonu, H1-H6 hiyerarşi kuralları

### Derin mod — 4 uzman ajan
Büyük/kapsamlı sitelerde tek-tur denetim yüzeysel kalabilir. İş, 4 uzman ajana bölünebilir:

| Ajan | Başlık | Odak |
|------|--------|------|
| `growth-strategy-agent` | A, B, C, J | İş hedefi, rakip/içerik boşluğu, topical authority, CRO |
| `seo-geo-agent` | D, F, G, H | GEO/llms.txt, klasik SEO, yerel SEO, crawlability |
| `entity-knowledge-graph-agent` | E | Entity, JSON-LD graf, Knowledge Graph, knowledge conflict |
| `performance-cwv-agent` | I | Core Web Vitals, Lighthouse, resource hints, Cloudflare |

Faz 0 ana akışta yapılır; başlıklar ilgili ajana devredilir. **Bellek:** her ajan `seo-gorev-listesi.md`'yi
okuyup günceller (bağlam devri) — geçişte hafıza kaybı olmaz (detay: SKILL.md "DERİN MOD").

### Durum takibi — bir "SEO operasyon sistemi"
Skill yalnızca öneri sunmaz; **yürütür ve durumu takip eder.** `seo-gorev-listesi.md` projenin kalıcı
execution state'idir. Her başlık durum işaretiyle izlenir — `[ ]` Not Started · `[~]` In Progress ·
`[✓]` Completed · `[!]` Blocked/Waiting (dış aksiyon). Her raporda kompakt **Durum Panosu** gösterilir:
```
DURUM: FAZ0 [✓] · A [~] · B [ ] · C [ ] · D [ ] · E [ ] · F [ ] · G [ ] · H [ ] · I [ ] · J [ ] · K [ ] · L [ ]
```
Kurallar: aynı anda tek başlık `[~]`, state güncellenmeden ilerleme yok, kritik aşamada onaysız kod/dosya/deploy yok.

### Üretilen hazır artefaktlar
`/llms.txt`, `/llms-full.txt`, `/ai-agents.json`, AI-dostu `robots.txt` ve sayfa bazlı JSON-LD
şemaları — `skills/seo-geo-audit/templates/` altındaki şablonlardan gerçek veriyle doldurularak üretilir.

## Güvenlik ilkeleri
- Onay almadan kod değişmez.
- Framework değiştirilmez; yalnızca mevcut mimariye uygun öneri.
- Kazanım %5'in altındaysa dokunulmaz.
- Her değişiklik Low/Medium/High risk etiketiyle sunulur.

## Yapı
```
claude-web-toolkit/
  .claude-plugin/marketplace.json
  LICENSE
  plugins/seo-geo-optimizer/
    .claude-plugin/plugin.json
    commands/seo-audit.md
    agents/
      growth-strategy-agent.md       seo-geo-agent.md
      entity-knowledge-graph-agent.md performance-cwv-agent.md
    skills/seo-geo-audit/
      SKILL.md
      references/
        code-safety.md           business-goal.md          competitor-content-gap.md
        topical-authority.md     geo-citation.md           entity-graph.md
        schema-jsonld.md         eeat-quality-rater.md     semantic-structure.md
        ai-crawler-audit.md      local-seo.md              cloudflare-edge.md
        core-web-vitals.md       resource-hints.md         framework-performance.md
        lighthouse-rubric.md     llms-txt-generator.md     cro-audit.md
        offsite-setup.md         audit-tools.md            ai-visibility-score.md
        sources.md
      templates/
        kesif-raporu.template.md  gorev-listesi.template.md  son-rapor.template.md
        llms.txt.template         llms-full.txt.template
        ai-agents.json.template   robots-ai.txt.template
```

## Kapsam (12 başlık)
**Strateji:** İş Hedefi & dönüşüm önceliklendirme · Rakip & içerik boşluğu · Topical authority (pillar/cluster).
**Arama görünürlüğü:** GEO (llms.txt/llms-full.txt/ai-agents.json, AI citation, chunking) · Entity SEO &
Knowledge Graph (JSON-LD `@graph`, Wikidata/`sameAs`, knowledge conflict, brand consistency) · Klasik SEO
(metadata, H1-H6 & semantik HTML, E-E-A-T) · Yerel SEO (NAP, LocalBusiness, GBP) · Crawlability (AI crawler,
robots, Cloudflare bot). **Performans:** Core Web Vitals (LCP/INP/CLS/TTFB, resource hints, Speculation Rules,
Early Hints, Cloudflare edge). **Büyüme:** CRO (CTA, form, telefon/WhatsApp). **Off-site:** Search Console,
Bing/DuckDuckGo, GA4, Google Business. **Doğrulama:** PageSpeed, Pingdom, DebugBear, GTmetrix + **AI Visibility Score (0-100)**.

## Lisans
[MIT](./LICENSE)
