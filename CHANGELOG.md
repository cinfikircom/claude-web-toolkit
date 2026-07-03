# Changelog

Biçim: [Keep a Changelog](https://keepachangelog.com/) esinli; sürümler `plugins/*/.claude-plugin/plugin.json`'dan.

## [Unreleased]

## [2.4.0] — 2026-07-03
### Eklendi
- **Gerçek CWV ölçümü:** `seo-os-dashboard.js --measure --url=…` — PageSpeed Insights API'sinden
  LCP/CLS/TTFB (+ CrUX alan verisi varsa **gerçek kullanıcı INP'si**, yoksa TBT vekili notuyla)
  çekip `cwv-report.json`a yazar; `--snapshot` ile birleşip zamanlanmış haftalık ölçüm olur
  (`PSI_API_KEY` opsiyonel, kota için önerilir). Test/CI için `--psi-mock=` kancası.
- **AI alıntılanma sondası:** yeni `tools/seo-os-probe.js` — hedef anahtar kelimelerle
  Perplexity / ChatGPT Search / Gemini'ye **gerçek sorgular** atar, sitenin kaynaklarda geçme
  yüzdesini motor başına skorlar ve panelin okuduğu `geo-report.json`a yazar (alan-adı bazlı
  tespit, alt alanlar dahil; env anahtarı olan sağlayıcılar çalışır; `--dry-run` destekli).
- **Bayat telemetri uyarısı:** son snapshot 14 günü geçerse Görev Rehberi'nde "📡 Telemetri bayat"
  satırı + yenileme komutu.
- CI: PSI ayrıştırma smoke testi (mock ile, ağsız) + probe dry-run + yeni araç syntax check.
- README'lere Komuta Merkezi ekran görüntüleri (`docs/images/`); GitHub Release v2.3.1 + repo topics.

## [2.3.1] — 2026-07-03
### Düzeltildi
- **Panel görselleri yuvarlatıldı:** dönen enerji çekirdeği ve holografik platform halkalarındaki
  kare JPEG kenarları daireye kırpıldı (`border-radius` + `aspect-ratio` + `object-fit`) ve
  `radial-gradient` mask ile kenarlar hangar sahnesine yumuşak geçişli hale getirildi.
### Doğrulandı
- GitHub'dan taze klonla uçtan uca kurulum simülasyonu: manifest bütünlüğü, görsel varlıklar,
  suite testleri, sıfır state'te oyun arayüzü + onboarding rehberi ve daemon yaşam döngüsü.

## [2.3.0] — 2026-07-03
### Eklendi
- **HTML Fayda Paneli:** `tools/seo-os-dashboard.js` — state + ölçüm dosyalarını kendi kendine yeten
  `dashboard.html`'e çevirir: önce→sonra AI Visibility, zaman içinde kazanım grafiği (SVG), AI motor
  alıntılanma kartları (ChatGPT/Perplexity/Gemini/AI Overviews), CWV hedef karşılaştırması, faz
  haritası, doğrulama delta raporu. `--snapshot` faz başına ölçümü `metrics-history.jsonl`'e işler;
  `--serve` canlı panel sunar — **yalnızca** `127.0.0.1`, proje standardı port `3928`.
  Varsayılan tema **açık**; sağ üst düğmeyle gece modu (tercih `localStorage`'da).
  **Robot Atölyesi:** dört robot karakter faz gruplarını temsil eder; her tamamlanan fazla robot
  gelişir, 14/14'te robotlar birleşip **Prime**'ı oluşturur (`/?prime=1` ile final önizlenebilir).
  Karakterler `tools/assets/robots/*.png`'den base64 gömülür (AI ile üretilmiş özgün 3D render'lar;
  tamamlanma oranına göre alttan yukarı inşa animasyonu); görsel yoksa yerleşik SVG'ye düşülür.
  **Daemon modu:** `--serve --daemon` paneli terminalden bağımsız arka plan sürecinde başlatır
  (`--status` / `--stop` ile yönetilir; pid `.seo-os/dashboard.pid`, log `.seo-os/dashboard.log`;
  çift başlatma korumalı).
  **Oyun arayüzü (Komuta Merkezi):** sci-fi hangar sahnesi (AI üretimi zemin + holografik platform +
  enerji çekirdeği, `tools/assets/game/`), SEVİYE/XP barı, robot başına modül (HP) barı ve isim
  plakası, Görev Günlüğü (✔/⚔/⛔/🔒, "+1 SEVİYE" ödülleri), başarım rozetleri ve Prime finali
  sahne ortasında enerji halesiyle. Görsel eksikse CSS/SVG yedeğe düşülür.
  Tema **tüm sayfaya** yayıldı: taktik grid zemin, HUD köşe braketli paneller, mono başlıklar,
  oyun dilinde bölüm adları (Telemetri, Görev Günlüğü, AI Motor Taraması, Performans Çekirdeği,
  Seyir Defteri) — açıklamalar sade ve okunur kaldı. **Görev Rehberi** bölümü kişiyi yönlendirir:
  boş kurulumda 1-2-3 başlangıç adımları, sonrasında aktif/sıradaki görev + engel uyarıları ve
  kopyalanabilir komutlar.
- **Skill entegrasyonu:** her faz `completed` olduğunda snapshot alma kuralı (SKILL.md + execution-model
  boot sırası) — fayda geçmişi kesintisiz birikir.
- **Deterministik suite testleri:** `golden-tests/check-integrity.js` (matrix⊆baseline, site eşleşmesi,
  actionCorrect⊆detected) + `golden-tests/check-delta.js` (delta-report davranış testi) — CI'da `npm test`.
- **Suite `package.json` + kök `.nvmrc`:** `npm run score/golden/integrity/delta-check/cwv/harness/judge`,
  `engines.node >= 20`.
- SKILL.md açıklamasına Türkçe tetikleyiciler ("SEO denetimi", "AI aramada görünürlük"…);
  referans indeksine `sources.md`.

### Düzeltildi
- **seo-os-sync.js:** Notion yanıtındaki korumasız `JSON.parse` (JSON olmayan 502/rate-limit yanıtı
  uncaught exception üretiyordu) → try/catch + reject; isteğe 30 sn timeout; `gh` arama dizesinde
  tırnak temizliği.
- **seo-os-scorer.js:** kategori başına yuvarlama "yalnızca tespit" yarım puanlarını (2.5) yukarı
  şişiriyordu → tek yuvarlama toplamda; breakdown artık ham yarım-adım değerler ve baseline'dan
  dinamik türetiliyor (5. kategori görünmez kalmaz). Golden beklenen skor 69→68 güncellendi.
  Ek: output şema (detected[]/actionCorrect[]) ve output↔baseline↔matrix `site` uyum guard'ları.
- **judge-consistency.js:** `meanAgreement` hiç işaretlenmeyen check'lerle ~1.0'a şişiyordu →
  yalnızca çekişmeli (≥1 koşuda işaretli) set üzerinden hesap; `contestedChecks` raporda;
  temp dosya `os.tmpdir()`'e taşındı.
- **run-agent-harness.js:** AUDIT çıktısında `findings[]` yoksa çıplak TypeError yerine açıklayıcı hata.
- **seo-os-tracker.js `--watch`:** atomic write-then-rename sonrası izleme sessizce donuyordu →
  dosya yerine dizin izleniyor.
- **lighthouse-runner.js:** `npx lighthouse` → `lighthouse@12` pin (tekrarlanabilir ölçüm);
  `--port` varsayılanı 4300→4310 (dokümanla uyum).
- CI: JSON parse elle liste yerine tüm izlenen `*.json`; sürüm senkronu marketplace.json + CHANGELOG'u
  da kapsıyor; dashboard smoke testi. `marketplace.json`'a `version` alanı eklendi.
- ROADMAP referans sayısı 22→26; state template'inde belirsiz `version` alanı `stateSchemaVersion` oldu.

## [2.2.0] — 2026-06-12
### Eklendi
- **Decision matrix v2 (dinamik karar):** `decision-matrix.json` artık yalnızca uzman beklentisi
  tutuyor (statik `correct`/`seoOSAction` yok); scorer kararları gradlenen output'un
  `detected`/`actionCorrect`/`falsePositives`/`prioritization` alanlarından türetiyor.
  Entry tipleri: `detection` · `prioritization` · `false-positive-trap` (regex `match`).
  Golden baseline birebir korundu (69 puan, 10✓/6✗, %63).
- **E2E agent-run harness:** `harness/run-agent-harness.js` — `claude -p` ile kör (cevap anahtarı
  sızdırmayan) AUDIT + LLM-judge GRADE + deterministic SCORE zinciri; `--site`/`--min-score`/
  `--audit-json`/`--dry-run` bayrakları. Manuel tetiklenen `agent-run.yml` CI workflow'u
  (workflow_dispatch, `ANTHROPIC_API_KEY` secret).
- **Gerçek CWV ölçümü:** `lighthouse-runner.js` — lokal `npx lighthouse` modu (`--start` ile
  golden site'ı boot'lar) + PSI API modu (`--psi`, CrUX field INP dahil); baseline
  `performanceTargets` ile karşılaştırıp PASS/FAIL raporu (`--enforce`).
- **Before/after delta raporu:** `delta-report.js` — iki agent output'unu skorlayıp toplam/kategori/
  FP/karar-doğruluğu deltaları + newly-fixed/newly-detected/regressed listeleri; `--md` çıktısı.
- **3 yeni golden fixture:** `fixtures/ecommerce-broken-site` (faceted canonical, Product schema
  fiyat çelişkisi), `fixtures/multilingual-broken-site` (hreflang/lang/parity),
  `fixtures/cloudflare-pages-broken-site` (`_headers` global noindex, redirect zinciri,
  AI-bot/GEO çelişkisi). Her biri INJECTED-ISSUES + baseline + v2 matrix ile; scorer'a
  `--baseline=`/`--matrix=` bayrakları eklendi.
- **Notion + GitHub sync köprüsü:** `tools/seo-os-sync.js` — state'i GitHub tracking issue'suna
  (gh CLI, `seo-os` etiketi, %100'de otomatik kapatma) ve Notion DB'ye (REST, upsert) senkronlar;
  varsayılan dry-run, `--apply` ile gönderir, `--md` önizleme.
- **Ek schema şablonları:** `schema-jsonld.md`'ye Event, Recipe, JobPosting, Course, VideoObject
  kopyala-yapıştır şablonları + sayfa-tipi tablosu satırları.
- **Yeni framework desenleri:** `framework-performance.md`'ye Remix (defer/Await streaming,
  prefetch=intent, Cache-Control/SWR) ve SolidStart (fine-grained reactivity, route preload,
  deferStream) bölümleri.
### Düzeltildi
- Scorer artık mutlak yol / CWD-göreli output dosyası kabul ediyor (önceden yalnızca suite dizinine
  göre çözüyordu — gerçek test turunda tespit edildi).
- "decisionAccuracy statik matristen geliyor" bilinen sınırı kapatıldı (yukarıdaki decision matrix v2).

## [2.1.0] — 2026-06-10
### Eklendi
- **Golden regression testi (CI):** `golden-tests/expected-score.json` + `check-regression.js` —
  scorer çıktısı commit'li baseline ile alan bazında karşılaştırılır; sapma PR'ı düşürür.
  (LLM'li uçtan uca ajan-run harness'ı ayrı ROADMAP maddesi olarak duruyor.)
- **AI Visibility Score standardizasyonu:** `ai-visibility-score.md` sabit modele geçti —
  `aivs/v1`: 5 boyut × 5 ikili kontrol × 4 puan; bant/izlenim puanlaması yasak; raporlar model sürümü belirtir.
- **`references/knowledge-conflict.md`** — Entity Conflict Detector: kimlik alanları çapraz
  karşılaştırma matrisi, sabit "⚠ ENTITY CONFLICT DETECTED" rapor formatı, çözüm akışı (C/K ayrımı).
- **`references/crawl-budget.md`** — faceted URL, canonical hijyeni, pagination, redirect zinciri,
  orphan, noindex tutarlılığı, sitemap hijyeni (Başlık H; büyük site/e-ticaret odaklı).
- **`references/release-gate.md`** + `/seo-audit gate` argümanı — Release Readiness Gate:
  8 hard check + 4 skor eşiği → sabit formatlı PASS/FAIL bloğu (ANALYZE; kod değiştirmez).

### Değişti
- `cloudflare-edge.md` genişletildi: APO, Tiered Cache, Cache Reserve, Speed Brain, Brotli/Zstd,
  HTTP/3, 0-RTT, Zaraz (INP/TBT), Turnstile (CRO bağlamı) + 14 maddelik CF denetim kontrol listesi.

## [2.0.1] — 2026-06-10
### Düzeltildi
- **Taşınabilirlik:** agent/command/tool dokümanlarındaki skill yolları `${CLAUDE_PLUGIN_ROOT}/...`
  önekine geçirildi — marketplace kurulumunda göreli yollar çözülmüyordu.
- **Sürüm senkronu:** `plugin.json` 1.0.0 → 2.0.0 (SKILL.md ile eşitlendi); CI'da senkron kontrolü.
- `~/` adlı yanlışlıkla oluşan klasör silindi; `.gitignore`'a `~/` eklendi.

### Değişti
- **`.seo-os/` klasörü:** üretilen tüm artefaktlar (`seo-os-state.json`, `seo-kesif-raporu.md`,
  `seo-gorev-listesi.md`, son rapor) artık kullanıcı projesinin kökü yerine `.seo-os/` altına yazılır;
  tracker her iki konumu da (geri uyumlu) otomatik bulur. Skill, klasör ilk oluşturulduğunda
  `.gitignore`'a ekleme/commit'leme tercihini bir kez sorar.
- **FAZ 0-B:** 8 hedef sorusu, AskUserQuestion'ın 4-soru limitine uygun olarak iki sabit tura bölündü.
- SKILL.md frontmatter `description` kısaltıldı (893 → ~560 karakter, tetikleyiciler korundu).

### Eklendi
- `.github/workflows/validate.yml` — CI: JS syntax + JSON parse + sürüm senkronu + scorer smoke testi.
- `CONTRIBUTING.md`, `CHANGELOG.md`.
- `references/geo-citation.md` genişletildi: önce/sonra HTML örnekleri, chunk bağımsızlığı testi,
  motor farkları tablosu (Perplexity/ChatGPT/AI Overviews/Gemini).
- `references/cro-audit.md` genişletildi: tel/WhatsApp, CTA, CLS'siz sticky bar, form örnekleri +
  GA4 event ile ölçüm bölümü.

## [2.0.0] — 2026-06-09
- SEO-OS v2 runtime: file-based state (SSOT), ANALYZE/PROPOSE/EXECUTE modları, deterministic
  dashboard, phase locking, Faz 0-A/0-B.
- 12 başlıklı Growth Optimization Framework; 22 referans + 8 template + 4 uzman ajan.
- AI Visibility Score (0-100); SEO-OS Validation Suite; terminal CLI tracker.

## [1.0.0] — 2026-06-08
- İlk sürüm: seo-geo-optimizer plugin + marketplace kaydı.
