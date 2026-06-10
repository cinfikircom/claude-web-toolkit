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

## Önce / sonra örnekleri

### 1. Tıklanabilir telefon + WhatsApp (en sık eksik, en ucuz kazanç)
```html
<!-- ❌ ÖNCE — düz metin, mobilde tıklanamaz -->
<p>Bize ulaşın: 0312 555 44 33</p>

<!-- ✅ SONRA — tek tık arama + ön-dolu WhatsApp -->
<a href="tel:+903125554433">0312 555 44 33</a>
<a href="https://wa.me/903125554433?text=Merhaba%2C%20teklif%20almak%20istiyorum"
   aria-label="WhatsApp ile yaz">WhatsApp'tan yaz</a>
```

### 2. CTA netliği
```html
<!-- ❌ ÖNCE — belirsiz fiil, fold altında -->
<button>Gönder</button>

<!-- ✅ SONRA — net değer + eylem, ekranın üstünde tekrar -->
<button>Ücretsiz Keşif Randevusu Al</button>
```

### 3. CLS yaratmayan sticky CTA
```css
/* ❌ ÖNCE — geç yüklenen sticky bar içeriği iter (CLS) */
/* ✅ SONRA — yer baştan rezerve edilir, bar transform ile girer */
.sticky-cta { position: fixed; bottom: 0; transform: translateY(100%);
              transition: transform .2s; }
.sticky-cta.visible { transform: translateY(0); }
body { padding-bottom: var(--sticky-cta-height, 64px); } /* alan rezerve */
```

### 4. Form sürtünmesi
- ❌ 9 alanlı tek form, hepsi zorunlu, hata mesajı submit sonrası.
- ✅ 3-4 alan (ad, telefon, ihtiyaç), yalnızca telefon zorunlu, inline doğrulama,
  `autocomplete`/`inputmode` öznitelikleri (mobil klavye doğru açılır).

## Ölçüm — tahmin değil veri
- GA4 kuruluysa (Başlık K): dönüşüm event'lerini (form_submit, tel_click, wa_click) tanımlat;
  öneri etkisini bu event'lerle doğrula. Kurulu değilse önce K'yi öne çekmeyi öner.
- `tel:`/`wa.me` tıklamaları için GTM/GA4 event örneği ver; "tahmini iyileşme" yerine
  **önce → sonra event sayısı** raporla.

## Performans/SEO ile çatışmama (kritik)
- Sticky CTA / WhatsApp widget → **CLS yaratmasın** (yer rezerve et) ve **INP'yi bloklamasın**
  (ağır 3. parti chat widget'ı lazy/defer) → bkz. `references/core-web-vitals.md`, `resource-hints.md`.
- Popup/interstitial → mobilde Google cezası + CWV düşüşü; çıkış-niyeti dışında kullanma.

## Çıktı
- Dönüşüm sürtünme noktaları listesi (öncelik 🟢 doğrudan).
- Somut iyileştirmeler (CTA, form, tıkla-ara) — her biri iş hedefine etkisiyle.
- Mümkün olan kod değişiklikleri (onayla); CWV etkisi not edilir.
