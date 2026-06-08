---
name: seo-geo-audit
description: Use this skill to run a full SEO + GEO (Generative Engine Optimization) + Entity SEO + Core Web Vitals + AI Crawler audit and optimization on ANY website/codebase. Triggers when the user asks to "improve SEO", "do an SEO audit", "rank higher on Google", "be cited by ChatGPT/Perplexity/Gemini", "GEO optimization", "add llms.txt / schema / structured data", "improve Core Web Vitals", or runs /seo-audit. Framework-agnostic (Next.js, Astro, React, Nuxt, SvelteKit, plain HTML). Starts with an interactive discovery (asks goal/risk questions in chat), detects the framework, then applies improvements heading-by-heading WITH approval.
version: 1.0.0
---

# SEO + GEO + Entity + Core Web Vitals + AI Crawler Audit

Bu beceri, **herhangi bir web sitesini** arama motorları (Google + AI Overviews) ve LLM
arama motorları (ChatGPT Search, Perplexity, Gemini, Claude, Copilot) için optimize eder.
Site-bağımsızdır: framework'ü tespit eder ve yalnızca o mimariye uygun öneri üretir.

## 🔒 DEĞİŞMEZ KURALLAR (her zaman geçerli)

1. **Onay almadan kod değiştirme.** Her değişiklikten önce: (a) etkilenecek dosyaları listele,
   (b) değişikliği açıkla, (c) risk seviyesini belirt — `Low / Medium / High Risk`.
2. **Her başlığı tek tek uygula.** Hepsini birden yapma. Bir başlığı uygula → raporla → onay al → sonrakine geç.
3. **Framework değiştirmeyi ÖNERME.** (Next.js'e Astro tavsiye etme.) Mimari değişikliği yalnızca açıkça istenirse sun.
4. **%5 kuralı:** Beklenen SEO/performans kazanımı %5'in altındaysa kodu değiştirme — gereksiz risk alma.
5. **Mevcut çalışan fonksiyonelliği bozma.** Riskli refactor'dan kaçın. Çoklu dosya değişiminde bütünü teslim et.
6. Projenin kendi `CLAUDE.md` / katkı kuralları varsa onlara öncelik ver.

Detaylı güvenlik protokolü → `references/code-safety.md`

---

## FAZ 0 — İNTERAKTİF KEŞİF (her zaman buradan başla)

Bu fazda İKİ iş aynı anda yapılır: (A) otomatik teknik tespit, (B) kullanıcıya hedef soruları.

### A) Otomatik teknik tespit (kod tabanını tara)
Şunları tespit et ve kısaca raporla:
- **Framework & sürüm** (`package.json`, dosya yapısı; Next.js / Astro / Nuxt / SvelteKit / React SPA / düz HTML)
- **Build sistemi** ve **hosting ortamı** (Vercel / Netlify / Hostinger / kendi sunucu / static host)
- **Render stratejisi:** sayfa bazında SSR / SSG / ISR / CSR durumu
- **CDN / cache yapısı**
- **Mevcut SEO altyapısı:** robots, sitemap, metadata API kullanımı, mevcut JSON-LD şemaları,
  `llms.txt` / `ai-agents.json` var mı, favicon/OG görseli var mı
- **Veri kaynağı:** içerik nereden geliyor (DB, CMS, markdown, statik)

### B) Kullanıcıya sorulacak hedef soruları (AskUserQuestion ile, tek turda)
Aşağıdakileri sor — cevaplar tüm sonraki adımları şekillendirir:

1. **Hedef anahtar kelimeler / temalar:** Hangi aramalarda üst sırada olmak istiyorsun?
   (marka adı, kategori, lokasyon, ürün vb. — "değişken" kalıplar dahil)
2. **Coğrafya & dil:** Yerel SEO mi (şehir/bölge), ulusal mı, global mi? Site dili?
3. **Hedef motorlar:** Sadece Google mı, AI motorları da mı (ChatGPT/Perplexity/Gemini/Claude)?
4. **Risk toleransı:** `Sadece düşük riskli` / `Orta` / `Agresif (performans refactor dahil)`?
5. **Öncelik:** Hangi başlıklardan başlayalım, yoksa önerilen sırayla mı gidelim?
6. **Trafik/iş hedefi (opsiyonel):** Aylık ziyaretçi hedefi, dönüşüm önceliği var mı?

> Framework tespitini de bu soruların içinde **kullanıcıya doğrulat** ("X tespit ettim, doğru mu?").

### Faz 0 çıktısı
`templates/kesif-raporu.template.md` şablonunu kullanarak bir **Keşif Raporu** üret:
mevcut durum + tüm başlıkların ön analizi + öncelik sırası + risk seviyeleri.
Bunu `seo-kesif-raporu.md` olarak projeye yaz ve onay iste. **Henüz kod değiştirme.**

---

## DENETİM & OPTİMİZASYON BAŞLIKLARI

Her başlık ayrı bir çalışma turudur. Önerilen sıra: A → B → C → E → D (D en riskli, en sona).

### BAŞLIK A — GEO / LLM CRAWLER ALTYAPISI  *(düşük risk, yüksek getiri)*
- LLM'lerin içeriği parçalayıp (chunking) kaynak gösterebilmesi için yapıyı optimize et.
- `/llms.txt`, `/llms-full.txt`, `/ai-agents.json` oluştur (framework'e uygun: Next.js route handler,
  Astro endpoint, ya da statik dosya).
- **AI Citation Optimization** ve **AI Crawler Audit** → detay: `references/geo-citation.md`, `references/ai-crawler-audit.md`

### BAŞLIK B — KLASİK SEO & MARKA TEMELİ
- robots.txt, sitemap(.xml), canonical, tek H1 kuralı, başlık hiyerarşisi.
- Favicon/icon/apple-icon + varsayılan OpenGraph görseli (yoksa oluştur).
- Title/description/keywords; OG + Twitter Cards.
- Erişilebilirlik temeli: zoom engelleme (viewport `user-scalable=no`) gibi WCAG ihlallerini ayıkla.

### BAŞLIK C — ENTITY SEO & SCHEMA (JSON-LD)
- Ana varlıkları tespit et: Organization, Brand, Product, Service, Person, Location, FAQ, Article.
- Sayfa bazlı Primary/Secondary entity ilişkisi + `@id` ile bağlı bütünleşik graf.
- FAQPage şeması (AI Overviews alıntıları için en yüksek getiri).
- **Entity Graph** çıkarımı ve eksik bağlantı raporu → detay: `references/entity-graph.md`

### BAŞLIK D — CORE WEB VITALS & PERFORMANS  *(en yüksek risk → en son, madde madde onay)*
- Hedefler: **LCP < 2.5s · INP < 200ms · CLS < 0.1 · TTFB < 800ms**
- Render-blocking, unused kod, aşırı DOM, hydration, görsel/font optimizasyonu, render stratejisi (SSR→ISR vb.)
- Framework'ün yerel araçlarını kullan (Next.js: `next/font`, `next/image`, dynamic import).
- Detay + raporlama formatı → `references/core-web-vitals.md`

### BAŞLIK E — METADATA TUTARLILIĞI & CRAWLABILITY
- Canonical mutlak URL tutarlılığı, kırık link, sitemap kapsamı (tüm indekslenebilir tipler).
- DB/CMS'teki anahtar kelime alanlarının sayfa metadata'sına enjekte edilmesi.
- Yapısal hiyerarşi denetimi.

---

## ÇIKTI FORMATI — SON RAPOR

Her onaylanan başlık sonunda ve en sonda `templates/son-rapor.template.md` formatında raporla:

1. Kritik Problemler · 2. GEO Problemleri · 3. Entity SEO Problemleri · 4. Teknik SEO Problemleri
· 5. Core Web Vitals Problemleri · 6. Accessibility Problemleri · 7. AI Crawler Problemleri
· 8. Yapılan Değişiklikler · 9. Oluşturulan Dosyalar · 10. Beklenen Lighthouse Kazancı
· 11. Beklenen GEO Kazancı · 12. Beklenen Crawlability Kazancı · 13. Riskli Değişiklikler
· 14. Sonraki Önerilen Adım

## REFERANS DOKÜMANLAR
- `references/code-safety.md` — değişiklik güvenlik protokolü
- `references/geo-citation.md` — AI citation optimization (alıntılanabilir içerik mimarisi)
- `references/entity-graph.md` — varlık haritası ve Knowledge Graph
- `references/ai-crawler-audit.md` — AI bot erişim denetimi + robots şablonları
- `references/core-web-vitals.md` — CWV hedefleri, teşhis ve framework bazlı çözümler
- `templates/kesif-raporu.template.md` — Faz 0 keşif raporu şablonu
- `templates/son-rapor.template.md` — 14 maddelik son rapor şablonu

Erişilemeyen harici standartlar için hafızandaki en güncel W3C / Google Core Web Vitals (INP dahil)
/ schema.org / `llms.txt` standartlarını baz al.
