# Lighthouse Rubric & Puanlama Rehberi

Amaç: Lighthouse/PageSpeed Insights raporunu doğru yorumlamak, hangi metriğin ne kadar
ağırlığı olduğunu bilmek ve hedefe ulaşmak için gereken iyileştirmeleri önceliklendirmek.

## Lighthouse 12 (2026) kategori ağırlıkları

### Performance skoru (toplam 100)
| Metrik | Ağırlık | Hedef (yeşil) | Uyarı (turuncu) | Kötü (kırmızı) |
|--------|---------|---------------|-----------------|----------------|
| **LCP** | %25 | < 2.5s | 2.5–4.0s | > 4.0s |
| **INP** | %25 | < 200ms | 200–500ms | > 500ms |
| **CLS** | %15 | < 0.1 | 0.1–0.25 | > 0.25 |
| **TTFB** | %10 | < 800ms | 800–1800ms | > 1800ms |
| **FCP** | %10 | < 1.8s | 1.8–3.0s | > 3.0s |
| **Speed Index** | %10 | < 3.4s | 3.4–5.8s | > 5.8s |
| **TBT** (Total Blocking Time) | %5 | < 200ms | 200–600ms | > 600ms |

> Ağırlıklar: LCP+INP = %50. Bu ikisi yeşilse skor genelde 80+ olur.

### SEO skoru (toplam 100)
| Denetim | Ağırlık | Not |
|---------|---------|-----|
| `robots.txt` geçerli | %10 | 4xx/5xx = kırmızı |
| `viewport` var + `user-scalable=no` YOK | %8 | zoom engellemek WCAG ihlali |
| `<title>` var + benzersiz | %10 | Her sayfada farklı |
| `<meta name="description">` var | %10 | Her sayfada farklı |
| Başlık sıralaması (H1→H2→H3) | %7 | Atlama yapma |
| Bağlantılar taranabilir (crawlable) | %5 | `<a href>` ile |
| `rel=canonical` var + geçerli | %8 | Mutlak URL |
| `hreflang` (çok dilli ise) | %5 | Dil başına |
| Mobil uyumluluk (mobile-friendly) | %12 | viewport + tap target + font size |
| Yapılandırılmış veri geçerli | %7 | JSON-LD, schema.org |
| Sayfa indekslenebilir (noindex kontrolü) | %10 | robots meta / x-robots-tag |
| HTTP durum kodu 200 | %8 | |

### Accessibility skoru (toplam 100)
| Denetim | Ağırlık | Kritik? |
|---------|---------|---------|
| `[role]` + `aria-*` atributları geçerli | %10 | ✅ |
| Buton/link/input'ların erişilebilir adı var | %15 | ✅ |
| Renk kontrastı (AA, 4.5:1) | %12 | ✅ |
| `html` lang atributu | %5 | |
| Resimlerde `alt` metni | %10 | ✅ |
| Form elemanlarında label | %8 | ✅ |
| Başlık sıralaması (doğru yapı) | %7 | |
| Klavye erişimi (focus order, focus trap yok) | %10 | ✅ |
| `tabindex` > 0 yok | %5 | |
| Dokunma hedefleri yeterli büyüklükte (48×48px) | %8 | |
| Zoom engelleme yok (`user-scalable=no`) | %5 | |
| Video/audio'da altyazı/transkript | %5 | |

### Best Practices skoru (toplam 100)
| Denetim | Ağırlık |
|---------|---------|
| HTTPS kullanımı (mixed content yok) | %15 |
| Güvenli JS kütüphaneleri (CVE yok) | %10 |
| `console.log` / `debugger` canlıda yok | %3 |
| Doğru resim en-boy oranı | %5 |
| Hatalı kaynak kodlaması yok | %3 |
| `DOCTYPE html` var | %3 |
| `charset` tanımlı | %3 |
| XSS / CSP (Content-Security-Policy) | %10 |
| Pasif event listener | %3 |
| Tarayıcı hata konsolu boş | %7 |
| Eski JS API kullanılmıyor (deprecated) | %5 |
| HTTP/2 veya üstü | %8 |
| Cookie `SameSite` + `Secure` | %7 |
| Geçerli kaynak haritası (source map) | %5 |

## Mobile vs Desktop — ayrı değerlendir

Lighthouse iki ayrı profil çalıştırır; aynı site **çok farklı** skor üretir. Mobil ana hedeftir
(Google mobile-first indexing). Ayrı raporla:

| Profil | Throttling | CPU | Tipik hedef |
|--------|-----------|-----|-------------|
| **Mobile** | Slow 4G (~1.6 Mbps, 150ms RTT) | 4× yavaşlatma | Performance **≥ 70–80** gerçekçi, 90 ideal |
| **Desktop** | Hızlı bağlantı | Yavaşlatma yok | Performance **≥ 90** beklenir |

- Mobilde CPU 4× throttle olduğu için **TBT/INP** desktop'tan çok daha yüksek çıkar → JS bütçesi mobilde kritik.
- LCP mobilde ağ throttling nedeniyle daha kötü → görsel/font optimizasyonu mobilde daha çok kazandırır.
- **Raporda her iki skoru ayrı yaz.** "Lighthouse 90" demek anlamsız; "Mobile 74 / Desktop 96" de.
- Gerçek kullanıcı kitlesi mobil ağırlıklıysa (TR'de tipik) **mobil skoru birincil KPI** al.

## Lighthouse vs PageSpeed Insights vs CrUX

| Araç | Veri kaynağı | Kullanım |
|------|-------------|----------|
| **Lighthouse (DevTools)** | Lab — simülasyon, throttled | Geliştirme, CI, canlı öncesi |
| **PageSpeed Insights (PSI)** | CrUX (son 28 gün gerçek kullanıcı) + Lighthouse | Canlı site gerçek performansı |
| **CrUX Dashboard** | CrUX (gerçek Chrome kullanıcıları) | Uzun vadeli trend, p75 değer |

**Önemli:** Lighthouse 90+ ama CrUX 60 olabilir. Nedeni: simülasyon vs gerçek cihaz farkı.
Kullanıcı kitlesinin cihaz profiline göre yorumla (mobil ağırlıklı site, düşük-orta segment telefon).

## Puan → eylem önceliklendirme matrisi

| Skor aralığı | Durum | Aksiyon |
|-------------|-------|---------|
| 90–100 | Yeşil | İzlemeye al, fırsatçı mikro-iyileştirmeler |
| 50–89 | Turuncu | Hedef: 90+. En ağır metrikleri hedefle (LCP, INP) |
| 0–49 | Kırmızı | Kritik. LCP → TTFB → CLS sırasıyla müdahale et |

## Her problem için standart raporlama formatı

```
### Problem: {Sorun tipi}
- **Kaynak dosya:** {dosya yolu + satır}
- **Etkilenen metrik:** {LCP / INP / CLS / TTFB}
- **Tahmini etki:** {düşük / orta / yüksek — mümkünse ms/saniye cinsinden}
- **Çözüm:** {somut kod değişikliği}
- **Risk:** {Low / Medium / High}
```

## Tipik iyileştirme sırası (en yüksek getiri → düşük)

1. Görsel optimizasyonu (LCP) — en hızlı kazanç
2. Render stratejisi (TTFB/LCP) — mimari karar, dikkatli
3. Bundle bölme / code splitting (INP/TBT)
4. Font optimizasyonu (CLS/LCP)
5. 3. parti JS erteleme (INP/TBT)
6. Kritik CSS inline (FCP/LCP)
7. CDN / cache header'ları (TTFB)
8. DOM boyutu küçültme (INP/TBT)
9. Resource hints (LCP) — en son, çünkü yanlış yapılırsa zarar

> Kaynaklar:
> https://developer.chrome.com/docs/lighthouse
> https://web.dev/vitals/
> https://developer.chrome.com/docs/crux/
