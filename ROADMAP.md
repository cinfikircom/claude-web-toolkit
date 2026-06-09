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

## 🔜 Planlanan (ileride)
### Operasyon / tooling
- [ ] **Terminal CLI tracker** — `seo-os-state.json`'u okuyup deterministic dashboard'u canlı render eden küçük CLI
- [ ] **Notion + GitHub sync** — state/raporları Notion DB'ye ve GitHub Issues'a yazan opsiyonel köprü
- [ ] **Otomatik ajan-run harness** — SEO-OS'u ANALYZE modda çalıştırıp `seo-os-output.json` üretip scorer'a besleyen uçtan uca pipeline

### Validation suite genişletme
- [ ] **Gerçek Lighthouse/PSI entegrasyonu** — golden site'a karşı gerçek CWV ölçümü
- [ ] **Before/after delta scoring** — optimizasyon öncesi/sonrası skor farkı raporu
- [ ] **Yeni golden fixture'lar** — e-ticaret, çok dilli, Cloudflare Pages varyantları
- [ ] **CI workflow** — PR'da scorer'ı otomatik çalıştır, eşik altı skorda uyar

### Plugin
- [ ] Ek schema tipleri (Event, Recipe, JobPosting…) için copy-paste şablonlar
- [ ] İngilizce doküman çevirisi (şu an TR)
- [ ] Ek framework desenleri (Remix, SolidStart)

> Yeni fikirler buraya eklenir; tamamlananlar ✅'ya taşınır.
