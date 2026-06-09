# Başlık B — Rakip & İçerik Boşluğu (Content Gap) Analizi

Amaç: Rakiplerin kapsadığı ama sitenin kapsamadığı alanları tespit etmek. Bugün GEO'nun en etkili
kaldıraçlarından biri — ChatGPT Search ve Perplexity birden çok kaynağı sentezler; boşlukları
kapatmak **alıntılanma yüzeyini** genişletir.

> Faz 0'da kullanıcıdan **en fazla 5 rakip URL** istenir. Yoksa: aynı sektör/coğrafyada bilinen
> oyuncular önerilir ve onaylatılır.

## Karşılaştırma boyutları
Her rakip için (WebFetch ile sayfalarını çekerek) şu eksenlerde karşılaştır:

| Boyut | Ne bakılır | Nasıl |
|-------|-----------|-------|
| **İçerik** | Kapsadıkları hizmet/konu/sayfa tipleri | Başlıklar (H1-H3), menü, sitemap |
| **Entity** | Tanımladıkları varlıklar, marka kapsamı | Sayfa yapısı, hakkında |
| **Schema** | Kullandıkları JSON-LD tipleri | Kaynak koddaki `application/ld+json` |
| **GEO** | `llms.txt`/`ai-agents.json`, citation yapısı, FAQ | `/llms.txt` getir, FAQ blokları |
| **Hız** | CWV/yük (kabaca) | PageSpeed (kullanıcıdan) / gözlem |

## İçerik boşluğu (gap) kategorileri
Rakipte **var**, sende **yok**:
- Hizmet/ürün sayfaları (kapsanmayan alt hizmetler)
- Kullanıcı soruları (How-to, "X nedir", karşılaştırma soruları)
- Vaka çalışmaları / referans / portföy
- Karşılaştırma içerikleri ("X vs Y", "en iyi …")
- SSS / FAQ blokları (AI Overviews için yüksek getiri)

## Claude bunu nasıl yapar
1. Faz 0'daki rakip URL'lerini WebFetch ile çek (ana sayfa + hizmet/blog menüsü).
2. Her rakipte başlık/konu/schema/llms.txt envanteri çıkar.
3. Site envanteriyle **diff** al → eksik konu/sayfa/schema listesi.
4. Eksikleri iş hedefiyle (Başlık A) önceliklendir ve ilgili başlığa yönlendir
   (içerik boşluğu → C Topical, schema boşluğu → E Entity, GEO boşluğu → D).

> Sınır: Bu beceri anahtar kelime hacmi/backlink araçlarına (Ahrefs/SEMrush) erişemez. Analiz
> **on-page + WebFetch** temellidir; veri varsa kullanıcı bunları besleyebilir.

## Çıktı — Gap tablosu
| Eksik öğe | Rakip(ler)de var | Tür (içerik/entity/schema/GEO) | Öncelik (🟢/🟡/⚪) | Kapatılacağı başlık |
|-----------|------------------|-------------------------------|---------------------|---------------------|
| {…} | {rakip} | {…} | {…} | {C / E / D / G} |
