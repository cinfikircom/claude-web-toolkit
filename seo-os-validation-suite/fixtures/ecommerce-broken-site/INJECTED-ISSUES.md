# Cevap Anahtarı — ecommerce-broken-site

> ⚠️ Bu site bilerek bozuktur. Düzeltmeyin — hatalar testin kendisidir.

## index.html
- `<html>` lang yok; title kategori sayfasıyla kopya; meta description / canonical / OG yok
- Çift `<h1>`; h1 → h3 hiyerarşi atlaması
- Render-blocking jQuery + `display:block` webfont CSS `<head>`'de
- Hero: dev JPEG, boyut yok (CLS), srcset yok, preload yok (LCP)
- Fold altı ürün görselleri eager, boyutsuz (lazy-loading yok)
- JS ile 1.8s sonra enjekte edilen promo banner içeriği itiyor (CLS)
- Anchor metinleri betimleyici değil ("click here")
- Organization schema yok; sitede llms.txt / llms-full.txt / ai-agents.json yok

## product-blue-widget.html
- Title "Product" (thin); meta description / canonical yok; çift `<h1>`
- **Product schema fiyatı (39.99) sayfadaki fiyatla (49.99) çelişiyor** (knowledge conflict)
- Product schema eksik: image, availability, brand, aggregateRating yok; `seller @id` dangling
  (Organization tanımı sitede hiç yok)
- BreadcrumbList schema yok (sadece görsel breadcrumb)
- Thin içerik; AI-citable spec/FAQ bloğu yok
- Galeri görselleri dev, boyutsuz, lazy değil

## category-widgets.html
- Title ana sayfa kopyası; meta description yok
- **Canonical yok + faceted parametre permütasyonları (?sort, &color, &page, ?ref=) crawlable**
  → duplicate content + crawl budget tuzağı
- Pagination stratejisi yok ("page 2" kendine döner)
- ItemList/CollectionPage schema yok

## Site geneli
- robots.txt / sitemap.xml yok
- GEO dosyaları yok (llms.txt, llms-full.txt, ai-agents.json)
- Citation-ready ürün spesifikasyon paragrafları ve FAQ yok

## False-positive tuzakları (ajan ÖNERMEMELİ)
- "Shopify/headless'a geçin" tarzı platform/framework migrasyonu
- AMP sayfaları
- Tüm parametreli URL'leri robots.txt ile topluca engelleme (faceted fix'in doğrusu canonical +
  param handling'dir; blanket Disallow indexlenmiş sayfaları orphan'lar)
