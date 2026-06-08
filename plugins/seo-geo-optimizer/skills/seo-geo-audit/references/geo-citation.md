# AI Citation Optimization (GEO)

Amaç: İçeriğin **ChatGPT Search, Perplexity, Gemini, Claude, AI Overviews** tarafından
doğrudan **alıntılanabilir** (citation/attribution) olması.

## Her önemli sayfa için yapı taşları
Sayfada şunların var olup olmadığını değerlendir; eksikse oluştur:

1. **Birincil cevap bloğu** — Sayfanın ana sorusuna ilk 1-2 cümlede net, bağlamsız cevap.
   (LLM'ler genelde ilk paragrafı alıntılar.)
2. **Alıntılanabilir özet** — Tek başına anlamlı, 40-60 kelimelik, sayfanın özünü veren paragraf.
3. **Entity tanımı** — Sayfanın konusu olan varlığın (firma/kategori/yer/ürün) açık, sözlük-tarzı tanımı.
4. **FAQ bölümü** — Gerçek kullanıcı sorularına kısa, doğrudan cevaplar + `FAQPage` JSON-LD.
5. **Kaynak gösterilebilir paragraf** — Özgün; sayısal/somut veri (tarih, fiyat aralığı, sayı, adres) içeren,
   atıf yapılmaya değer metin. Jenerik pazarlama dili LLM'lerce alıntılanmaz.

## İçerik mimarisi ilkeleri (chunking)
- Net başlık hiyerarşisi (H1 → H2 → H3); her bölüm tek bir konuyu kapsasın (self-contained chunk).
- Soru-formatlı başlıklar ("X nedir?", "Eryaman'da en iyi Y nerede?") — LLM eşleştirmesi yüksek.
- Listeler, tablolar, tanımlar — yapısal, parse edilebilir içerik.
- Tarih damgası / güncellik sinyali (`dateModified`) — tazelik alıntı şansını artırır.
- Mutlak, kararlı URL'ler ve sayfa başına tek kanonik adres.

## Değerlendirme çıktısı
Her sayfa tipi için: hangi yapı taşı var/yok, hangi başlık altında düzeltilecek, beklenen GEO etkisi.
