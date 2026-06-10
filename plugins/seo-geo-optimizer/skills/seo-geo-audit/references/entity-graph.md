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

## Bütünleşik `@graph` örneği (copy-paste edilebilir)

Tek bir `<script type="application/ld+json">` içinde `@graph` ile tüm varlıkları `@id`
üzerinden bağla. Aşağıda Organization → WebSite → Service → Location → Article zinciri:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://site.com/#organization",
      "name": "Örnek Firma",
      "url": "https://site.com",
      "logo": { "@type": "ImageObject", "url": "https://site.com/logo.png" },
      "sameAs": [
        "https://www.linkedin.com/company/ornek",
        "https://www.wikidata.org/wiki/Q123456"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://site.com/#website",
      "url": "https://site.com",
      "name": "Örnek Firma",
      "publisher": { "@id": "https://site.com/#organization" }
    },
    {
      "@type": "Service",
      "@id": "https://site.com/hizmetler/danismanlik/#service",
      "name": "Danışmanlık Hizmeti",
      "provider": { "@id": "https://site.com/#organization" },
      "areaServed": { "@id": "https://site.com/#location" }
    },
    {
      "@type": "LocalBusiness",
      "@id": "https://site.com/#location",
      "name": "Örnek Firma — Ankara Şube",
      "parentOrganization": { "@id": "https://site.com/#organization" },
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Örnek Cad. No:1",
        "addressLocality": "Ankara",
        "addressCountry": "TR"
      }
    },
    {
      "@type": "Article",
      "@id": "https://site.com/blog/yazi/#article",
      "headline": "Yazı Başlığı",
      "mainEntityOfPage": "https://site.com/blog/yazi",
      "author": { "@id": "https://site.com/#organization" },
      "publisher": { "@id": "https://site.com/#organization" },
      "datePublished": "2026-06-09",
      "dateModified": "2026-06-09"
    }
  ]
}
</script>
```

Dikkat: aynı varlık birden fazla sayfada görünüyorsa **aynı `@id`'yi** kullan (örn. her sayfada
Organization `#organization` olsun). Böylece motor parçaları tek varlıkta birleştirir.

## Knowledge Conflict & Kimlik Mühürleme (Başlık E çekirdeği)

AI motorları (ChatGPT Search, Perplexity, Gemini) markan hakkında internetteki **diğer, belki eski**
kaynaklardan çelişkili bilgi toplayabilir (eski adres, kapanmış şube, yanlış kuruluş yılı). Amaç,
sitenin yapısal verisini **otoriter ve çapraz doğrulanabilir** kılarak bu çelişkileri çözmek.

> **Tam tespit prosedürü, çapraz karşılaştırma matrisi ve sabit "⚠ ENTITY CONFLICT DETECTED"
> rapor formatı → `references/knowledge-conflict.md`** (bu bölüm özet; çekirdek denetim orada).

### 1. Knowledge Conflict Audit
- Markanın dijital ayak izini (site + sosyal + dizinler + Google Business) tara, **tutarsızlıkları** listele:
  ad yazımı, adres, telefon (NAP → `references/local-seo.md`), kuruluş yılı, kategori, logo.
- Sitedeki bilgiyi **tek doğru kaynak (source of truth)** kabul et; diğer kanalları buna hizala (kullanıcı yönlendir).

### 2. sameAs Validation
- `Organization.sameAs`'a yalnızca **doğrulanabilir, markaya ait** profiller koy: resmi sosyal medya,
  Google Business, LinkedIn, sektörel dizinler, Wikipedia/Wikidata.
- Her `sameAs` URL'sinin **canlı ve aynı varlığa** ait olduğunu doğrula (kırık/yanlış profil zarar verir).
- Çift yönlülük: profillerde de siteye link olsun (karşılıklı doğrulama sinyali).

### 3. Wikidata Mapping
- Markanın Wikidata öğesi (`Q…`) varsa `sameAs`'a ekle — Knowledge Graph için en güçlü sinyallerden biri.
- Yoksa ve uygunluk varsa (notability), Wikidata kaydı oluşturmayı **kullanıcıya öner** (Claude oluşturamaz).
- Wikidata'daki bilgi siteyle çelişiyorsa düzeltilmesini öner.

### 4. Brand Consistency Audit
- Marka adı yazımı (büyük/küçük, boşluk, "A.Ş." vb.) tüm sayfalarda + schema + sosyalde **aynı** olsun.
- Logo, tagline, kategori tutarlı; `Organization.name` ve `legalName` doğru ayrımlansın.
- E-E-A-T sinyallerini koda mühürle: `Article.author` (Person + `url`), `Organization.founder`,
  `publisher` — yazarlık/uzmanlık/güvenilirlik açıkça schema'da görünsün (→ `references/eeat-quality-rater.md`).

> Çıktı: tutarsızlık listesi + `sameAs`/Wikidata önerileri + marka tutarlılık düzeltmeleri.
> Kod tarafı (schema mühürleme) Claude'da; harici kanal düzeltmeleri kullanıcıda (rehberli).

## Çıktı: Eksik bağlantı raporu
Şunları açıkça raporla:
- İzole/kopuk entity'ler (hiçbir şeye bağlı değil).
- Eksik `publisher` / `author` ilişkileri.
- Eksik `sameAs` (otorite sinyali).
- Tutarsız/çoğaltılmış `@id`'ler.
- Hiç şeması olmayan önemli sayfa tipleri.
