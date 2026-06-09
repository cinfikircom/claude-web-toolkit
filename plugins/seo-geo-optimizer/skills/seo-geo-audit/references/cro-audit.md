# Başlık J — CRO / Dönüşüm Optimizasyonu

Amaç: SEO trafik getirir; **CRO para kazandırır.** Trafiği lead/satış/aramaya çevirme. Bu başlık
**Başlık A (iş hedefi)** ile doğrudan bağlıdır — hedef neyse dönüşüm akışı ona göre denetlenir.

## Denetim alanları
| Alan | Ne bakılır | İyi / kötü |
|------|-----------|-----------|
| **CTA görünürlüğü** | Ana eylem ekranın üstünde mi, kontrast yeterli mi, net fiil mi | "Teklif Al" (net) vs "Gönder" (belirsiz); fold altı CTA = kötü |
| **Form sürtünmesi** | Alan sayısı, zorunlu alanlar, adım sayısı | 3-4 alan ideal; gereksiz zorunlu alan dönüşüm düşürür |
| **Telefon erişimi** | Mobilde `tel:` click-to-call, görünür konum | Header + sticky; düz metin telefon (tıklanamaz) = kötü |
| **WhatsApp** | `wa.me` linki, ön-dolu mesaj, sticky buton | Tek tık + hazır mesaj |
| **Mobil dönüşüm akışı** | Form/buton dokunma hedefi (≥48px), kaydırma yükü | Mobil-öncelikli; küçük tap target = kötü |
| **Teklif/satın alma süreci** | Adım sayısı, beklenmedik maliyet, güven öğeleri | Az adım + güven (referans, garanti, iade) |

## İş hedefine göre odak
- **Satış:** sepete ekleme görünürlüğü, fiyat netliği, güven rozetleri, hızlı checkout.
- **Lead/Form:** kısa form, net değer önermesi, gizlilik güvencesi.
- **Telefon/WhatsApp:** sticky tıkla-ara/WA, çalışma saatleri, hızlı yanıt vaadi.
- **Rezervasyon:** müsaitlik netliği, az adımlı booking, iptal politikası.

## Performans/SEO ile çatışmama (kritik)
- Sticky CTA / WhatsApp widget → **CLS yaratmasın** (yer rezerve et) ve **INP'yi bloklamasın**
  (ağır 3. parti chat widget'ı lazy/defer) → bkz. `references/core-web-vitals.md`, `resource-hints.md`.
- Popup/interstitial → mobilde Google cezası + CWV düşüşü; çıkış-niyeti dışında kullanma.

## Çıktı
- Dönüşüm sürtünme noktaları listesi (öncelik 🟢 doğrudan).
- Somut iyileştirmeler (CTA, form, tıkla-ara) — her biri iş hedefine etkisiyle.
- Mümkün olan kod değişiklikleri (onayla); CWV etkisi not edilir.
