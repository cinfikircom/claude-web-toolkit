# Schema.org & JSON-LD Referansı

Kaynak: https://schema.org/ — GEO'nun bel kemiği. AI Overviews ve ChatGPT/Perplexity citation
sistemleri yapılandırılmış veriden çok beslenir. Çoğu site llms.txt ekler ama schema + entity
ilişkisini kurmadığı için güvenilir kaynak olarak öne çıkamaz.

Format: **JSON-LD** (`<script type="application/ld+json">`). Inline mikrodata kullanma.
`@id` ile graf bağla (bkz. `references/entity-graph.md`).

## Hangi sayfada hangi şema
| Sayfa tipi | Birincil şema | Ek şema |
|------------|---------------|---------|
| Ana sayfa | `WebSite` + `Organization` | `SearchAction` (sitelinks search box) |
| Hakkında | `AboutPage` | `Organization` |
| İletişim | `ContactPage` | `Organization` + `ContactPoint` |
| Firma/işletme detay | `LocalBusiness` (alt tip: `Restaurant`, `Store`, `Pharmacy`…) | `AggregateRating`, `Review`, `OpeningHoursSpecification`, `GeoCoordinates` |
| Ürün | `Product` | `Offer`, `AggregateRating`, `Review` |
| Hizmet | `Service` | `Offer`, `areaServed` |
| Haber/blog detay | `NewsArticle` / `Article` | `author`(Person), `publisher`(Organization), `BreadcrumbList` |
| Liste/kategori | `ItemList` | her öğe → ilgili entity `@id` |
| SSS | `FAQPage` | (AI Overviews alıntısı için en yüksek getiri) |
| Etkinlik detay | `Event` | `Place`, `Offer`, `performer` |
| Tarif | `Recipe` | `HowToStep`, `NutritionInformation`, `AggregateRating` |
| İş ilanı | `JobPosting` | `Organization` (hiringOrganization), `Place` |
| Kurs/eğitim | `Course` | `CourseInstance`, `Offer` |
| Video içeren sayfa | `VideoObject` | `Clip`, `SeekToAction` |
| Tüm sayfalar | `BreadcrumbList` | — |

## Temel kopya-yapıştır şablonlar (placeholder'ları doldur)

### WebSite + Organization (ana sayfada, graf kökü)
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://SITE/#organization",
      "name": "MARKA ADI",
      "url": "https://SITE/",
      "logo": "https://SITE/logo.png",
      "sameAs": ["https://...google-business", "https://...instagram", "https://www.wikidata.org/wiki/Q..."]
    },
    {
      "@type": "WebSite",
      "@id": "https://SITE/#website",
      "url": "https://SITE/",
      "name": "MARKA ADI",
      "publisher": { "@id": "https://SITE/#organization" },
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://SITE/ara?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
  ]
}
```

### LocalBusiness (firma detay)
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://SITE/firma/SLUG/#business",
  "name": "FİRMA ADI",
  "image": "https://SITE/resim/...",
  "address": { "@type": "PostalAddress", "streetAddress": "...", "addressLocality": "Eryaman", "addressRegion": "Ankara", "postalCode": "...", "addressCountry": "TR" },
  "geo": { "@type": "GeoCoordinates", "latitude": 0, "longitude": 0 },
  "telephone": "+90...",
  "openingHoursSpecification": [{ "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday"], "opens": "09:00", "closes": "18:00" }],
  "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.7", "reviewCount": "123" },
  "parentOrganization": { "@id": "https://SITE/#organization" }
}
```

### NewsArticle (haber detay)
```json
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "@id": "https://SITE/haber/SLUG/#article",
  "headline": "BAŞLIK",
  "image": ["https://SITE/resim/..."],
  "datePublished": "2026-01-01T08:00:00+03:00",
  "dateModified": "2026-01-02T10:00:00+03:00",
  "author": { "@type": "Person", "name": "YAZAR", "url": "https://SITE/yazar/SLUG" },
  "publisher": { "@id": "https://SITE/#organization" },
  "mainEntityOfPage": { "@type": "WebPage", "@id": "https://SITE/haber/SLUG" }
}
```

### FAQPage
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "SORU?", "acceptedAnswer": { "@type": "Answer", "text": "KISA NET CEVAP." } }
  ]
}
```

### BreadcrumbList
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Ana Sayfa", "item": "https://SITE/" },
    { "@type": "ListItem", "position": 2, "name": "Kategori", "item": "https://SITE/kategori/SLUG" }
  ]
}
```

### Product (ürün detay)
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "@id": "https://SITE/urun/SLUG/#product",
  "name": "ÜRÜN ADI",
  "image": ["https://SITE/resim/urun.webp"],
  "description": "ÜRÜN AÇIKLAMASI",
  "sku": "SKU-123",
  "brand": { "@type": "Brand", "name": "MARKA" },
  "offers": {
    "@type": "Offer",
    "url": "https://SITE/urun/SLUG",
    "priceCurrency": "TRY",
    "price": "199.90",
    "availability": "https://schema.org/InStock",
    "seller": { "@id": "https://SITE/#organization" }
  },
  "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.6", "reviewCount": "87" }
}
```
> `price`/`availability` yalnızca gerçek/güncel veriyse ekle — yanlış fiyat rich result cezası getirir.

### Service (hizmet detay)
```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": "https://SITE/hizmet/SLUG/#service",
  "serviceType": "HİZMET TÜRÜ",
  "name": "HİZMET ADI",
  "description": "HİZMET AÇIKLAMASI",
  "provider": { "@id": "https://SITE/#organization" },
  "areaServed": { "@type": "City", "name": "Ankara" },
  "offers": { "@type": "Offer", "priceCurrency": "TRY", "price": "0", "description": "Teklif için iletişime geçin" }
}
```

### Review + AggregateRating (standalone — yorum/değerlendirme bloğu)
```json
{
  "@context": "https://schema.org",
  "@type": "Review",
  "itemReviewed": { "@id": "https://SITE/firma/SLUG/#business" },
  "author": { "@type": "Person", "name": "YORUMCU ADI" },
  "datePublished": "2026-06-09",
  "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
  "reviewBody": "GERÇEK YORUM METNİ."
}
```
> `AggregateRating` tek başına değil **her zaman bir varlığa** (`Product`/`LocalBusiness`/`Service`)
> gömülü verilir (yukarıdaki örneklerde olduğu gibi). Uydurma puan = manuel ceza riski.

### Event (etkinlik detay)
```json
{
  "@context": "https://schema.org",
  "@type": "Event",
  "@id": "https://SITE/etkinlik/SLUG/#event",
  "name": "ETKİNLİK ADI",
  "description": "ETKİNLİK AÇIKLAMASI",
  "startDate": "2026-07-15T19:00:00+03:00",
  "endDate": "2026-07-15T22:00:00+03:00",
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "location": {
    "@type": "Place",
    "name": "MEKAN ADI",
    "address": { "@type": "PostalAddress", "streetAddress": "ADRES", "addressLocality": "Ankara", "addressCountry": "TR" }
  },
  "image": "https://SITE/images/etkinlik.jpg",
  "offers": {
    "@type": "Offer",
    "url": "https://SITE/etkinlik/SLUG/bilet",
    "price": "250",
    "priceCurrency": "TRY",
    "availability": "https://schema.org/InStock",
    "validFrom": "2026-06-01"
  },
  "performer": { "@type": "PerformingGroup", "name": "SANATÇI/GRUP" },
  "organizer": { "@id": "https://SITE/#organization" }
}
```
> Online etkinlikte `eventAttendanceMode` → `OnlineEventAttendanceMode` + `location` yerine
> `VirtualLocation` (`url`). İptal/erteleme durumunda `eventStatus` GÜNCELLENMELİ — eski tarihli
> "Scheduled" etkinlik knowledge conflict yaratır.

### Recipe (tarif)
```json
{
  "@context": "https://schema.org",
  "@type": "Recipe",
  "@id": "https://SITE/tarif/SLUG/#recipe",
  "name": "TARİF ADI",
  "image": ["https://SITE/images/tarif-1x1.jpg", "https://SITE/images/tarif-16x9.jpg"],
  "author": { "@type": "Person", "name": "YAZAR ADI" },
  "datePublished": "2026-06-09",
  "description": "TARİF ÖZETİ",
  "prepTime": "PT20M",
  "cookTime": "PT45M",
  "totalTime": "PT1H5M",
  "recipeYield": "4 porsiyon",
  "recipeCategory": "Ana yemek",
  "recipeCuisine": "Türk",
  "keywords": "ANAHTAR, KELİMELER",
  "nutrition": { "@type": "NutritionInformation", "calories": "350 kalori" },
  "recipeIngredient": ["2 su bardağı un", "1 yemek kaşığı zeytinyağı"],
  "recipeInstructions": [
    { "@type": "HowToStep", "name": "ADIM BAŞLIĞI", "text": "ADIM AÇIKLAMASI", "url": "https://SITE/tarif/SLUG/#adim-1" }
  ],
  "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.8", "ratingCount": "127" }
}
```
> `image` için 1:1, 4:3 ve 16:9 oranlarının üçü de önerilir (Google rich result). `aggregateRating`
> yalnızca gerçek kullanıcı puanı varsa.

### JobPosting (iş ilanı)
```json
{
  "@context": "https://schema.org",
  "@type": "JobPosting",
  "title": "POZİSYON ADI",
  "description": "<p>İLAN AÇIKLAMASI (HTML olabilir)</p>",
  "datePosted": "2026-06-09",
  "validThrough": "2026-08-09T23:59",
  "employmentType": "FULL_TIME",
  "hiringOrganization": { "@id": "https://SITE/#organization" },
  "jobLocation": {
    "@type": "Place",
    "address": { "@type": "PostalAddress", "streetAddress": "ADRES", "addressLocality": "Ankara", "addressRegion": "Ankara", "postalCode": "06000", "addressCountry": "TR" }
  },
  "baseSalary": {
    "@type": "MonetaryAmount",
    "currency": "TRY",
    "value": { "@type": "QuantitativeValue", "minValue": 60000, "maxValue": 90000, "unitText": "MONTH" }
  },
  "directApply": true
}
```
> Uzaktan pozisyonda `jobLocationType: "TELECOMMUTE"` + `applicantLocationRequirements` ekle.
> **Süresi dolan ilanın sayfası kaldırılmalı veya `validThrough` geçmişse schema silinmeli** —
> Google süresi geçmiş ilan markup'ına manuel ceza uygular.

### Course (kurs/eğitim)
```json
{
  "@context": "https://schema.org",
  "@type": "Course",
  "@id": "https://SITE/kurs/SLUG/#course",
  "name": "KURS ADI",
  "description": "KURS AÇIKLAMASI",
  "provider": { "@id": "https://SITE/#organization" },
  "offers": { "@type": "Offer", "price": "1500", "priceCurrency": "TRY", "category": "Paid" },
  "hasCourseInstance": {
    "@type": "CourseInstance",
    "courseMode": "Online",
    "courseWorkload": "PT10H",
    "startDate": "2026-09-01"
  }
}
```

### VideoObject (video içeren sayfa)
```json
{
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "name": "VİDEO BAŞLIĞI",
  "description": "VİDEO AÇIKLAMASI",
  "thumbnailUrl": "https://SITE/images/video-thumb.jpg",
  "uploadDate": "2026-06-09",
  "duration": "PT4M30S",
  "contentUrl": "https://SITE/videos/video.mp4",
  "embedUrl": "https://www.youtube.com/embed/VIDEO_ID",
  "publisher": { "@id": "https://SITE/#organization" }
}
```

## Doğrulama
- Schema Markup Validator: https://validator.schema.org/
- Google Rich Results Test: https://search.google.com/test/rich-results
- Zorunlu/önerilen alanlar eksikse rich result kazanılamaz — denetimde eksik alanları listele.

## Risk
JSON-LD eklemek **Low/Medium Risk** (markup eklemesi, mevcut davranışı bozmaz). Ama yanlış/sahte
veri (gerçek olmayan rating, yanlış adres) ceza riski → yalnızca DB/gerçek veriden üret.
