# Crawl Budget Audit (Başlık H — büyük site / e-ticaret odaklı)

Amaç: Googlebot ve AI crawler'ların sınırlı tarama bütçesinin **değersiz URL'lere harcanmasını**
önlemek. Küçük sitelerde (≲500 URL) genelde sorun değildir — Faz 0'da URL ölçeğini tespit et;
küçükse bu denetimi "hızlı kontrol" seviyesinde geç, büyük/e-ticaret sitede tam uygula.

## Denetim kalemleri

### 1. Faceted / parametreli URL'ler (e-ticarette en büyük bütçe yutucu)
- `?renk=mavi&beden=m&sirala=fiyat` kombinasyonları sonsuz URL uzayı yaratır.
- Tespit: route/filtre kodu + sitemap + (varsa) GSC "Taranan ama dizine eklenmeyen".
- Çözüm: filtre kombinasyonlarına `noindex,follow` veya canonical → temel kategori;
  değerli kombinasyonlar (örn. `/ayakkabi/nike`) ayrı landing page olarak indekslenebilir kalır.
- robots.txt ile **agresif bloklamadan önce** düşün: bloklanan URL'deki linkler de görünmez olur.

### 2. Canonical hijyeni
- Her indekslenebilir sayfada **mutlak, kendine veya tek temsilciye** işaret eden canonical.
- Anti-desen: canonical zinciri (A→B→C), parametreli URL'ye canonical, http/https veya
  www/apex karışımı, sayfalamada hepsinin 1. sayfaya canonical'ı (yanlış — her sayfa kendine).

### 3. Pagination
- `?page=2…N` sayfaları: kendine canonical + `noindex` **kullanma** (link akışı kesilir);
  bunun yerine kendine canonical + indekslenebilir bırak, içerik tekrarını azalt.
- "Tümünü gör" varyantı varsa canonical'ı ona ver. Sonsuz scroll'da crawl edilebilir
  sayfalı eşdeğer (link'li `?page=N`) şart.

### 4. Redirect zincirleri
- Hedef: tek sıçrama (301 → final). Zincir (A→B→C) ve döngü bütçe + sinyal kaybı.
- Tespit: sık linklenen URL'lerde `curl -sIL` ile hop sayısı; iç linkleri **final URL'ye** güncelle.

### 5. Orphan sayfalar
- Sitemap'te olup hiçbir iç linkten erişilemeyen sayfalar (veya tersi: linkli ama sitemap dışı).
- Tespit: sitemap URL listesi ↔ iç link grafı karşılaştır.
- Çözüm: değerliyse iç link ver (hub/cluster → `topical-authority.md`); değersizse sitemap'ten çıkar + 410/redirect.

### 6. noindex tutarlılığı
- `noindex` + sitemap'te listeleme = çelişkili sinyal; sitemap'ten çıkar.
- robots.txt `Disallow` + sayfada `noindex` = Google noindex'i **göremez** (sayfayı açamaz) —
  ikisinden birini seç (genelde: taranabilir bırak + `noindex`).
- Yanlışlıkla `noindex` kalmış değerli sayfa (staging'den sızma) — önce bunu ara.

### 7. Sitemap kapsamı & hijyeni
- Sitemap yalnızca **200 dönen, indekslenebilir, canonical** URL içersin (redirect/404/noindex temizle).
- Büyük sitede bölünmüş sitemap (ürün/kategori/blog) + `lastmod` gerçek değerle.

## Rapor formatı
```
CRAWL BUDGET AUDIT — {site} ({tahmini URL sayısı})
| Kalem            | Durum | Bulgu                                  | Çözüm                  | Risk |
|------------------|-------|----------------------------------------|------------------------|------|
| Faceted URLs     | ❌    | ~12.000 filtre kombinasyonu indekste   | noindex,follow + canon | Med  |
| Redirect chains  | ⚠️    | 14 URL'de 2+ sıçrama                   | iç linkleri finale çek | Low  |
| Orphan pages     | ❌    | 23 sayfa linksiz                       | hub linkleme / 410     | Low  |
```
GSC erişimi varsa (Başlık K sonrası) "Sayfa indekslenmesi" raporundaki **"Taranan –
dizine eklenmedi"** ve **"Yinelenen sayfa"** sayılarıyla bulguları doğrula; yoksa `[!]` not düş.

> AI crawler boyutu: GPTBot/PerplexityBot da aynı URL uzayını tarar — temiz bütçe GEO'ya da hizmet
> eder (→ `ai-crawler-audit.md`). Cloudflare arkasında crawler hız limitleri → `cloudflare-edge.md`.
