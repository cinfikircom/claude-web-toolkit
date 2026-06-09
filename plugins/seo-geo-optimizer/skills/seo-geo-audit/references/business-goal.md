# Başlık A — İş Hedefi & Dönüşüm Önceliklendirme

Amaç: Her sitenin **birincil dönüşüm hedefi** farklıdır. Tüm SEO/GEO/performans önerileri bu hedefe
göre önceliklendirilir. Bu başlık diğer **tüm başlıkların merceğidir** — Faz 0'dan hemen sonra netleşir.

> **Kritik ilke:** SEO için iyi olan, dönüşüm için kötü olabilir. (Örn: anahtar kelime için sayfanın
> üstüne 600 kelime metin yığmak CTA'yı aşağı iter → trafik artar, dönüşüm düşer.) Çatışmada
> **iş hedefi kazanır** — trafik değil, lead/satış optimize edilir.

## Dönüşüm hedefi tipleri
| Hedef | Örnek sektör | Birincil KPI | Kritik sayfa/öğe | Önce gelen schema |
|-------|--------------|--------------|------------------|-------------------|
| **Satış** | E-ticaret | Sepete ekleme / sipariş | Ürün, kategori, sepet | `Product` + `Offer` + `AggregateRating` |
| **Lead** | B2B, danışmanlık | Form gönderimi | Hizmet sayfası + form | `Service`, `ContactPoint` |
| **Form / Teklif** | Catering, inşaat | Teklif formu | Teklif sayfası | `Service` + `Offer` |
| **Rezervasyon** | Villa, otel, restoran | Rezervasyon | Müsaitlik/booking | `Reservation`, `LodgingBusiness` |
| **Telefon** | Medikal, acil hizmet | Arama (click-to-call) | Sticky telefon, iletişim | `LocalBusiness` + `telephone` |
| **WhatsApp** | Yerel hizmet, butik | WhatsApp tıklama | Sticky WA butonu | `Organization` + `ContactPoint` |
| **Bayilik / Distribütör** | Üretici, marka | Başvuru formu | Bayilik sayfası | `Organization`, `Franchise` içerik |
| **Üyelik** | SaaS, topluluk | Kayıt | Fiyatlandırma, signup | `Offer`, `Service` |

## Önceliklendirme kuralı
Her öneriyi **hedef etkisine** göre etiketle ve sırala:
- 🟢 **Doğrudan** — dönüşümü direkt artırır (CTA, form, kritik sayfa hızı, ürün schema). **Önce bunlar.**
- 🟡 **Dolaylı** — trafik/görünürlük getirir, dönüşüme dolaylı katkı (blog GEO, topical authority).
- ⚪ **Nötr** — teknik hijyen (kırık link), dönüşüme etkisiz ama gerekli.

## SEO ↔ dönüşüm çatışmaları (dikkat et)
- Anahtar kelime metin duvarı CTA'yı gömüyor → katlanabilir/aşağıda tut, üstte değer önermesi + CTA.
- SEO için interstitial/popup → mobil dönüşüm + Core Web Vitals (CLS) düşürür, Google cezası.
- Aşırı internal link → kullanıcıyı dönüşüm akışından saptırır.
- Sticky CTA/WhatsApp widget → **CLS yaratmamalı** (yer rezerve et) ve **INP'yi bloklamamalı** (→ Başlık I, J).

## Çıktı
- Beyan edilen **birincil + ikincil** hedef (Faz 0 sorusundan).
- Tüm başlık önerileri 🟢/🟡/⚪ ile etiketli; rapor bu sıraya göre dizilir.
- Dönüşüm-kritik eksikler **Başlık J (CRO)** ile çapraz bağlanır.
