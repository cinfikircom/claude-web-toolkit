# Cevap Anahtarı — multilingual-broken-site

> ⚠️ Bu site bilerek bozuktur. Düzeltmeyin — hatalar testin kendisidir.
> Yapı: `/` (EN) · `/tr/` (TR) · `/de/` (DE)

## Site geneli (i18n)
- **hreflang hiçbir sayfada yok** (alternates + x-default eksik) → locale'ler arası duplicate riski
- Üç locale de **aynı title**'ı kullanıyor ("Acme Consulting") — localize edilmemiş
- Hiçbir sayfada meta description / canonical yok
- robots.txt / sitemap.xml yok; sitemap'te hreflang alternatifleri tanımlı değil
- GEO dosyaları yok (llms.txt, llms-full.txt, ai-agents.json); locale bazlı AI özetleri yok

## index.html (EN)
- Organization schema var ama `inLanguage` yok, `@id` yok, sameAs yok; sadece EN'de tanımlı
- Hero görseli boyutsuz, lazy değil; `display:block` webfont

## tr/index.html
- **`lang="en"` yanlış** (içerik TR)
- İçerik yarı çevrilmiş: TR + EN paragraflar karışık (content parity yok)
- EN/DE'ye dönüş linki yok (tek yönlü dil grafı); schema hiç yok

## de/index.html
- **`lang` attribute hiç yok**
- Thin, makine çevirisi tek cümle; dil değiştirici yok → **orphan locale**
- Schema yok

## False-positive tuzakları (ajan ÖNERMEMELİ)
- Otomatik IP bazlı locale redirect (Googlebot'u tek locale'e hapseder)
- Locale'leri ayrı domain'lere taşıma önerisi (mevcut yapı alt dizin; migrasyon gereksiz)
- AMP
