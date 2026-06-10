# Roadmap — claude-web-toolkit

Yaşayan plan. Tamamlananlar işaretli; "Planlanan" maddeleri ileride ekleyeceğiz.

## ✅ Tamamlandı
- **seo-geo-optimizer plugin** — 12 başlıklı Growth Optimization Framework
  (İş Hedefi · Rakip/İçerik Boşluğu · Topical Authority · GEO · Entity/Knowledge Graph ·
  Klasik SEO · Yerel SEO · Crawlability · Core Web Vitals · CRO · Off-site · Doğrulama)
- **22 referans + 8 template + 4 uzman ajan** (derin mod, bellek handoff)
- **SEO-OS v2 runtime** — file-based state (`seo-os-state.json` SSOT), 3 mod (ANALYZE/PROPOSE/EXECUTE),
  deterministic dashboard, phase locking, safety layer, Faz 0-A/0-B bölme
- **AI Visibility Score (0-100)**
- **SEO-OS Validation Suite** — golden broken site + baseline + scorer + decision-matrix + geo-simulation
- **Terminal CLI tracker** — `tools/seo-os-tracker.js`: `.seo-os/seo-os-state.json`'u okuyup deterministic
  dashboard'u render eder (`--detail` / `--watch` / `--json`, bağımlılıksız saf Node)
- **Yayın hijyeni & taşınabilirlik (v2.0.1)** — `${CLAUDE_PLUGIN_ROOT}` yolları, `.seo-os/` artefakt
  klasörü, sürüm senkronu, CI workflow (`validate`), CONTRIBUTING + CHANGELOG, FAZ 0-B 4+4 soru bölmesi
- **Denetim derinleştirme (v2.1.0)** — golden regression testi (CI), AI Visibility scoring model
  `aivs/v1` (5×5×4 sabit matematik), Knowledge Conflict Detector, Crawl Budget Audit,
  Cloudflare native modül genişletmesi (APO/Tiered Cache/Zaraz/Turnstile…), Release Readiness Gate
  (`/seo-audit gate` → PASS/FAIL)

## 🔜 Planlanan (ileride)
### Operasyon / tooling
- [ ] **Notion + GitHub sync** — state/raporları Notion DB'ye ve GitHub Issues'a yazan opsiyonel köprü
- [ ] **Otomatik ajan-run harness** — SEO-OS'u ANALYZE modda çalıştırıp `seo-os-output.json` üretip
      scorer'a besleyen uçtan uca pipeline (deterministik yarısı v2.1.0'da: golden regression CI testi;
      bu madde LLM çağrılı gerçek-run kısmını kapsar — `golden-tests/expected-score.json` tolerance
      alanları o gün için hazır)

### Validation suite genişletme
- [ ] **Decision matrix'i gerçek koşuya bağla** — `decision-matrix.json`'daki `seoOsDecision` alanları şu an
      statik örnek; scorer karar doğruluğunu (decisionAccuracy/wrongDecisions) gradlenen output'tan değil
      bu sabit değerlerden hesaplıyor. Scorer, matrix kararlarını output'un `detected`/`actionCorrect`/
      `falsePositives` alanlarından türetmeli (2026-06-10 gerçek test turunda tespit edildi).
- [ ] **Gerçek Lighthouse/PSI entegrasyonu** — golden site'a karşı gerçek CWV ölçümü
- [ ] **Before/after delta scoring** — optimizasyon öncesi/sonrası skor farkı raporu
- [ ] **Yeni golden fixture'lar** — e-ticaret, çok dilli, Cloudflare Pages varyantları
- [x] **CI workflow** — PR'da syntax + JSON + sürüm senkronu + scorer smoke (`.github/workflows/validate.yml`);
      eşik-altı-skor uyarısı gerçek agent-run harness'ı geldiğinde eklenecek

### Plugin
- [ ] Ek schema tipleri (Event, Recipe, JobPosting…) için copy-paste şablonlar
- [ ] İngilizce doküman çevirisi (şu an TR)
- [ ] Ek framework desenleri (Remix, SolidStart)

> Yeni fikirler buraya eklenir; tamamlananlar ✅'ya taşınır.
