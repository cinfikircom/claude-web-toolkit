---
description: "İçerik Derinliği Sihirbazı: siteyi tarar (yetim sayfa, zayıf anchor, alt'sız görsel, kopya title), bulguları ADIM ADIM onayla düzeltir; alıntılanabilir bloklar (özet+FAQ) ve gelişmiş şemalar (Product/Event/HowTo/Video) ekler. Sağlık kontrolüyle başlar."
---

# SEO İçerik Derinliği Sihirbazı (/seo-wizard)

Kullanıcı, sitesinin **içerik derinliği ve iç bağlantı kalitesini** rehberli bir sihirbazla
iyileştirmek istiyor. `seo-geo-audit` skill'inin DEĞİŞMEZ KURALLARI burada da geçerlidir
(onaysız kod değiştirme yok; her adım tek tek; framework değiştirme önerme; %5 kuralı).
Araç yolu kısaltması: `TOOLS="${CLAUDE_PLUGIN_ROOT}/tools"`.

Sihirbaz **sıralı adımlarla** ilerler. Her adımda: ne bulunduğunu göster → ne yapacağını ve
riskini açıkla → **onay al** → uygula → state/notları güncelle → sonraki adım. Kullanıcı her
adımda "atla" diyebilir; adım atlanırsa nedenini `.seo-os/seo-os-state.json` log'una yaz.

## ADIM 0 — Sağlık kontrolü (her zaman ilk)

1. `node "$TOOLS/seo-os-doctor.js"` çalıştır.
   - Sorun varsa kullanıcıya özetle ve onayla `--repair` koş (araç önce yedek alır).
   - `.seo-os/` hiç yoksa: sihirbazdan önce `/seo-audit` ile Faz 0 keşfinin gerektiğini söyle ve DUR.
2. Panel çalışmıyorsa öner: `node "$TOOLS/seo-os-dashboard.js" --serve --daemon --open`.
3. **Envanter kontrolü:** `state.intake` yoksa ya da eksikler varsa
   (`references/onboarding-intake.md`) kullanıcıya hatırlat — özellikle ADIM 4-5'in
   ihtiyaç duyduğu öncelikli sayfalar/kelimeler ve görsel varlıklar. Eksik diye DURMA;
   ilgili adımda tekrar sor.

## ADIM 1 — Site taraması

1. AskUserQuestion ile TEK soru sor: tarama hedefi ne olsun?
   - **Canlı URL** (önerilen — kullanıcıdan URL iste) · **Build çıktısı** (dist/out/public gibi
     dizini otomatik tespit et, bulamazsan sor) · **Atla**
2. Çalıştır: `node "$TOOLS/seo-os-sitecheck.js" --url=… ` veya `--dir=…`
3. `.seo-os/sitecheck-report.json`'u oku; bulguları TEK tabloda özetle:
   yetim sayfa / zayıf anchor / alt'sız görsel / kopya-eksik title / eksik description / h1≠1 sayıları.
   Hiç bulgu yoksa kutla ve ADIM 4'e geç.

## ADIM 2 — İç bağlantı onarımı (rapordan)

Sırayla, HER MADDE İÇİN AYRI ONAY:
1. **Yetim sayfalar:** her yetim için içerikçe en alakalı 1-2 kaynak sayfa öner (nav, footer
   veya gövde içi bağlam linki) ve açıklayıcı anchor metniyle ekle.
2. **Zayıf anchor'lar** ("buraya tıkla", boş linkler): hedef sayfanın konusunu anlatan
   3-6 kelimelik anchor öner; onayla değiştir. İkon linklere `aria-label` ekle.
3. **Kopya/eksik title + eksik description:** her sayfa için benzersiz title (≤60 karakter)
   ve description (140-160 karakter) üret; onayla uygula. h1≠1 sayfalarında hiyerarşiyi düzelt
   (→ `references/semantic-structure.md`).
Bittiğinde F ve H fazlarının notlarına "wizard: iç bağlantı onarımı" işle.

## ADIM 3 — Görsel alt metinleri

Rapordaki alt'sız görselleri sayfa bağlamıyla birlikte listele. Her görsel için:
- İçerik görseliyse: sayfa konusu + görselin işlevini anlatan, anahtar kelime doğal geçen
  kısa alt öner (doldurma kelime yok, "resim/görsel" deme).
- Dekoratifse: `alt=""` + gerekiyorsa `role="presentation"` öner.
Toplu diff olarak sun, tek onayla uygula (dosya sayısı >10 ise 10'arlı gruplar halinde).

## ADIM 4 — Alıntılanabilir bloklar (GEO içerik derinliği)

`references/geo-citation.md` standardıyla:
1. Kullanıcıyla en değerli 3-5 sayfayı seç (iş hedefine göre öner; AskUserQuestion).
2. Her sayfa için sırayla üret ve onayla ekle:
   - **Primary-answer bloğu:** sayfanın ana sorusuna 40-60 kelimelik net cevap (ilk ekranda).
   - **FAQ bölümü:** 3-5 gerçek soru-cevap + `FAQPage` JSON-LD.
   - **Fact-block:** sayısal/doğrulanabilir 2-4 olgu (AI motorlarının alıntılayacağı biçimde).
3. İçerik SEN üretme→dayat değil: taslağı göster, kullanıcının düzeltmesini al, sonra uygula.
Bittiğinde D fazının notuna işle; `.seo-os/keywords.txt` yoksa bu sayfaların hedef
sorgularıyla oluştur (probe için).

## ADIM 5 — Gelişmiş şema genişletme

1. Site içeriğine göre uygun şablonları belirle ve kullanıcıya sor (multiSelect):
   Product · Event · HowTo · VideoObject (şablonlar: `templates/schema-*.jsonld.template`).
2. Seçilen her tür için: ilgili sayfaları bul, şablonu GERÇEK veriyle doldur
   (`_talimat` alanlarını sil; sahte rating ASLA ekleme), `@id`'leri Organization grafına
   bağla (→ `references/schema-jsonld.md`), onayla uygula.
3. Doğrulama için kullanıcıya https://validator.schema.org ve Rich Results Test linklerini ver.
Bittiğinde E fazının notuna işle.

## KAPANIŞ

1. Yapılan/atlanan adımların özet tablosu.
2. Ölçümü geçmişe işle: `node "$TOOLS/seo-os-dashboard.js" --snapshot --note="wizard: içerik derinliği"`
   (canlı URL varsa önce `--measure --url=…` ile birleştir).
3. Panelde sonucu göster; sıradaki öneri olarak `/seo-audit dogrula` (L) veya
   `seo-os-probe.js` ile alıntılanma ölçümünü hatırlat.

> `$ARGUMENTS` verilirse doğrudan o adımdan başla: `tarama|link|alt|blok|sema`
> (ADIM 0 sağlık kontrolü yine de önce koşar).
