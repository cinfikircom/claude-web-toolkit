# Roadmap — claude-web-toolkit

Yaşayan plan. Tamamlananlar işaretli; "Planlanan" maddeleri ileride ekleyeceğiz.

## ✅ Tamamlandı
- **seo-geo-optimizer plugin** — 12 başlıklı Growth Optimization Framework
  (İş Hedefi · Rakip/İçerik Boşluğu · Topical Authority · GEO · Entity/Knowledge Graph ·
  Klasik SEO · Yerel SEO · Crawlability · Core Web Vitals · CRO · Off-site · Doğrulama)
- **27 referans + 12 template + 4 uzman ajan** (derin mod, bellek handoff)
- **SEO-OS v2 runtime** — file-based state (`seo-os-state.json` SSOT), 3 mod (ANALYZE/PROPOSE/EXECUTE),
  deterministic dashboard, phase locking, safety layer, Faz 0-A/0-B bölme
- **AI Visibility Score (0-100)**
- **SEO-OS Validation Suite** — golden broken site + baseline + scorer + decision-matrix + geo-simulation
- **Terminal CLI tracker** — `tools/seo-os-tracker.js`: `.seo-os/seo-os-state.json`'u okuyup deterministic
  dashboard'u render eder (`--detail` / `--watch` / `--json`, bağımlılıksız saf Node)
- **HTML Fayda Paneli (v2.3.0)** — `tools/seo-os-dashboard.js`: önce→sonra AI Visibility, kazanım trendi
  (SVG), AI motor alıntılanma kartları, CWV hedef karşılaştırması, faz haritası, delta raporu;
  `--snapshot` ile faz başına ölçüm geçmişi, `--serve` ile canlı panel (sadece `localhost:3928`)
- **Yayın hijyeni & taşınabilirlik (v2.0.1)** — `${CLAUDE_PLUGIN_ROOT}` yolları, `.seo-os/` artefakt
  klasörü, sürüm senkronu, CI workflow (`validate`), CONTRIBUTING + CHANGELOG, FAZ 0-B 4+4 soru bölmesi
- **Denetim derinleştirme (v2.1.0)** — golden regression testi (CI), AI Visibility scoring model
  `aivs/v1` (5×5×4 sabit matematik), Knowledge Conflict Detector, Crawl Budget Audit,
  Cloudflare native modül genişletmesi (APO/Tiered Cache/Zaraz/Turnstile…), Release Readiness Gate
  (`/seo-audit gate` → PASS/FAIL)
- **Validation suite v2 + entegrasyonlar (v2.2.0)** —
  **decision matrix v2:** scorer kararları artık statik `correct` alanlarından değil, gradlenen
  output'un `detected`/`actionCorrect`/`falsePositives`/`prioritization` alanlarından dinamik türetiyor ·
  **E2E agent-run harness:** `harness/run-agent-harness.js` (kör AUDIT → LLM-judge GRADE → SCORE,
  `claude -p`; `agent-run.yml` workflow_dispatch CI job'u) ·
  **gerçek Lighthouse/PSI:** `lighthouse-runner.js` (lokal `npx lighthouse` + PSI API, CrUX field INP) ·
  **before/after delta:** `delta-report.js` (skor/kategori/karar deltaları + markdown rapor) ·
  **3 yeni golden fixture:** `fixtures/` e-ticaret / çok dilli / Cloudflare Pages (baseline + v2 matrix;
  scorer `--baseline=`/`--matrix=`) ·
  **Notion + GitHub sync:** `tools/seo-os-sync.js` (tracking issue upsert + Notion DB upsert, dry-run varsayılan) ·
  **ek schema şablonları:** Event, Recipe, JobPosting, Course, VideoObject ·
  **yeni framework desenleri:** Remix, SolidStart
- **CI workflow** — PR'da syntax + JSON + sürüm senkronu + golden regression
  (`.github/workflows/validate.yml`); LLM'li eşik-altı-skor kontrolü `agent-run.yml`'de (manuel tetik)
- **Fixture golden regression** — 3 fixture artık committed `expected-score.json` + deterministik
  `sample-output.json` ile CI golden regression'a dahil; `check-regression.js` çoklu-config
  (ana site + `fixtures/*/expected-score.json` otomatik keşif), boş-output smoke step'i kaldırıldı
- **Judge-tutarlılık testi** — `harness/judge-consistency.js`: tek sabit audit'i GRADE judge'a N kez
  verip skorlama kararlılığını ölçer (totalScore stddev + check başına agreement + "flapping" listesi,
  `--min-agreement`/`--max-stddev` gate). Ortak GRADE mantığı `harness/grade-lib.js`'e çıkarıldı
  (harness + judge-consistency paylaşır)
- **Çift dil README** — `README.md` İngilizce ana dile çevrildi, Türkçe içerik `README.tr.md`'de
  korundu; karşılıklı dil linkleri
- **Komuta Merkezi dönemi (v2.3.x–v2.7.0)** —
  **oyun arayüzlü panel:** hangar sahnesi, AI-üretimi robot karakterler (görevle gelişir, 14/14'te
  Prime birleşmesi), XP/rütbeler, görev günlüğü, başarımlar, zafer kartı PNG; `--serve --daemon`
  yaşam döngüsü (sadece `localhost:3928`), açık/koyu tema ·
  **gerçek veri köprüleri:** PSI/CrUX CWV (`--measure`), GSC Arama Telemetrisi (`seo-os-gsc.js`),
  AI alıntılanma sondası (`seo-os-probe.js`) ·
  **filo kokpiti** (`--fleet`, ajans modu) ·
  **/seo-wizard** içerik derinliği sihirbazı + `seo-os-doctor` (state onarım) +
  `seo-os-sitecheck` (yetim/anchor/alt taraması) + 4 gelişmiş şema şablonu ·
  **dış katman:** `seo-os-indexnow.js` + `references/offsite-authority.md` (Wikidata/sameAs) ·
  **altyapı:** ortak `seo-os-state-lib`, Windows CI matrisi, haftalık E2E bekçisi,
  GitHub vitrini (rozetler, EN release notları, `llms.txt`)

## 🔜 Planlanan (ileride)
### Plugin / Panel
- [ ] Robot replikleri (hover'da konuşma balonları — rehber mesajlarını karakterler versin)
- [ ] `--export=pdf` müşteri raporu (headless Chrome `--print-to-pdf` ile tek bayrak)
- [ ] Sync'e Slack/Discord webhook bildirimi (görev tamamlandı / skor değişti)
- [ ] Opsiyonel ses efektleri (WebAudio synth, kapatılabilir)
- [ ] İç dokümanların İngilizce'si (CHANGELOG/ROADMAP, SKILL.md gövdesi, referanslar hâlâ TR;
      üst-düzey README artık çift dil)
### İzleme / bakım
- [ ] Probe sağlayıcı şemaları: OpenAI Responses / Gemini grounding yanıt biçimleri değişirse
      alan-adı taraması dayanıklı ama model adları güncellenmeli (env ile geçersiz kılınabilir)
- [ ] Fixture çeşitlendirme: JS-ağırlıklı SPA ve WordPress-çıktısı golden fixture'ları

### Repo sahibi aksiyonları (kod değil)
- [ ] `ANTHROPIC_API_KEY` secret'ını repoya ekle → haftalık E2E bekçisi gerçekten koşsun
- [ ] GitHub Settings → Social preview → `docs/images/panel-komuta-merkezi.png` yükle
- [ ] Gerçek bir projede uçtan uca dene (kurulum → /seo-audit → /seo-wizard → panel) ve geri bildir

> Yeni fikirler buraya eklenir; tamamlananlar ✅'ya taşınır.
