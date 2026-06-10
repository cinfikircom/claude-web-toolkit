# Changelog

Biçim: [Keep a Changelog](https://keepachangelog.com/) esinli; sürümler `plugins/*/.claude-plugin/plugin.json`'dan.

## [Unreleased]

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
