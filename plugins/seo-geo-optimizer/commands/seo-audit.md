---
description: "SEO + GEO + Entity + Core Web Vitals + AI Crawler denetimini başlatır. İnteraktif keşif (chat'ten soru-cevap) ile açılır, sonra başlık başlık onay alarak ilerler."
---

# SEO / GEO Optimizasyon Denetimi

Kullanıcı bu projede SEO + GEO denetimi başlatmak istiyor.

`seo-geo-audit` becerisini (skill) uygula. **Önce skill'in tamamını oku**, sonra
**Faz 0: İnteraktif Keşif**'ten başla — yani kod tabanını tarayıp framework'ü tespit et
ve aynı mesajda kullanıcıya hedef/risk sorularını (AskUserQuestion ile) sor.

KRİTİK kurallar (skill içinde detaylı):
- Onay almadan kod değiştirme.
- Her başlığı tek tek uygula, raporla, onay al, sonrakine geç.
- Framework değiştirmeyi önerme; yalnızca mevcut mimariye uygun öneri üret.
- Kazanım %5'in altındaysa dokunma.

Eğer kullanıcı `$ARGUMENTS` ile bir başlık adı verdiyse (örn. "geo", "cwv", "entity",
"crawler", "rapor"), doğrudan o başlıktan başla; yoksa Faz 0 keşiften başla.
