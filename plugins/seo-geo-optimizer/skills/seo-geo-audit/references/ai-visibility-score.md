# AI Visibility Score (0-100)

Amaç: Sitenin **AI arama motorlarında kaynak gösterilmeye hazırlık** seviyesini tek bir bileşik
skorla ölçmek. Son raporda öncesi/sonrası gösterilir — somut, sunulabilir bir çıktı.

## 5 alt boyut (her biri 0-20) = toplam 100
| Boyut | Ne ölçer | İlgili başlık/referans |
|-------|----------|------------------------|
| **Citation Readiness** | Alıntılanabilir yapı: birincil cevap bloğu, 40-60 kelime özet, FAQ, somut veri | D + `geo-citation.md` |
| **Entity Strength** | Entity grafı bütünlüğü, `@id` bağları, `sameAs`, Wikidata eşlemesi | E + `entity-graph.md` |
| **Schema Coverage** | Sayfa tiplerinin geçerli JSON-LD kapsama oranı | E + `schema-jsonld.md` |
| **Content Extractability** | Semantik HTML, başlık hiyerarşisi, temiz chunking | F/H + `semantic-structure.md` |
| **AI Crawlability** | `llms.txt`/`ai-agents.json`, AI bot erişimi, sitemap | D/H + `ai-crawler-audit.md`, `llms-txt-generator.md` |

## Skorlama bantları (her boyut için)
| Puan | Anlam | Kriter |
|------|-------|--------|
| **17-20** 🟢 | Güçlü | Tam uygulanmış, doğrulanmış |
| **11-16** 🟡 | Orta | Kısmi; önemli boşluklar var |
| **5-10** 🟠 | Zayıf | Temel eksik |
| **0-4** 🔴 | Yok | Hiç yok |

### Boyut bazlı somut kriterler (özet)
- **Citation Readiness:** her önemli sayfada birincil cevap + özet + FAQ varsa 17-20; sadece bazılarında 11-16; jenerik pazarlama dili 0-10.
- **Entity Strength:** bütünleşik `@graph` + `sameAs` + Wikidata 17-20; izole schema 11-16; entity yok 0-10.
- **Schema Coverage:** sayfa tiplerinin %90+'ı geçerli schema 17-20; %50-90 → 11-16; <%50 → 0-10.
- **Content Extractability:** tek H1 + sıralı başlık + semantik landmark + temiz içerik 17-20; düzensiz 11-16; div-soup 0-10.
- **AI Crawlability:** llms.txt + ai-agents.json + bot erişimi açık + sitemap 17-20; kısmi 11-16; bot engelli/dosya yok 0-10.

## Hesaplama & sunum
1. Her boyutu denetim bulgularına göre 0-20 puanla (gerekçeyle).
2. Topla (0-100).
3. Son raporda tablo olarak göster:

```
## AI VISIBILITY SCORE: {önce} → {sonra} / 100
| Boyut                  | Önce | Sonra | Not |
|------------------------|------|-------|-----|
| Citation Readiness     | 8    | 18    | FAQ + özet blokları eklendi |
| Entity Strength        | 5    | 17    | @graph + sameAs + Wikidata |
| Schema Coverage        | 10   | 19    | 9 sayfa tipine JSON-LD |
| Content Extractability | 12   | 18    | başlık hiyerarşisi + semantik HTML |
| AI Crawlability        | 6    | 20    | llms.txt + ai-agents.json + bot allow |
| **TOPLAM**             | 41   | 92    | |
```

> Skor **tahminî bir hazırlık göstergesidir**, garantili sıralama değil. Optimizasyon sonrası
> yeniden ölç; kazanımı `templates/son-rapor.template.md` içinde raporla.
