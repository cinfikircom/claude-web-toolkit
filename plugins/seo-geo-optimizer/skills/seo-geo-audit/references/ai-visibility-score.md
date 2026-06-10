# AI Visibility Score (0-100) — Scoring Model v1

Amaç: Sitenin **AI arama motorlarında kaynak gösterilmeye hazırlık** seviyesini tek bir bileşik
skorla ölçmek. Son raporda öncesi/sonrası gösterilir — somut, sunulabilir bir çıktı.

> **Standardizasyon:** Bu skorun matematiği aşağıda **sabittir** (`scoringModel: "aivs/v1"`).
> Skoru üreten her rapor bu model sürümünü belirtir; model değişirse sürüm artar (aivs/v2 …)
> ve CHANGELOG'a işlenir. Böylece farklı zamanlarda/farklı oturumlarda üretilen skorlar
> karşılaştırılabilir kalır. Bant/izlenim bazlı puanlama **yasaktır** — yalnızca aşağıdaki
> kontrol kalemleri sayılır.

## 5 boyut × 5 kontrol × 4 puan = 100

Her boyutta 5 **ikili (var/yok) kontrol** vardır; her kontrol **4 puan**. Kontrol "kısmen" ise
**2 puan** (yalnızca tabloda ★ işaretli kalemlerde kısmilik mümkündür; diğerleri 0 veya 4).
"Önemli sayfalar" = Faz 0'da belirlenen dönüşüm-kritik sayfa tipleri (ana sayfa + hizmet/ürün + iletişim).

### 1. Citation Readiness (20) — `geo-citation.md`
| # | Kontrol | Puan |
|---|---------|------|
| 1.1 | Önemli sayfaların ≥%80'inde **birincil cevap bloğu** (ilk 1-2 cümlede bağlamsız cevap) | 4 ★ |
| 1.2 | Önemli sayfaların ≥%80'inde **40-60 kelimelik alıntılanabilir özet** | 4 ★ |
| 1.3 | En az bir sayfada **FAQ bölümü + `FAQPage` JSON-LD** | 4 |
| 1.4 | İçerikte **somut/sayısal veri** (fiyat aralığı, süre, sayı, tarih) — jenerik dil değil | 4 ★ |
| 1.5 | Görünür **güncellik sinyali** (`dateModified` + sayfada güncelleme tarihi) | 4 |

### 2. Entity Strength (20) — `entity-graph.md`, `knowledge-conflict.md`
| # | Kontrol | Puan |
|---|---------|------|
| 2.1 | Tüm sayfalarda **aynı `@id`** ile tek Organization | 4 |
| 2.2 | **Bütünleşik `@graph`** (WebSite→publisher, Article→author/publisher bağları) | 4 ★ |
| 2.3 | `sameAs` ≥3 **doğrulanmış** profil (canlı + aynı varlık) | 4 ★ |
| 2.4 | **Wikidata** eşlemesi var (veya uygunluk yoksa belgelenmiş) | 4 |
| 2.5 | **Knowledge conflict taraması** yapılmış, kritik çelişki kalmamış | 4 ★ |

### 3. Schema Coverage (20) — `schema-jsonld.md`
| # | Kontrol | Puan |
|---|---------|------|
| 3.1 | Sayfa tiplerinin ≥%90'ında **geçerli** JSON-LD | 4 ★ |
| 3.2 | Şemalar **validator hatasız** (validator.schema.org / Rich Results) | 4 |
| 3.3 | İşletme tipine uygun **özel şema** (LocalBusiness/Product/Service…) | 4 |
| 3.4 | `BreadcrumbList` (çok seviyeli sitelerde) | 4 |
| 3.5 | **Uydurma veri yok** (rating/review yalnızca gerçek kaynaktan) | 4 |

### 4. Content Extractability (20) — `semantic-structure.md`
| # | Kontrol | Puan |
|---|---------|------|
| 4.1 | Her sayfada **tek H1** + atlamasız hiyerarşi | 4 ★ |
| 4.2 | **Semantik landmark'lar** (header/nav/main/footer; div-soup değil) | 4 ★ |
| 4.3 | Bölümler **self-contained chunk** ("yukarıda bahsettiğimiz" yok) | 4 ★ |
| 4.4 | Liste/tablo gibi **yapısal içerik** kullanımı | 4 |
| 4.5 | Görsellerde **anlamlı alt** metin (≥%80) | 4 ★ |

### 5. AI Crawlability (20) — `ai-crawler-audit.md`, `llms-txt-generator.md`
| # | Kontrol | Puan |
|---|---------|------|
| 5.1 | `/llms.txt` mevcut ve standarda uygun | 4 |
| 5.2 | `/llms-full.txt` + `/ai-agents.json` mevcut | 4 ★ |
| 5.3 | robots.txt **AI botlarına açık** (GPTBot, ClaudeBot, PerplexityBot…) | 4 |
| 5.4 | **Edge/WAF engeli yok** (Cloudflare AI bot bloklaması kapalı; UA testi geçer) | 4 |
| 5.5 | Güncel **sitemap.xml** + önemli sayfalar indekslenebilir | 4 ★ |

## Hesaplama & sunum
1. Her kontrolü denetim bulgusuna bağla (hangi dosya/sayfa kanıt). Kanıtsız puan verme.
2. Boyut puanı = kontrollerin toplamı; toplam skor = 5 boyutun toplamı (0-100).
3. State'e yaz: `aiVisibilityScore: { before, current }` (+ rapora `scoringModel: aivs/v1`).
4. Son raporda tablo:

```
## AI VISIBILITY SCORE: {önce} → {sonra} / 100   (model: aivs/v1)
| Boyut                  | Önce | Sonra | Not |
|------------------------|------|-------|-----|
| Citation Readiness     | 8    | 18    | FAQ + özet blokları eklendi (1.3, 1.2) |
| Entity Strength        | 4    | 16    | @graph + sameAs (2.2, 2.3) |
| Schema Coverage        | 10   | 20    | 9 sayfa tipine JSON-LD |
| Content Extractability | 12   | 18    | hiyerarşi + landmark (4.1, 4.2) |
| AI Crawlability        | 6    | 20    | llms.txt + bot allow (5.1-5.4) |
| **TOPLAM**             | 40   | 92    | |
```
Notlarda hangi kontrol kalemlerinin (#) durum değiştirdiğini belirt — skor denetlenebilir olsun.

> Skor **tahminî bir hazırlık göstergesidir**, garantili sıralama değil. Optimizasyon sonrası
> yeniden ölç; kazanımı `templates/son-rapor.template.md` içinde raporla. Release Readiness
> eşikleri için → `references/release-gate.md`.
