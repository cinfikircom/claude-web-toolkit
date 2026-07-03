---
name: seo-geo-audit
description: Growth Optimization Framework for ANY website — SEO + GEO + Entity/Knowledge Graph + Core Web Vitals + Local SEO + CRO. Triggers on "improve SEO", "SEO audit", "rank higher on Google", "be cited by ChatGPT/Perplexity/Gemini", "GEO / AI search optimization", "add llms.txt / schema / structured data", "improve Core Web Vitals", "competitor analysis", "more leads", or /seo-audit. Turkish triggers — "SEO denetimi", "SEO iyileştir", "Google'da üst sıralara çık", "AI aramada görünürlük/alıntılanma", "site hızını artır", "daha çok müşteri/lead". Framework-agnostic (Next.js, Astro, Nuxt, SvelteKit, plain HTML; Cloudflare-aware). Guided consultant: detects the stack, asks goal/risk questions, applies tasks one-by-one with approval.
version: 2.8.0
---

# AI Search & Growth Optimization Framework

Bu beceri, **herhangi bir web sitesini** sadece Google için değil; **Google + AI arama motorları**
(ChatGPT Search, Perplexity, Gemini, Claude, Copilot, AI Overviews) + Core Web Vitals + Knowledge
Graph + **iş hedefi/dönüşüm** açısından üst seviyeye çıkarır. Amaç sadece trafik değil, **daha fazla
lead/satış**. Site-bağımsızdır: framework'ü (ve Cloudflare kullanımını) tespit eder, yalnızca mevcut
mimariye uygun öneri üretir ve bir **danışman gibi adım adım yönlendirir**.

## 🔒 DEĞİŞMEZ KURALLAR (her zaman geçerli)

1. **Onay almadan kod değiştirme.** Her değişiklikten önce: (a) etkilenecek dosyaları listele,
   (b) değişikliği açıkla, (c) risk seviyesini belirt — `Low / Medium / High Risk`.
2. **Her başlığı tek tek uygula.** Hepsini birden yapma. Bir başlığı uygula → raporla → onay al → sonrakine geç.
   İlerlemeyi `.seo-os/seo-gorev-listesi.md`'de durum işaretleriyle (`[ ] [~] [✓] [!]`) takip et — bkz. "DURUM MODELİ".
3. **Framework değiştirmeyi ÖNERME.** (Next.js'e Astro tavsiye etme.) Mimari değişikliği yalnızca açıkça istenirse sun.
4. **%5 kuralı:** Beklenen SEO/performans kazanımı %5'in altındaysa kodu değiştirme — gereksiz risk alma.
5. **Mevcut çalışan fonksiyonelliği bozma.** Riskli refactor'dan kaçın. Çoklu dosya değişiminde bütünü teslim et.
6. Projenin kendi `CLAUDE.md` / katkı kuralları varsa onlara öncelik ver.

Detaylı güvenlik protokolü → `references/code-safety.md`

---

## FAZ 0 — İNTERAKTİF KEŞİF (her zaman buradan başla, İKİ ayrı turda)

Faz 0 **iki ayrı tura** bölünür (tek mesajda her şeyi sıkıştırma — bu SEO-OS v2 kuralıdır):
- **FAZ 0-A — Tech Scan:** yalnızca otomatik teknik tespit (ANALYZE modu, kod değişmez). Sonunda
  `.seo-os/seo-os-state.json`'u oluştur/güncelle ve dashboard'u göster.
- **FAZ 0-B — Business Input:** kullanıcıya hedef/rakip/risk sorularını sor; cevapları state'e yaz.

Çalışma protokolü (state, 3 mod, phase locking, deterministic dashboard, safety) → **`references/execution-model.md`**.

### FAZ 0-A) Otomatik teknik tespit (kod tabanını tara — ANALYZE)
Şunları tespit et ve kısaca raporla:
- **Framework & sürüm** (`package.json`, dosya yapısı; Next.js / Astro / Nuxt / SvelteKit / React SPA / düz HTML)
- **Build sistemi** ve **hosting ortamı** (Vercel / Netlify / Hostinger / kendi sunucu / static host)
- **Render stratejisi:** sayfa bazında SSR / SSG / ISR / CSR durumu
- **CDN / cache yapısı** + **Cloudflare** kullanımı mı (`cf-ray` header, `wrangler.toml`, `_headers`,
  Pages/R2/Workers) → varsa Başlık I & H'de edge yetenekleri (`references/cloudflare-edge.md`)
- **Mevcut SEO altyapısı:** robots, sitemap, metadata API kullanımı, mevcut JSON-LD şemaları,
  `llms.txt` / `ai-agents.json` var mı, favicon/OG görseli var mı
- **Off-site izleri (koddan):** Search Console doğrulama meta/dosyası, GA4/GTM tag'i, Bing doğrulaması var mı
- **Veri kaynağı:** içerik nereden geliyor (DB, CMS, markdown, statik)

### FAZ 0-B) Kullanıcıya sorulacak hedef soruları (AskUserQuestion ile, ayrı tur)
0-A bitip state yazıldıktan **sonra** sor — cevaplar tüm sonraki adımları şekillendirir ve state'e yazılır.
> ⚠️ **AskUserQuestion bir çağrıda en fazla 4 soru destekler.** 8 soruyu **iki çağrıya böl**:
> **Tur 1** = soru 1–4 (kelimeler · coğrafya/dil · hedef motorlar · risk), **Tur 2** = soru 5–8
> (iş hedefi · rakipler · öncelik/trafik · off-site). Sıra ve içerik sabittir — doğaçlama yapma.

1. **Hedef anahtar kelimeler / temalar:** Hangi aramalarda üst sırada olmak istiyorsun?
   (marka adı, kategori, lokasyon, ürün vb. — "değişken" kalıplar dahil)
2. **Coğrafya & dil:** Yerel SEO mi (şehir/bölge), ulusal mı, global mi? Site dili?
3. **Hedef motorlar:** Sadece Google mı, AI motorları da mı (ChatGPT/Perplexity/Gemini/Claude)?
4. **Risk toleransı:** `Sadece düşük riskli` / `Orta` / `Agresif (performans refactor dahil)`?
5. **Birincil iş hedefi (kritik):** Satış / Lead / Form / Rezervasyon / Telefon / WhatsApp / Bayilik /
   Üyelik? İkincil hedef? — Tüm önerileri buna göre önceliklendiririz (Başlık A → `references/business-goal.md`).
6. **Rakipler:** En fazla **5 rakip URL** ver — içerik/entity/schema/GEO/hız boşluğunu çıkaralım (Başlık B).
7. **Öncelik & trafik hedefi:** Hangi başlıktan başlayalım (yoksa önerilen sıra)? Aylık ziyaretçi/dönüşüm hedefi?
8. **Off-site durumu:** Google Search Console / GA4 / Bing kurulu mu? DNS/registrar erişimin var mı
   (doğrulama için)? Yerel işletme misin (Google Business Profile)? — Başlık G & K'yi şekillendirir.

> Framework tespitini de bu soruların içinde **kullanıcıya doğrulat** ("X tespit ettim, doğru mu?").

### FAZ 0-B · Tur 3 — Erişim & Varlık Envanteri (onboarding intake)
Tur 1-2 bittikten sonra, kullanıcı-tarafı TÜM gereksinimleri **tek seferde** envanterle
(→ **`references/onboarding-intake.md`** protokolü): AskUserQuestion (multiSelect) ile
5 kategoriyi sor — (1) görsel varlıklar: logo + **OG/sosyal görseli 1200×630** (proje
GitHub'daysa repo Social preview'ına da aynı görsel), (2) marka/NAP bilgileri, (3) hesap
erişimleri (GSC/GA4/DNS/GBP/hosting), (4) opsiyonel ölçüm API anahtarları (PSI/Perplexity/
GSC-SA), (5) içerik girdileri (kelimeler → `.seo-os/keywords.txt`, öncelikli sayfalar).
Her EKSİK kalem için referanstaki **adım adım edinme talimatını** ver; durumu
`state.intake` + eksikleri `state.blocked[]`'a yaz (panelde görünür) ve
`.seo-os/erisim-envanteri.md` tablosunu üret. Hiçbiri denetimi başlatmak için zorunlu değil.

### Faz 0 çıktısı
ÜÇ dosya üret, onay iste, **henüz kod değiştirme.** Tüm SEO-OS artefaktları kullanıcının proje
kökünü kirletmemek için **`.seo-os/` klasöründe** toplanır (yoksa oluştur):
1. `templates/seo-os-state.template.json` → **`.seo-os/seo-os-state.json`**: makine-okunur **tek doğruluk
   kaynağı** (mode, faz durumları, tech/business, competitors, score, blocked, log). 0-A'da oluşturulur.
2. `templates/kesif-raporu.template.md` → `.seo-os/seo-kesif-raporu.md`: mevcut durum + tüm başlıkların
   (A–L) ön analizi + iş hedefi + rakip özeti + öncelik + risk + **başlangıç AI Visibility Score**.
3. `templates/gorev-listesi.template.md` → `.seo-os/seo-gorev-listesi.md`: state'in **insan-okunur görünümü**
   (12 başlıklı rehberli checklist). Çelişirse `seo-os-state.json` kazanır.

> `.seo-os/` oluşturulduğunda kullanıcıya **bir kez** sor: bu klasör `.gitignore`'a eklensin mi
> (kişisel çalışma) yoksa commit'lensin mi (ekip görünürlüğü)? Cevabı state `log`'una not et.

## 🧭 REHBERLİ YÜRÜTME (bu beceri bir danışman gibi yönlendirir)
Kullanıcıyı elinden tutup **adım adım** ilerlet — sadece kod yazma, **yol göster**:
- Görevleri **tek tek** sun (hepsini birden değil). Her görev için: ne, neden, nasıl, risk.
- **Claude'un yapabileceğini yap** (kod, dosya üretimi). **Kullanıcının yapması gerekeni** (hesap
  açma, panelden gönderim, DNS kaydı) net talimat + tam URL ile iste ve **"tamamlandı" onayını bekle**.
- Her görev bitince `.seo-os/seo-gorev-listesi.md`'de durumu güncelle (`[~]`→`[✓]`, dış aksiyonda `[!]`) ve bir sonrakine geç.
- Harici skor (PageSpeed/Pingdom/DebugBear) için: kullanıcıdan URL'yi açıp sonucu paylaşmasını iste,
  çıktıyı yorumla, düzelt, **hedefe ulaşana kadar** döngüyü tekrarla (→ `references/audit-tools.md`).

---

## 📊 DURUM MODELİ & YÜRÜTME (SEO-OS v2)

Bu beceri bir **SEO Operating System** gibi çalışır. Tam runtime protokolü → **`references/execution-model.md`**.
Tek doğruluk kaynağı diskteki **`.seo-os/seo-os-state.json`** (insan görünümü: `.seo-os/seo-gorev-listesi.md`).

### Durum işaretleri (JSON `status` → sembol)
`not_started [ ]` · `in_progress [~]` · `completed [✓]` · `blocked [!]` (dış aksiyon bekliyor).

### Üç yürütme modu
**ANALYZE** (yalnız okur) → **PROPOSE** (diff planı + risk, onay bekler) → **EXECUTE** (uygular + state/log yazar).
Onaysız EXECUTE yok.

### Kritik davranış kuralları
1. **Tek faz `in_progress`.** Tüm sistemi tek seferde bitirme; atomic ilerle.
2. **State güncellemeden ilerleme yok.** Her EXECUTE sonrası `.seo-os/seo-os-state.json` + `.seo-os/seo-gorev-listesi.md` yaz.
3. **Onay kapıları:** onaysız ❌ kod değiştirme ❌ dosya oluşturma ❌ deploy.
4. **Checklist dışına çıkma.** Yeni iş → önce state'e ekle.
5. **Dış entegrasyon varsayma:** GSC/sitemap/GA4 "tamam" denip doğrulanmadan `completed` yapma; gerekirse `blocked`.

### Her raporda — deterministic dashboard (zorunlu, sabit format)
`=== SEO-OS DASHBOARD ===` bloğu (faz ızgarası + MODE + CURRENT TASK + BLOCKED + AI VISIBILITY) →
birebir `references/execution-model.md`'deki formatta render et.

### Fayda ölçümü — metrik snapshot (her faz tamamlandığında)
Bir faz `completed` olduğunda ölçümü geçmişe işle ve HTML fayda panelini yenile:
`node "${CLAUDE_PLUGIN_ROOT}/tools/seo-os-dashboard.js" --snapshot --note="<faz>: <özet>"`.
Gerçek veriyle besle (varsa): CWV için `--measure --url=<canlı-url>` (PSI API; PSI_API_KEY önerilir);
AI alıntılanma için `tools/seo-os-probe.js --site=<domain>` (PERPLEXITY/OPENAI/GEMINI API anahtarıyla;
D ve L görevlerinde çalıştır, anahtar kelimeleri FAZ 0-B cevaplarından `.seo-os/keywords.txt`e yaz).
Panel (`.seo-os/dashboard.html`) önce→sonra AI Visibility, AI motor alıntılanma skorlarını,
CWV'yi ve faz haritasını tek sayfada gösterir — kazanımın kanıtı budur (detay → `tools/README.md`).
Canlı izleme: `node "${CLAUDE_PLUGIN_ROOT}/tools/seo-os-dashboard.js" --serve --daemon` →
panel **sadece** `http://localhost:3928`'de sunulur (loopback; dışarıya açılmaz) ve terminalden
bağımsız yaşar (`--status` / `--stop` ile yönet).

### Cycle sonu raporu
**Completed · Pending · Blocked · Next Step · Estimated Impact** (format → `templates/son-rapor.template.md`).

---

## DENETİM & OPTİMİZASYON BAŞLIKLARI (12 başlık)

Her başlık ayrı bir çalışma turudur. Akış: **Strateji (A–C) → Arama Görünürlüğü (D–H) →
Performans (I) → Büyüme (J) → Off-site (K) → Doğrulama (L).** Önerilen sıra **A→B→C→D→E→F→G→H→I→J→K→L**;
I en riskli (madde madde onay), L en sonda (gerçek skor ancak optimizasyon sonrası ölçülür), K paralel başlatılabilir.

> **— STRATEJİ KATMANI (A–C): önce yön, sonra uygulama —**

### BAŞLIK A — İŞ HEDEFİ & DÖNÜŞÜM ÖNCELİKLENDİRME  *(tüm başlıkların merceği)*
- Birincil/ikincil dönüşüm hedefini netleştir; **her öneriyi hedef etkisine göre etiketle** (🟢 doğrudan / 🟡 dolaylı / ⚪ nötr).
- SEO ↔ dönüşüm çatışmalarında iş hedefini koru. Detay → `references/business-goal.md`

### BAŞLIK B — RAKİP & İÇERİK BOŞLUĞU ANALİZİ
- En fazla 5 rakibi WebFetch ile incele; içerik/entity/schema/GEO/hız boşluklarını çıkar.
- Eksik hizmet/soru/vaka/karşılaştırma/FAQ'ları ilgili başlığa yönlendir. Detay → `references/competitor-content-gap.md`

### BAŞLIK C — TOPICAL AUTHORITY & TOPIC CLUSTER
- Ana konu etrafında pillar→cluster haritası; eksik alt konular; hub-spoke iç linkleme.
- Kapsamlılık = Google otoritesi + AI citation. Detay → `references/topical-authority.md`

> **— ARAMA GÖRÜNÜRLÜĞÜ KATMANI (D–H) —**

### BAŞLIK D — GEO / LLM CRAWLER ALTYAPISI  *(düşük risk, yüksek getiri)*
- İçeriği chunking + citation için optimize et; `/llms.txt`, `/llms-full.txt`, `/ai-agents.json` oluştur (framework'e uygun).
- **AI Citation** → `references/geo-citation.md` · **llms.txt standardı** → `references/llms-txt-generator.md` · **AI Crawler Audit** → `references/ai-crawler-audit.md`

### BAŞLIK E — ENTITY SEO, SCHEMA & KNOWLEDGE GRAPH
- Ana varlıkları çıkar (Organization, Brand, Product, Service, Person, Location, FAQ, Article); `@id` ile bağlı bütünleşik `@graph`.
- **Knowledge Conflict Audit · sameAs Validation · Wikidata Mapping · Brand Consistency Audit** — dijital ayak izini çapraz mühürle.
- Çelişki tespiti: çapraz karşılaştırma matrisi + sabit "⚠ ENTITY CONFLICT DETECTED" raporu → `references/knowledge-conflict.md`
- Detay → `references/entity-graph.md` ve `references/schema-jsonld.md`

### BAŞLIK F — KLASİK SEO & MARKA + E-E-A-T
- robots/sitemap/canonical, title/description, OG + Twitter Cards, favicon/icon/apple-icon, görsel alt metni, hreflang.
- **Başlık hiyerarşisi (H1-H6) & semantik HTML** → `references/semantic-structure.md` · **E-E-A-T** → `references/eeat-quality-rater.md`

### BAŞLIK G — YEREL SEO
- NAP tutarlılığı (site + schema + GBP), `LocalBusiness` + `GeoCoordinates` + `areaServed`, harita görünürlüğü, yerel landing page'ler.
- Detay → `references/local-seo.md` (GBP kurulumu Başlık K'de).

### BAŞLIK H — METADATA TUTARLILIĞI & CRAWLABILITY
- Canonical mutlak URL tutarlılığı, kırık link, redirect zinciri, orphan sayfa, sitemap kapsamı.
- **Crawl budget** (büyük site/e-ticaret: faceted URL, pagination, noindex tutarlılığı) → `references/crawl-budget.md`
- **AI bot erişimi & robots** → `references/ai-crawler-audit.md` · Cloudflare arkasındaysa bot bloklaması → `references/cloudflare-edge.md`

> **— PERFORMANS KATMANI (I) —**

### BAŞLIK I — CORE WEB VITALS & PERFORMANS  *(en yüksek risk → madde madde onay)*
- Hedefler: **LCP < 2.5s · INP < 200ms · CLS < 0.1 · TTFB < 800ms**. Render-blocking, unused kod, hydration, görsel/font, render stratejisi.
- Framework'ün yerel araçları + **Cloudflare arkasındaysa** Polish/Fonts/Early Hints/Cache Rules → `references/cloudflare-edge.md`
- Detay → `references/core-web-vitals.md` · `resource-hints.md` · `framework-performance.md` · `lighthouse-rubric.md`

> **— BÜYÜME KATMANI (J) —**

### BAŞLIK J — CRO / DÖNÜŞÜM OPTİMİZASYONU
- CTA görünürlüğü, form sürtünmesi, telefon/WhatsApp erişimi, mobil dönüşüm akışı, teklif süreci.
- İş hedefiyle (A) bağ; CWV/SEO'yu bozma. Detay → `references/cro-audit.md`

> **— OFF-SITE & DOĞRULAMA (K–L): rehberli, Claude yönlendirir / kullanıcı yapar —**

### BAŞLIK K — OFF-SITE KURULUM  *(rehberli)*
- Google Search Console (doğrula → sitemap → indexing), Bing Webmaster (DuckDuckGo/Yahoo'yu kapsar), IndexNow, (ops.) Yandex.
- GA4 ölçüm kodu (framework-aware) + GSC bağlantısı; Google Business Profile (yerelse). Detay → `references/offsite-setup.md`

### BAŞLIK L — HARİCİ DOĞRULAMA & HEDEF SKOR  *(en son — döngü)*
- PageSpeed Insights (≥90 mobil/desktop, CWV Passed), DebugBear, Pingdom (A), GTmetrix.
- Ölç → en ağır metriği düzelt → yeniden ölç, **hedefe ulaşana kadar**. Detay → `references/audit-tools.md`
- Yayın/merge öncesi tek-komut karar: **Release Readiness Gate** (`/seo-audit gate`, ANALYZE —
  hard check'ler + skor eşikleri → PASS/FAIL) → `references/release-gate.md`

---

## DERİN MOD — 4 UZMAN AJANA BÖLME (opsiyonel)

Tek seferde tüm denetim geniş sitelerde yüzeysel kalabilir. Daha derin sonuç için (veya kullanıcı
"derin/kapsamlı denetim" istediğinde) iş, plugin'in 4 uzman ajanına bölünür:

| Ajan | Başlık | Odak |
|------|--------|------|
| `growth-strategy-agent` | A, B, C, J | İş hedefi, rakip/içerik boşluğu, topical authority, CRO |
| `seo-geo-agent` | D, F, G, H | GEO/llms.txt, klasik SEO, yerel SEO, crawlability |
| `entity-knowledge-graph-agent` | E | Entity çıkarımı, JSON-LD graf, Knowledge Graph/Wikidata, knowledge conflict |
| `performance-cwv-agent` | I | Core Web Vitals, Lighthouse, resource hints, Cloudflare edge |

> Off-site (K) + doğrulama (L) ana akışta yürütülür (rehberli, kullanıcı etkileşimli).

**Ne zaman böl:** büyük site, çok sayfa tipi, derin analiz talebi, paralel ilerleme.
**Nasıl:** Faz 0 keşfini ana akışta yap (framework + hedefler + rakipler tek yerden netleşsin), sonra
başlıkları ilgili ajana devret (`Agent` aracı). Her ajan **onay alarak** uygular.

**🧠 Bellek güvencesi (kritik):** Her ajan görevini bitirince `.seo-os/seo-gorev-listesi.md`'yi
günceller (`[~]`→`[✓]`, dış aksiyonda `[!]` + not). Bir sonraki ajan işe başlamadan **bu dosyayı okuyarak bağlamı devralır**
(önceki kararlar, üretilen dosyalar, açık maddeler). Böylece ajanlar arası geçişte hafıza kaybı/
dosya çakışması olmaz. Tek-tur denetim isteniyorsa bölme atlanır.

---

## ÇIKTI FORMATI — SON RAPOR

Her onaylanan başlık sonunda ve en sonda `templates/son-rapor.template.md` formatında raporla.
Rapor başında **AI Visibility Score (0-100, önce→sonra)** tablosu yer alır → `references/ai-visibility-score.md`.

Bölümler: İş Hedefi & Dönüşüm · Rakip/İçerik Boşluğu · Kritik Problemler · GEO · Entity/Knowledge Graph ·
Teknik SEO · Yerel SEO · Core Web Vitals · CRO · Accessibility · AI Crawler · Yapılan Değişiklikler ·
Oluşturulan Dosyalar · Beklenen Lighthouse/GEO/Crawlability Kazancı · **AI Visibility Score (önce→sonra)** ·
Riskli Değişiklikler · Sonraki Önerilen Adım.

## REFERANS DOKÜMANLAR
- `references/execution-model.md` — SEO-OS runtime: state.json, 3 mod, phase locking, deterministic dashboard, safety
- `references/code-safety.md` — değişiklik güvenlik protokolü
- `references/business-goal.md` — iş hedefi & dönüşüm önceliklendirme (Başlık A)
- `references/competitor-content-gap.md` — rakip & içerik boşluğu analizi (Başlık B)
- `references/topical-authority.md` — topic cluster / pillar haritası (Başlık C)
- `references/geo-citation.md` — AI citation optimization (alıntılanabilir içerik mimarisi)
- `references/entity-graph.md` — varlık haritası, Knowledge Graph, knowledge conflict & sameAs mühürleme
- `references/knowledge-conflict.md` — entity conflict detector: çapraz matris + sabit rapor formatı (Başlık E)
- `references/ai-crawler-audit.md` — AI bot erişim denetimi + robots şablonları
- `references/crawl-budget.md` — crawl budget: faceted URL, canonical hijyeni, pagination, orphan (Başlık H)
- `references/core-web-vitals.md` — CWV hedefleri, teşhis ve framework bazlı çözümler
- `references/llms-txt-generator.md` — `/llms.txt`, `/llms-full.txt`, `/ai-agents.json` oluşturma standardı
- `references/schema-jsonld.md` — Schema.org/JSON-LD referansı ve sayfa bazlı şema eşleştirme
- `references/eeat-quality-rater.md` — E-E-A-T & Google Search Quality Rater Guidelines
- `references/resource-hints.md` — preload, prefetch, preconnect, dns-prefetch, fetchpriority
- `references/framework-performance.md` — framework'e özel performans desenleri (Next.js, Astro, Nuxt, SvelteKit, HTML)
- `references/lighthouse-rubric.md` — Lighthouse puanlama rubriği, metrik ağırlıkları ve hedef tablosu
- `references/semantic-structure.md` — H1-H6 başlık hiyerarşisi & semantik HTML5 landmark kuralları
- `references/local-seo.md` — yerel SEO, NAP, yerel schema, landing page'ler (Başlık G)
- `references/cloudflare-edge.md` — Cloudflare Polish/Fonts/Early Hints/Cache + AI bot bloklama (Başlık I & H)
- `references/cro-audit.md` — dönüşüm optimizasyonu: CTA/form/telefon/WhatsApp (Başlık J)
- `references/offsite-setup.md` — Search Console / Bing / GA4 / GBP kurulum rehberi (Başlık K)
- `references/offsite-authority.md` — dış otorite katmanı: Wikidata/sameAs mühürleme, LLM-beslenen
  mecralar (Reddit/Quora/YouTube), NAP/citation, yorumlar, dijital PR, IndexNow (Başlık K genişletmesi)
- `references/onboarding-intake.md` — Erişim & Varlık Envanteri: işlem başında kullanıcıdan
  toplananlar (görseller/OG, NAP, hesap erişimleri, API anahtarları, içerik girdileri) + adım adım
  edinme talimatları (FAZ 0-B Tur 3)
- `references/audit-tools.md` — PageSpeed / Pingdom / DebugBear / GTmetrix ve hedef skor döngüsü (Başlık L)
- `references/ai-visibility-score.md` — AI Visibility Score (0-100): sabit scoring model `aivs/v1` (5 boyut × 5 kontrol × 4 puan)
- `references/release-gate.md` — Release Readiness Gate: hard check'ler + skor eşikleri → PASS/FAIL (`/seo-audit gate`)
- `references/sources.md` — yüksek öncelikli dış kaynak listesi ve öncelik sırası (ajan içi atıflar buradan)
- `templates/seo-os-state.template.json` — makine-okunur state (tek doğruluk kaynağı)
- `templates/kesif-raporu.template.md` — Faz 0 keşif raporu şablonu
- `templates/gorev-listesi.template.md` — rehberli görev listesi (state'in insan görünümü)
- `templates/son-rapor.template.md` — 14 maddelik son rapor şablonu
- `templates/llms.txt.template` · `llms-full.txt.template` · `ai-agents.json.template` · `robots-ai.txt.template` — hazır artefakt şablonları (placeholder'ları gerçek veriyle doldur)
- `templates/schema-{product,event,howto,video}.jsonld.template` — gelişmiş JSON-LD şablonları
  (Başlık E ve `/seo-wizard` ADIM 5; doldururken `_talimat` alanlarını sil, sahte rating ekleme)

## UZMAN AJANLAR (derin mod — plugin `agents/` altında)
- `growth-strategy-agent` — Başlık A, B, C, J
- `seo-geo-agent` — Başlık D, F, G, H
- `entity-knowledge-graph-agent` — Başlık E
- `performance-cwv-agent` — Başlık I

Erişilemeyen harici standartlar için hafızandaki en güncel W3C / Google Core Web Vitals (INP dahil)
/ schema.org / `llms.txt` standartlarını baz al.
