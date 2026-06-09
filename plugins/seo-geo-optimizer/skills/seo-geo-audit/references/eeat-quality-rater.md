# E-E-A-T & Google Search Quality Rater Guidelines

Kaynak: https://static.googleusercontent.com/media/guidelines.raterhub.com/en//searchqualityevaluatorguidelines.pdf (~170 sf)

Amaç: Siteyi Google'ın insan değerlendiricilerine verdiği kalite kriterlerine göre denetlemek.
Bu kriterler hem klasik sıralamayı hem de AI motorlarının "güvenilir kaynak" seçimini doğrudan etkiler.

## E-E-A-T nedir
| Harf | Kavram | Site karşılığı |
|------|--------|----------------|
| **Experience** | Deneyim | İçeriği üreten kişinin/markanın konuyla birinci elden deneyimi (gerçek fotoğraf, ilk-elden gözlem, "biz ziyaret ettik/test ettik") |
| **Expertise** | Uzmanlık | Yazar/marka yetkinliği; yazar biyografisi, kimlik bilgileri, unvan |
| **Authoritativeness** | Otorite | Markanın o konuda tanınırlığı; dış atıflar, `sameAs`, bahsedilmeler, backlink |
| **Trust** | Güven (merkez kriter) | İletişim bilgisi, adres, gizlilik/iade politikası, HTTPS, doğru ve güncel bilgi |

> Trust merkezdedir: güven düşükse E-E-A-T'nin geri kalanı önemini kaybeder.

## YMYL (Your Money or Your Life)
Sağlık, finans, hukuk, güvenlik, "büyük karar" sayfaları daha sıkı değerlendirilir.
(Eryaman örneğinde: nöbetçi eczane, sağlık/finans firmaları YMYL sayılır → kaynak gösterimi, güncellik, doğruluk kritik.)

## Sayfa kalitesi denetim listesi
Her önemli sayfa tipi için kontrol et ve eksikleri raporla:

**Trust sinyalleri**
- [ ] Görünür iletişim bilgisi (telefon, adres, e-posta) ve `ContactPage`
- [ ] Hakkında / kurumsal kimlik sayfası (`AboutPage`, `Organization` schema)
- [ ] HTTPS, geçerli sertifika
- [ ] Gizlilik politikası, KVKK/şartlar (varsa)
- [ ] Güncel bilgi + `dateModified` (bayat içerik güven düşürür)

**Experience / Expertise sinyalleri**
- [ ] Yazar/kaynak kimliği (haber/blog için `author` + yazar sayfası)
- [ ] Özgün, ilk-elden içerik (jenerik kopya değil)
- [ ] Gerçek görseller (stok değil, alt-text'li)

**Authoritativeness sinyalleri**
- [ ] `sameAs` ile doğrulanabilir profiller (Google Business, sosyal medya, Wikidata)
- [ ] Dış atıf/kaynak gösterimi
- [ ] Tutarlı NAP (Name-Address-Phone) tüm sayfalarda ve schema'da aynı

**"Main Content" kalitesi**
- [ ] Sayfa amacı net; ana içerik baskın (reklam/boilerplate değil)
- [ ] Aldatıcı başlık/clickbait yok
- [ ] Otomatik üretilmiş düşük değerli içerik yok

## Puanlama rubriği (zayıf / orta / güçlü)

Yukarıdaki denetim listesi 4 kümeye ayrılır: **Trust (5), Experience/Expertise (3),
Authoritativeness (3), Main Content (3)** = toplam 14 madde. Eşikler:

| Seviye | Kriter |
|--------|--------|
| **Güçlü** 🟢 | 14 maddenin ≥ 11'i (%80+) sağlanıyor **VE** 5 Trust maddesinin ≥ 4'ü var |
| **Orta** 🟡 | 14 maddenin 7–10'u sağlanıyor **VE** en az 3 Trust maddesi var |
| **Zayıf** 🔴 | < 7 madde sağlanıyor **VEYA** Trust maddelerinden 2'den azı var |

> **Trust kapısı:** Trust merkez kriter olduğu için ayrı bir alt-eşik tutar — diğer
> kümeler tam olsa bile Trust < 3 ise sayfa en fazla "Zayıf" sayılır.
> **YMYL sayfalarında** bir kademe yukarı çek: "Güçlü" için ≥ 13/14 ve 5/5 Trust ara.

## Çıktı
Her sayfa tipi için E-E-A-T puanı (zayıf/orta/güçlü — yukarıdaki rubrikle) + sağlanan/eksik
madde sayısı + eksik Trust sinyalleri + somut düzeltme (hangi schema/sayfa/alan).
Düzeltmeler genelde **Başlık B (marka temeli)** ve **Başlık C (schema)** altında uygulanır.
