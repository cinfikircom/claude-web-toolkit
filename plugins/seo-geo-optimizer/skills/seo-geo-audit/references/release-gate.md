# Release Readiness Gate (`/seo-audit gate`)

Amaç: Yayın/merge öncesi **tek komutla PASS/FAIL** kararı — özellikle ajans akışında "bu site
canlıya çıkmaya hazır mı?" sorusuna deterministik cevap. Gate **ANALYZE modunda** çalışır:
hiçbir şey değiştirmez, yalnızca ölçer ve raporlar.

## Çalışma şekli
1. `.seo-os/seo-os-state.json`'u oku (yoksa: gate çalıştırılamaz — önce Faz 0 gerekir; bunu raporla).
2. Aşağıdaki **hard check'leri** ve **skor eşiklerini** değerlendir. Her kalemi kanıtla
   (dosya var/yok, ölçüm değeri) — varsayım yok; ölçülemeyen kalem `UNKNOWN` sayılır ve FAIL üretmez
   ama raporda listelenir.
3. Sabit formatta bloğu render et; sonucu state `log`'una yaz (`gate: PASS|FAIL @ tarih`).

## Hard checks (biri bile ❌ ise FAIL)
| # | Kontrol | Kaynak |
|---|---------|--------|
| H1 | `robots.txt` mevcut + önemli sayfalar engelli değil | dosya + `ai-crawler-audit.md` |
| H2 | `sitemap.xml` mevcut + 200 dönen canonical URL'ler | dosya / build çıktısı |
| H3 | Her indekslenebilir sayfada **canonical** | Başlık F/H bulgusu |
| H4 | `/llms.txt` mevcut | Başlık D çıktısı |
| H5 | Tek H1 + title/description tüm önemli sayfalarda | Başlık F bulgusu |
| H6 | Schema validator **hatasız** (uyarı ≠ hata) | Başlık E doğrulaması |
| H7 | Kritik entity conflict yok (❌ seviye) | `knowledge-conflict.md` raporu |
| H8 | AI botları edge'de engellenmiyor | `cloudflare-edge.md` / UA testi |

## Skor eşikleri (varsayılan; kullanıcı Faz 0-B'de özelleştirebilir)
| Skor | Kaynak | Eşik |
|------|--------|------|
| **SEO Score** | Lighthouse SEO (mobil) | ≥ 90 |
| **GEO Score** | AI Visibility Score (`aivs/v1`) | ≥ 70 |
| **CWV Score** | Lighthouse Performance (mobil) + LCP<2.5s · INP<200ms · CLS<0.1 | ≥ 85 + üçü de yeşil |
| **Schema Score** | AI Visibility "Schema Coverage" boyutu ×5 | ≥ 80 |

Lighthouse/CWV değerleri kullanıcının paylaştığı **gerçek ölçümden** gelir (→ `audit-tools.md`);
ölçüm paylaşılmadıysa o satır `UNKNOWN` olur ve raporda "ölçüm gerekli" diye işaretlenir.

## Sabit çıktı formatı
```
=== RELEASE READINESS ===
SEO Score:    94  (≥90)  ✓
GEO Score:    88  (≥70)  ✓
CWV Score:    92  (≥85)  ✓   LCP 1.9s · INP 140ms · CLS 0.04
Schema Score: 97  (≥80)  ✓

Hard checks: 8/8 ✓

RESULT: PASS
=========================
```
FAIL örneği:
```
=== RELEASE READINESS ===
SEO Score:    91  (≥90)  ✓
GEO Score:    54  (≥70)  ✗
CWV Score:    UNKNOWN — PageSpeed ölçümü paylaşılmadı
Schema Score: 80  (≥80)  ✓

Hard checks: 6/8
  ✗ H4 — /llms.txt yok
  ✗ H3 — /hizmetler/* sayfalarında canonical eksik

RESULT: FAIL
Reason:
- Missing llms.txt (Başlık D → llms-txt-generator.md)
- Missing canonical on 4 pages (Başlık F)
- GEO Score 54 < 70 (en hızlı kazanç: 1.2 özet blokları + 5.2 ai-agents.json)
=========================
```
Her FAIL nedeni **hangi başlık + hangi referansla** çözüleceğini söyler — gate aynı zamanda
yol haritasıdır. PASS/FAIL sonrası öneri: FAIL ise ilgili başlıkları sırala; PASS ise Başlık L
döngüsüyle (gerçek skor doğrulama) sürdür.
