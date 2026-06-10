# Knowledge Graph Conflict Detector (Başlık E çekirdeği)

Amaç: AI motorlarının (ChatGPT Search, Perplexity, Gemini) markan hakkında internetteki
**çelişkili kaynaklardan** yanlış bilgi sentezlemesini önlemek. Motorlar tek bir sayfaya değil,
markanın **tüm dijital ayak izine** bakar; ad/adres/kategori çelişkisi varsa ya yanlış bilgi verir
ya da güven düşüklüğünden markayı hiç kaynak göstermez. Bu denetim sitenin yapısal verisini
**otoriter tek doğru kaynak** kılar ve dış kanalları ona hizalar.

## 1. Taranacak kimlik alanları
| Alan | Nerede geçer |
|------|--------------|
| **Şirket adı** (ticari + legal) | site metni, `Organization.name`/`legalName`, footer, hakkında |
| **Marka/ürün adları** | sayfa başlıkları, schema `Brand`/`Product.name`, OG title |
| **Adres + telefon (NAP)** | iletişim sayfası, footer, `PostalAddress`, GBP (→ `local-seo.md`) |
| **Kuruluş yılı / kategori** | hakkında, schema `foundingDate`, dizin kayıtları |
| **Logo / görsel kimlik** | `Organization.logo`, OG image, sosyal profiller |
| **Sosyal profiller** | `sameAs[]`, footer linkleri |
| **Wikidata / Wikipedia** | `sameAs`, motorların KG çekirdeği |

## 2. Tespit prosedürü (ANALYZE)
1. **Site-içi tarama:** yukarıdaki alanların sitedeki *tüm* geçişlerini topla (metin + schema + meta).
   Site içinde bile farklı yazımlar varsa (footer "ABC Teknoloji A.Ş.", schema "ABC Software") önce onu yakala.
2. **Dış kanal taraması (WebFetch):** `sameAs`'taki + bilinen profilleri (LinkedIn, Instagram, GBP,
   sektörel dizinler, Wikidata) aç; aynı alanları çıkar.
3. **Çapraz karşılaştırma matrisi** kur (aşağıdaki rapor formatı) ve her hücreyi sınıflandır:
   - ✅ **Tutarlı** — birebir veya kabul edilebilir varyant (büyük/küçük harf).
   - ⚠️ **Varyant** — aynı varlık, farklı yazım ("ABC Tech" vs "ABC Teknoloji") → motor bunları
     ayrı varlık sanabilir.
   - ❌ **Çelişki** — farklı bilgi (eski adres, yanlış kuruluş yılı, başka kategori).
4. **sameAs doğrulaması:** her URL canlı mı + gerçekten bu varlığa mı ait? Kırık/yanlış profil → ❌.

## 3. Rapor formatı (sabit)
```
⚠ ENTITY CONFLICT DETECTED — {n} çelişki, {m} varyant

| Alan        | Site (SoT)        | Schema           | LinkedIn   | Instagram     | GBP  | Wikidata | Durum |
|-------------|-------------------|------------------|------------|---------------|------|----------|-------|
| Marka adı   | ABC Teknoloji     | ABC Software ❌  | ABC Tech ⚠ | abcteknoloji ⚠| —    | —        | ❌    |
| Telefon     | +90 312 555 4433  | aynı ✅          | yok        | farklı ❌     | aynı | —        | ❌    |
| Kuruluş     | 2008              | 2008 ✅          | 2010 ❌    | —             | —    | —        | ❌    |
```
Her ❌/⚠ satırı için: **doğru değer (source of truth) → düzeltilecek kanal → kim yapar (C/K)**.

## 4. Çözüm akışı (PROPOSE → EXECUTE)
- **Kod tarafı (Claude):** schema'yı tek doğru değere mühürle — `Organization.name` + `legalName`
  ayrımı, tek `@id`, doğrulanmış `sameAs[]`, doğru `foundingDate`/`address`. → `entity-graph.md`
- **Dış kanallar (kullanıcı, rehberli):** LinkedIn/Instagram/GBP/dizin profillerindeki ad-adres-
  kategori düzeltmeleri için net talimat + URL ver; `[!]` blocked olarak izle, doğrulamadan
  `completed` yapma.
- **Wikidata:** öğe varsa çelişkiyi düzeltmeyi öner; yoksa ve notability uygunsa kayıt açmayı
  kullanıcıya öner (Claude oluşturamaz).
- Çift yönlülük: profillerden siteye geri link olsun (karşılıklı doğrulama sinyali).

## 5. Skor bağı
Bu denetim **AI Visibility Score 2.5 kontrolünü** (knowledge conflict taraması) besler ve 2.3'ü
(`sameAs` doğrulaması) kanıtlar → `ai-visibility-score.md`. Kritik (❌) çelişki açıkken 2.5 puanı verilmez.

> NAP ayrıntıları `local-seo.md`'de, marka tutarlılığı ve E-E-A-T mühürleme `entity-graph.md`
> "Brand Consistency" bölümünde — bu dosya tespit + raporlama + çözüm akışının çekirdeğidir.
