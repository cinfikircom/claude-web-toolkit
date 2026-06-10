# Katkı Rehberi — claude-web-toolkit

Teşekkürler! Bu repo, Claude Code eklentileri (plugin/skill/agent) koleksiyonudur.
Katkılar PR ile alınır; `main` korumalıdır.

> Not: Dokümantasyon şu an Türkçe'dir; İngilizce çeviri yol haritasındadır (→ `ROADMAP.md`).
> Yeni içerikte iki dilden birini seçebilirsin — karışık dilli tek dosya yazma.

## Repo yapısı
```
.claude-plugin/marketplace.json   ← plugin kayıtları (yeni plugin buraya eklenir)
plugins/<plugin-adı>/
  .claude-plugin/plugin.json      ← ad, sürüm, açıklama
  commands/                       ← /slash-komutları
  agents/                         ← uzman alt-ajanlar
  skills/<skill-adı>/SKILL.md     ← beceri + references/ + templates/
  tools/                          ← bağımlılıksız saf-Node CLI araçları
seo-os-validation-suite/          ← golden site + scorer (plugin kalite ölçümü)
```

## Kurallar

### Genel
1. **Bağımlılık ekleme.** `tools/` ve validation suite saf Node'dur; `package.json` bağımlılığı
   gerektiren araç ayrı tartışma ister (issue aç).
2. **Sürüm senkronu:** `plugin.json` `version` ↔ `SKILL.md` frontmatter `version` aynı olmalı
   (CI kontrol eder).
3. **Yol taşınabilirliği:** Agent/command/tool dokümanlarında skill dosyalarına işaret ederken
   `${CLAUDE_PLUGIN_ROOT}/skills/...` kullan — kurulu plugin'de göreli yollar çözülmez.
   SKILL.md içinde `references/...` göreli kalabilir.
4. **Üretilen artefaktlar:** Skill'in kullanıcı projesine yazdığı her dosya `.seo-os/` klasörüne
   gider; proje köküne dosya saçma.

### Skill / referans değişiklikleri
- Yeni referans dokümanı eklersen: SKILL.md "REFERANS DOKÜMANLAR" listesine + ilgili başlığa bağla.
- Davranış kurallarını (onay kapıları, %5 kuralı, mod akışı) **gevşeten** değişiklikler
  gerekçe ister — bu repo'nun değer önermesi "projeyi bozmadan iyileştirme"dir.

### Validation suite
- `golden-seo-test-site/` **bilerek bozuktur** — düzeltme/temizleme PR'ı kabul edilmez.
  Yeni kasıtlı hata eklersen `INJECTED-ISSUES.md`'ye ve `seo-baseline.json`'a işle.
- Scorer değişikliği yaptıysan örnek çıktıyla çalıştırıp sonucu PR açıklamasına ekle:
  ```bash
  cd seo-os-validation-suite && node seo-os-scorer.js
  ```

## PR kontrol listesi
- [ ] CI yeşil (`validate` workflow: syntax + JSON parse + sürüm senkronu + scorer smoke)
- [ ] `CHANGELOG.md`'ye bir satır eklendi
- [ ] Davranış değiştiyse SKILL.md/README güncel
- [ ] Commit mesajı `feat|fix|docs|test(kapsam): özet` biçiminde
