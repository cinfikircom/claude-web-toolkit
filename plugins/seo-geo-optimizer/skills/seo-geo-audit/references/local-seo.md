# Başlık G — Yerel SEO

Amaç: Coğrafi olarak hizmet veren işletmeler (TR'de çoğunluk) için yerel arama görünürlüğü:
Google haritalar/yerel paket, "yakınımda" aramaları ve yerel AI cevaplarında öne çıkmak.

## 1. NAP tutarlılığı (en kritik)
**NAP = Name, Address, Phone.** Üç yerde **birebir aynı** olmalı:
- Site (footer, iletişim sayfası)
- `LocalBusiness` JSON-LD schema
- Google Business Profile

> Tutarsızlık (farklı telefon formatı, eski adres) yerel sıralamayı **doğrudan** düşürür ve
> AI'ların güvenini kırar. Format dahil aynı olsun: `+90 312 …` her yerde aynı yazımla.

## 2. Yerel schema
```json
{
  "@type": "LocalBusiness",
  "@id": "https://SITE/#localbusiness",
  "name": "…", "telephone": "+90…",
  "address": { "@type": "PostalAddress", "streetAddress": "…", "addressLocality": "Eryaman",
               "addressRegion": "Ankara", "postalCode": "…", "addressCountry": "TR" },
  "geo": { "@type": "GeoCoordinates", "latitude": 0, "longitude": 0 },
  "areaServed": [{ "@type": "City", "name": "Ankara" }],
  "openingHoursSpecification": [ … ],
  "sameAs": ["https://www.google.com/maps/place/…", "…GBP profil…"]
}
```
(Detay + alt tipler → `references/schema-jsonld.md`.)

## 3. Google Business Profile
Kurulum/doğrulama → `references/offsite-setup.md` (Başlık K). Burada **denetim**: profil var mı,
doğrulanmış mı, kategoriler doğru mu, NAP siteyle tutarlı mı, GBP URL'si schema `sameAs`'ta mı.

## 4. Harita görünürlüğü
- Google Maps embed (iletişim sayfasında), doğru pin.
- GBP'de hizmet alanı/adres net.
- `geo` koordinatları schema'da gerçek konumla eşleşsin.

## 5. Yerel landing page analizi
Çok bölge/şube varsa: her lokasyon için **ayrı, özgün** sayfa:
- Benzersiz içerik (kopya değil), o bölgeye özel bilgi.
- Bölgeye özel `LocalBusiness` schema + `areaServed`.
- Yerel anahtar kelime ("Eryaman mermer masa") başlık/H1'de.
- Embed harita + o şubenin NAP'ı.
> Anti-pattern: yüzlerce şehir için içeriksiz "doorway page" üretme — Google cezası. Yalnızca
> gerçek hizmet verilen bölgeler için, gerçek içerikle.

## Çıktı
- NAP tutarsızlıkları (site vs schema vs GBP).
- Eksik/yanlış yerel schema alanları.
- GBP durum + `sameAs` bağı.
- Yerel landing page boşlukları/iyileştirmeleri (öncelik 🟢/🟡/⚪, iş hedefiyle).
