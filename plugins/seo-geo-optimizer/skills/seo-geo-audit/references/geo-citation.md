# AI Citation Optimization (GEO)

Amaç: İçeriğin **ChatGPT Search, Perplexity, Gemini, Claude, AI Overviews** tarafından
doğrudan **alıntılanabilir** (citation/attribution) olması. LLM'ler sayfayı bütün olarak değil,
**chunk** (kendi başına anlamlı bölüm) olarak tüketir — bu doküman chunk'ların alıntılanma
şansını maksimize eden yapıyı tanımlar.

## Her önemli sayfa için yapı taşları
Sayfada şunların var olup olmadığını değerlendir; eksikse oluştur:

1. **Birincil cevap bloğu** — Sayfanın ana sorusuna ilk 1-2 cümlede net, bağlamsız cevap.
   (LLM'ler genelde ilk paragrafı alıntılar.)
2. **Alıntılanabilir özet** — Tek başına anlamlı, 40-60 kelimelik, sayfanın özünü veren paragraf.
3. **Entity tanımı** — Sayfanın konusu olan varlığın (firma/kategori/yer/ürün) açık, sözlük-tarzı tanımı.
4. **FAQ bölümü** — Gerçek kullanıcı sorularına kısa, doğrudan cevaplar + `FAQPage` JSON-LD.
5. **Kaynak gösterilebilir paragraf** — Özgün; sayısal/somut veri (tarih, fiyat aralığı, sayı, adres) içeren,
   atıf yapılmaya değer metin. Jenerik pazarlama dili LLM'lerce alıntılanmaz.

## Önce / sonra örnekleri

### 1. Birincil cevap bloğu
```html
<!-- ❌ ÖNCE — bağlam gerektiren, cevapsız giriş -->
<h1>Hizmetlerimiz</h1>
<p>Yılların deneyimiyle, müşteri memnuniyetini ön planda tutarak
   sektörde fark yaratıyoruz...</p>

<!-- ✅ SONRA — ilk cümle soruyu bağlamsız cevaplar -->
<h1>Ankara'da Endüstriyel Mutfak Kurulumu</h1>
<p>Endüstriyel mutfak kurulumu Ankara'da ortalama 5-15 iş günü sürer ve
   proje bedeli mutfak büyüklüğüne göre 250.000-1.500.000 TL aralığındadır.
   {Firma}, 2008'den beri 400'den fazla restoran ve otel mutfağı kurmuştur.</p>
```

### 2. Entity tanımı (sözlük-tarzı)
```html
<!-- ❌ ÖNCE -->
<p>Biz işimizi tutkuyla yapan bir aileyiz.</p>

<!-- ✅ SONRA — "X nedir/kimdir" sorusuna kopyalanabilir cevap -->
<p><strong>{Firma}</strong>, Ankara merkezli, restoran ve otellere
   endüstriyel mutfak projelendirme, ekipman satışı ve servis hizmeti
   veren bir mühendislik firmasıdır (kuruluş: 2008).</p>
```

### 3. Soru-formatlı başlık + doğrudan cevap (FAQ chunk)
```html
<h2>Endüstriyel bulaşık makinesi kaç yıl kullanılır?</h2>
<p>Düzenli bakımla 8-12 yıl. Garanti süresi markaya göre 2-5 yıldır.</p>
```
Cevap başlığın hemen altında, ilk cümlede gelir; "aşağıda detaylandıracağız" gibi erteleme yok.
Bu blok `FAQPage` JSON-LD ile de işaretlenir (→ `schema-jsonld.md`).

## İçerik mimarisi ilkeleri (chunking)
- Net başlık hiyerarşisi (H1 → H2 → H3); her bölüm tek bir konuyu kapsasın (self-contained chunk).
- **Chunk bağımsızlığı testi:** Bir H2 bölümünü tek başına kopyalasan anlamlı mı? "Yukarıda
  bahsettiğimiz gibi", "bu yöntem" gibi sayfa-içi gönderme varsa chunk LLM için kullanışsızdır —
  göndermeyi açık isimle değiştir.
- Soru-formatlı başlıklar ("X nedir?", "Eryaman'da en iyi Y nerede?") — LLM eşleştirmesi yüksek.
- Listeler, tablolar, tanımlar — yapısal, parse edilebilir içerik. Karşılaştırmaları tabloya dök
  (LLM'ler tabloları yüksek doğrulukla alıntılar).
- Tarih damgası / güncellik sinyali (`dateModified` + görünür "Güncelleme: {tarih}") — tazelik
  alıntı şansını artırır.
- Mutlak, kararlı URL'ler ve sayfa başına tek kanonik adres.
- **Sayısal yoğunluk:** somut sayı/tarih/aralık içeren paragraflar, sıfat yoğun paragraflardan
  belirgin şekilde daha çok alıntılanır. "Uygun fiyat" → "250.000 TL'den başlayan".

## Motor farkları (özet)
| Motor | Alıntı davranışı | Pratik sonuç |
|-------|------------------|--------------|
| **Perplexity** | Her cümleye kaynak bağlar; taze içerik önceliği | `dateModified` + somut veri kritik |
| **ChatGPT Search** | Az sayıda kaynağa link verir; özet odaklı | 40-60 kelimelik özet bloğu kritik |
| **AI Overviews** | Google indeksi + yapısal veri | Schema/FAQ + klasik SEO sağlığı kritik |
| **Gemini/Claude** | Entity netliği ve otorite sinyali | Entity tanımı + tutarlı `@graph` kritik |

## Değerlendirme çıktısı
Her sayfa tipi için: hangi yapı taşı var/yok, hangi başlık altında düzeltilecek, beklenen GEO etkisi.
Bulguları tabloyla raporla: `sayfa · eksik yapı taşı · önerilen blok · risk (genelde Low) · etki 🟢/🟡`.
