# Claude Web Toolkit

Site-bağımsız web optimizasyon yeteneklerinin Claude Code eklenti koleksiyonu.
Tek repo, **birden çok yetenek** — her proje/sitede yeniden kullanılır.

## Yetenekler (plugins)

| Plugin | Ne yapar |
|--------|----------|
| **seo-geo-optimizer** | SEO + GEO (Generative Engine Optimization) + Entity SEO + Core Web Vitals + AI Crawler denetim ve optimizasyonu. İnteraktif keşifle başlar, framework'ü tespit eder, başlık başlık onayla uygular. |

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
veya bir başlıktan başlamak için: `/seo-audit geo` · `/seo-audit cwv` · `/seo-audit entity`

Akış:
1. **Faz 0 — İnteraktif Keşif:** Claude framework'ü tespit eder + chat'ten hedef/risk sorularını sorar,
   `seo-kesif-raporu.md` üretir. (Kod değişmez.)
2. **Başlık başlık uygulama:** A (GEO) → B (Klasik SEO) → C (Entity/Schema) → E (Metadata) → D (CWV).
   Her başlık: değişiklik + risk seviyesi → **onay** → uygula → 14 maddelik rapor → sonraki başlık.

## Güvenlik ilkeleri
- Onay almadan kod değişmez.
- Framework değiştirilmez; yalnızca mevcut mimariye uygun öneri.
- Kazanım %5'in altındaysa dokunulmaz.
- Her değişiklik Low/Medium/High risk etiketiyle sunulur.

## Yapı
```
claude-web-toolkit/
  .claude-plugin/marketplace.json
  plugins/seo-geo-optimizer/
    .claude-plugin/plugin.json
    commands/seo-audit.md
    skills/seo-geo-audit/
      SKILL.md
      references/{code-safety,geo-citation,entity-graph,ai-crawler-audit,core-web-vitals}.md
      templates/{kesif-raporu,son-rapor}.template.md
```

## Lisans
MIT (öneri — değiştirilebilir).
