# Off-site Otorite — Dış Dünyada Kimlik & Güven (Başlık K'nin genişletmesi)

Site içi her şey mükemmel olsa bile AI motorları ve Google, markayı **dış dünyadaki
kimliğinden ve otoritesinden** tanır. Bu doküman K başlığında (Off-site Kurulum)
GSC/Bing/GA4/GBP'nin ÜSTÜNE eklenen otorite katmanını yönetir. Tüm adımlar
**kullanıcı aksiyonudur**: net talimat + tam URL ver, "tamamlandı" onayı bekle,
durumu `[!]` (dış bekleyen) olarak işle.

## 1) Varlık kimliğini mühürle (en yüksek GEO etkisi)

Amaç: sitedeki `Organization.sameAs[]` dizisindeki her URL **gerçek, dolu ve tutarlı** olsun.

**Wikidata item'ı (Gemini/Knowledge Graph için en değerli tek adım):**
1. https://www.wikidata.org/wiki/Special:CreateAccount → hesap aç.
2. Kayda değerlik: işletmenin en az 1-2 bağımsız kaynakta (haber, resmi sicil, dernek/oda
   kaydı) geçmesi gerekir; yoksa önce o kaynakları oluştur (basın bülteni, oda kaydı).
3. https://www.wikidata.org/wiki/Special:NewItem → item aç: Label (marka adı, TR+EN),
   Description (kısa tanım), sonra özellikler:
   - `P31 (instance of)`: business / company / organization
   - `P856 (official website)`: site URL'i
   - `P17 (country)`, `P159 (headquarters location)`, varsa `P452 (industry)`
4. Item URL'sini (`https://www.wikidata.org/wiki/Q…`) `sameAs`'e ekle.
5. Onay bekleme süresi olabilir; item silinirse notability kaynaklarını güçlendir.

**Diğer kimlik profilleri (hepsi sameAs'e):** LinkedIn şirket sayfası · Crunchbase ·
GitHub org (yazılımsa) · Instagram/X/Facebook/YouTube resmi hesapları · sektör birlikleri.
Kural: profil açtıysan DOLDUR (logo, açıklama, site linki, NAP) — boş profil güven düşürür.

**Çapraz doğrulama:** her profildeki ad/adres/telefon/URL sitedekiyle birebir aynı mı?
(→ `references/knowledge-conflict.md` çapraz matrisi). Değişiklik sonrası
`seo-os-probe.js` ile marka sorgusunda alıntılanma kontrol et.

## 2) LLM'lerin beslendiği mecralarda varlık

Perplexity/ChatGPT Search alıntılarında Reddit, Quora, StackExchange ve YouTube ağırlığı
belirgindir; Gemini video kaynaklarını sever.

- **Reddit/Quora/StackExchange:** hedef sorguların geçtiği tartışmaları bul; SPAM DEĞİL,
  gerçekten sorunu çözen cevaplar yaz; uygun yerde (kural izin veriyorsa) kaynak olarak
  siteye bağlantı ver. Oran: 10 katkıdan en fazla 1'i linkli olsun.
- **YouTube:** hedef konularda kısa anlatım videoları; açıklamaya site linki;
  videoyu ilgili sayfaya göm + `schema-video.jsonld.template` ile işaretle.
- Yasak: toplu hesaplarla oy/yorum manipülasyonu — platform banı ve marka riski.

## 3) Citation'lar & NAP tutarlılığı (yerel işletme)

Başlık G ile koordineli: Google Business Profile + Bing Places + Apple Business Connect +
yerel/sektörel dizinler (şehir rehberleri, oda/birlik listeleri). Hepsinde **aynı NAP**
(Name/Address/Phone) — kısaltma farkları bile ("Cad." vs "Caddesi") tutarlı olsun.

## 4) Yorum sinyalleri

"En iyi X" tipi AI cevaplarında ve yerel pakette yorum hacmi+puanı doğrudan etkilidir.
- Google Reviews'u aktif iste (satış sonrası e-posta/QR); **her yoruma yanıt ver**
  (olumsuza profesyonel, çözüm odaklı).
- Sektör platformu varsa (Trustpilot, Tripadvisor, sektörel eşdeğeri) orada da varlık kur.
- Sahte yorum ASLA — tespit edilirse kalıcı hasar.

## 5) Dijital PR & bağlantılar

Kalite > adet. Öncelik sırası: (1) sektör yayınlarında uzman görüşü/misafir yazı,
(2) veri/araştırma yayınlayıp haberleştirme, (3) yerel basın, (4) tedarikçi/partner
sayfalarında listelenme. Alaka düşük toplu link paketlerinden uzak dur.

## 6) Marka sorgusu büyütme

Marka aramaları (navigational query hacmi) hem Google güvenini hem AI Overviews'ta
marka tanınırlığını besler: bülten, sosyal içerik takvimi, etkinlik/webinar,
offline malzemede site vurgusu.

## 7) IndexNow — indekslemeyi hızlandır

Bing + ortak ekosistem için (Google hariç):
```bash
node "${CLAUDE_PLUGIN_ROOT}/tools/seo-os-indexnow.js" --setup --site=https://siten.com
# deploy sonrası {key}.txt canlıda 200 dönünce:
node "${CLAUDE_PLUGIN_ROOT}/tools/seo-os-indexnow.js" --sitemap=https://siten.com/sitemap.xml
```
Deploy hattına ekle: her yayında değişen URL'leri bildir (CI adımı veya deploy hook).

## Ölçüm döngüsü

Dış çalışma yavaş etki eder — sabırlı ölç:
- Haftalık: `seo-os-probe.js` (alıntılanma) + `seo-os-gsc.js` (tıklama/pozisyon) → `--snapshot`.
- Aylık: marka sorgusu hacmi (GSC "marka" filtresi), yorum sayısı/puanı, sameAs profillerinin
  dolululuk kontrolü.

## Kontrol listesi (K fazına işlenecek)

| Adım | Durum |
|------|-------|
| Wikidata item + sameAs | [ ] |
| LinkedIn/Crunchbase/sosyal profiller dolu + sameAs | [ ] |
| NAP tutarlılığı (tüm dizinler) | [ ] |
| Google Reviews akışı + yanıt protokolü | [ ] |
| Reddit/Quora/YouTube varlık planı | [ ] |
| İlk dijital PR bağlantısı | [ ] |
| IndexNow kurulu + deploy hattında | [ ] |
