# Harici Denetim Araçları & Hedef Skorlar

Amaç: Kod optimizasyonundan sonra siteyi **harici araçlarla** ölçmek ve hedef skorlara ulaşana
kadar **iterasyonla** düzeltmek. Claude bu araçları doğrudan çalıştıramaz (canlı URL gerekir);
kullanıcıdan URL'yi açıp sonucu/paylaşmasını ister, sonra çıktıyı yorumlayıp düzeltmeleri üretir.

## Araçlar ve ne zaman kullanılır
| Araç | URL | Veri | En iyi kullanım | Hedef |
|------|-----|------|-----------------|-------|
| **PageSpeed Insights** | https://pagespeed.web.dev/ | Lab (Lighthouse) + Field (CrUX) | Birincil — Google'ın kendi ölçümü | Mobil **≥90**, Desktop **≥90**, CWV **Passed** |
| **Lighthouse** | DevTools / `npx lighthouse` | Lab | Geliştirme & CI | Perf 90+, SEO/A11y/BP 100 |
| **DebugBear** | https://www.debugbear.com/test/website-speed | Lab + sürekli izleme | CWV trend, filmstrip, waterfall | Tüm CWV yeşil |
| **Pingdom** | https://tools.pingdom.com/ | Lab (tek lokasyon) | Hızlı yük süresi + boyut/istek | Grade **A**, < 2s, < 1 MB |
| **GTmetrix** | https://gtmetrix.com/ | Lab (Lighthouse tabanlı) | Grade + Structure | Grade **A**, Structure ≥90 |
| **WebPageTest** | https://www.webpagetest.org/ | Lab (çok lokasyon/cihaz) | Derin waterfall, TTFB, multi-region | — |

## PageSpeed Insights — birincil hedef
- **Mobil ve Desktop ayrı** ölçülür; mobil daha zorlayıcı (4× CPU throttle) → **mobil birincil KPI**.
- İki bölüm: **Field (CrUX)** = son 28 gün gerçek kullanıcı (p75); **Lab (Lighthouse)** = simülasyon.
  Field "yeterli veri yok" diyebilir (düşük trafik) → o zaman lab'a güven, trafik arttıkça field oturur.
- **Opportunities / Diagnostics → düzeltme eşlemesi:**
  | PSI uyarısı | İlgili referans |
  |-------------|-----------------|
  | Properly size / next-gen images, defer offscreen | `framework-performance.md`, `resource-hints.md` |
  | Eliminate render-blocking resources | `resource-hints.md`, `core-web-vitals.md` |
  | Reduce unused JS/CSS, minify | `framework-performance.md` |
  | Preload LCP image / Preconnect | `resource-hints.md` |
  | Reduce main-thread work / TBT | `core-web-vitals.md` (INP) |
  | Avoid large layout shifts | `core-web-vitals.md` (CLS) |

## "Tam not" iterasyon döngüsü
```
1. Ölç (PageSpeed mobil + desktop) ve skoru kaydet.
2. En düşük/en ağır metriği bul (genelde LCP veya TBT/INP).
3. İlgili referansa git → tek bir düzeltme uygula (onayla).
4. Yeniden ölç. Skor arttı mı? Evet → kaydet, sonraki metrik. Hayır → değişikliği geri al.
5. Hedefe (90+/yeşil) ulaşana kadar tekrarla. Her turda TEK değişken değiştir (neyin işe yaradığını gör).
```
> Lab skoru 95 ama field (CrUX) 70 olabilir — bu normaldir (gerçek cihaz/ağ farkı). **Field p75'i**
> birincil başarı ölçütü al; lab'ı geliştirme aracı olarak kullan. Detay: `references/lighthouse-rubric.md`.

## SEO/yapı doğrulayıcıları (performans dışı)
- **Rich Results Test:** https://search.google.com/test/rich-results — JSON-LD rich result uygunluğu.
- **Schema Markup Validator:** https://validator.schema.org/ — schema sözdizimi.
- **Mobile-Friendly / Lighthouse SEO** — viewport, tap target, indexability.
- **Erişilebilirlik:** axe DevTools, WAVE (→ `references/semantic-structure.md`).

## Raporlama
Her araç turunda: önceki skor → yeni skor, hangi düzeltme neyi kazandırdı, kalan açık maddeler.
`templates/son-rapor.template.md` madde 10 (Lighthouse kazancı) ve `seo-gorev-listesi.md` doğrulama
bölümünü güncelle.
