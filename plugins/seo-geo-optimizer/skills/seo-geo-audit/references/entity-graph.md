# Entity Graph & Knowledge Graph

Amaç: Site genelinde varlıklar (entity) arası ilişkileri kurarak Google Knowledge Graph ve
AI motorlarının siteyi "anlamasını" sağlamak. Bu, klasik SEO'dan ayrışan en kritik katmandır.

## Varlık haritası (hiyerarşi)
```
Organization
 → Services        (sunulan hizmetler)
 → Products        (ürünler)
 → Locations       (şube/bölge/coğrafi varlıklar)
 → Authors         (yazarlar / kişiler)
 → Articles        (içerik / haber / blog)
```

## Her entity için çıkarılacak alanlar
- **Name** — varlık adı
- **Description** — kısa, net tanım
- **URL** — kanonik adres
- **Related Entity** — ilişkili varlıklar (`@id` referansları ile)

## Bağlama kuralları (JSON-LD `@id`)
- Tüm sayfalardaki Organization aynı `@id`'yi paylaşsın (`{SITE}#organization`).
- WebSite → `publisher` ile Organization'a bağlansın.
- Article/NewsArticle → `publisher` + `author` ile bağlansın; `mainEntityOfPage` versin.
- LocalBusiness/Product/Service → ait olduğu Organization'a ve Location'a referans versin.
- Liste sayfaları → `ItemList` + her öğe ilgili entity `@id`'sine işaret etsin.
- `sameAs` ile sosyal/harici profilleri (Google Business, sosyal medya, Wikipedia/Wikidata) bağla.

## Çıktı: Eksik bağlantı raporu
Şunları açıkça raporla:
- İzole/kopuk entity'ler (hiçbir şeye bağlı değil).
- Eksik `publisher` / `author` ilişkileri.
- Eksik `sameAs` (otorite sinyali).
- Tutarsız/çoğaltılmış `@id`'ler.
- Hiç şeması olmayan önemli sayfa tipleri.
