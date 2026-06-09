# Başlık Hiyerarşisi (H1-H6) & Semantik HTML

Amaç: Sayfa yapısını hem **Google** (içerik anlama), hem **erişilebilirlik** (ekran okuyucu
gezinmesi), hem **GEO** (LLM'lerin içeriği parçalayıp = chunking alıntılaması) için doğru kurmak.
Bu üç hedef de **aynı** sağlam yapıdan beslenir.

## Başlık (heading) kuralları
1. **Sayfa başına tek `<h1>`** — sayfanın ana konusunu/birincil entity'sini içersin, benzersiz olsun.
2. **Sıralı iniş, atlama yok** — `H1 → H2 → H3`. H2'den doğrudan H4'e atlama. Geri çıkış serbest (H3 sonrası yeni H2).
3. **Başlık = yapı, stil değil** — büyük/küçük görünsün diye H seçme; boyut CSS'in işi.
4. **Boş/yinelenen başlık yok** — her başlık anlamlı metin içersin.
5. **GEO için soru-formatlı H2/H3** — "X nedir?", "Eryaman'da Y nerede?" → LLM eşleştirmesi yüksek
   (→ `references/geo-citation.md`). Her H2 bölümü **kendi içinde anlamlı bir chunk** olsun.

```
✅ DOĞRU                          ❌ YANLIŞ
<h1>Mermer Masa Tasarımı</h1>      <h1>Anasayfa</h1>
  <h2>Özel Üretim Modeller</h2>     <h1>Hoş geldiniz</h1>   ← ikinci H1
    <h3>Oval Mermer Masa</h3>       <h2>...</h2>
  <h2>Sıkça Sorulan Sorular</h2>      <h4>...</h4>           ← H3 atlandı
```

## Semantik HTML5 landmark'ları
Sayfa iskeletini `<div>` yığını yerine anlamlı etiketlerle kur:

| Etiket | Rol | Kural |
|--------|-----|-------|
| `<header>` | Sayfa/bölüm başlığı | Site geneli (logo/nav) + makale başlığı için ayrı olabilir |
| `<nav>` | Birincil gezinme | Ana menü; gerekiyorsa `aria-label` ile ayırt et |
| `<main>` | Ana içerik | Sayfada **tek**; benzersiz, asıl içerik |
| `<article>` | Bağımsız içerik | Tek başına anlamlı (haber, blog, ürün kartı) |
| `<section>` | Tematik bölüm | **Başlığı olmalı** (içinde bir h2/h3) |
| `<aside>` | Yan içerik | İlgili ama ikincil (kenar çubuğu, ilgili linkler) |
| `<footer>` | Alt bilgi | İletişim, telif, ikincil linkler |

- Landmark'lar ekran okuyucuda doğrudan "ana içeriğe atla" gezinmesi sağlar (A11y skoru).
- `<main>` + tek `<h1>` + sıralı başlıklar = Google'ın ana içeriği boilerplate'ten ayırmasını kolaylaştırır.
- LLM'ler `<nav>/<footer>/<aside>`'ı tekrarlayan markup olarak eler; `<article>/<main>` içeriğini alıntılar.

## Denetim adımları
1. Her sayfada `<h1>` sayısı = 1 mi? Benzersiz mi?
2. Başlık seviyelerinde atlama var mı? (HeadingsMap ile görselleştir.)
3. `<main>` tek mi, içerik orada mı? `<section>`'ların başlığı var mı?
4. Stil amaçlı yanlış H kullanımı var mı?
5. Landmark eksikleri (sadece `<div>`) → semantik etiketlere çevir (Medium Risk: markup değişimi).

## Araçlar
- **HeadingsMap** (tarayıcı eklentisi) — başlık ağacını görselleştirir.
- **axe DevTools** / **WAVE** — landmark + başlık + ARIA denetimi.
- Lighthouse Accessibility + SEO denetimleri (→ `references/lighthouse-rubric.md`).

> Risk: Başlık/landmark değişimi **Medium Risk** (markup düzeni). Görsel tasarımı bozmadan,
> CSS seçicilerini koruyarak uygula; tek sayfada doğrula, sonra yaygınlaştır.
