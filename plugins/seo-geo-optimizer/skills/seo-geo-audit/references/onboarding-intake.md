# Erişim & Varlık Envanteri — İşlem Başında Kullanıcıdan Toplananlar (FAZ 0-B · Tur 3)

Denetim ilerledikçe tek tek istemek yerine, kullanıcı-tarafı TÜM gereksinimleri **sürecin
başında** envanterle: neyin hazır olduğunu işaretle, eksikler için AŞAĞIDAKİ adım adım
talimatları ver, durumu state'e yaz. Hiçbiri denetimi BAŞLATMAK için zorunlu değildir —
eksik olan, ilgili faza gelindiğinde `blocked [!]` olur ve panelde görünür.

## Protokol

1. Tur 1-2 (hedef soruları) bittikten sonra AskUserQuestion (multiSelect) ile sor:
   **"Şunlardan hangileri şu an hazır/elinde?"** → aşağıdaki 5 kategori.
2. Her EKSİK kalem için: bu dokümandaki ilgili adımları kullanıcıya ver
   (kopyala-yapıştır kalitesinde, tam URL'lerle) ve "hazır olunca haber ver" de.
3. Durumu yaz: `state.intake = { kalem: "ready" | "pending" | "skipped" }` +
   eksikler ilgili açıklamayla `state.blocked[]`'a. İnsan görünümü için
   `.seo-os/erisim-envanteri.md` dosyasına tablo halinde dök.
4. Kullanıcı "hazır" dedikçe intake'i ve blocked'ı güncelle; ilgili faz açılır.

## 1) Görsel varlıklar (Başlık F — marka & paylaşım)

**İstenenler:** kare logo (≥512×512 PNG/SVG) · yatay logo · favicon kaynağı ·
**OG/sosyal paylaşım görseli (1200×630)**.

OG görseli yoksa kullanıcıya iki yol sun:
- **A. Kendisi hazırlasın:** Canva/Figma'da 1200×630 tuval → marka rengi zemin + logo +
  5-8 kelimelik değer önerisi metni → PNG/JPG (< 1 MB) → projeye `public/og.png` benzeri
  bir yola koy. Claude `og:image` / `twitter:image` meta'larını bağlar.
- **B. Claude taslak üretsin:** eldeki logo+renklerle basit bir OG görseli/SVG taslağı
  oluşturulur, kullanıcı onaylar.

**Bonus (proje GitHub'daysa):** aynı 1200×630 görseli repo'nun kartı olarak da kullan:
GitHub repo → **Settings → General → Social preview → Edit → Upload an image**.
Böylece repo linki paylaşıldığında da markalı kart çıkar.

## 2) Marka & işletme bilgileri (Başlık E/G — entity & yerel)

**İstenenler:** resmi işletme adı · adres · telefon (NAP birebir) · çalışma saatleri ·
kuruluş yılı · sosyal profil URL'leri (Instagram/X/LinkedIn/Facebook/YouTube) ·
varsa Wikidata/Wikipedia sayfası · kısa işletme tanımı (2-3 cümle).

Kullanıcıya not: NAP her yerde (site, GBP, dizinler) **karakteri karakterine aynı**
kullanılacak — şimdi verdiği biçim kanonik kabul edilir.

## 3) Hesap erişimleri (Başlık K — off-site kurulum)

| Erişim | Neden | Kullanıcı adımı |
|--------|-------|-----------------|
| Google Search Console | doğrulama, sitemap, gerçek veri | https://search.google.com/search-console → mülk ekle; yoksa DNS erişimiyle birlikte K fazında kurulur |
| GA4 | dönüşüm ölçümü | https://analytics.google.com → mülk oluştur/erişim ver |
| DNS / registrar paneli | site doğrulamaları | panel giriş bilgisi HAZIR olsun (paylaşmasın; K fazında kendisi uygulayacak) |
| Google Business Profile | yerel SEO (G) | https://business.google.com → işletme sahipliği |
| Hosting / Cloudflare paneli | CWV & edge (I/H) | giriş HAZIR olsun; değişiklikler onayla uygulanır |

## 4) Ölçüm API anahtarları (opsiyonel — panel gerçek veriyle dolsun)

Anahtarlar kullanıcının **kendi makinesinde env** olarak kalır; repoya/Claude'a yazılmaz.

- **PSI_API_KEY** (gerçek CWV; ücretsiz):
  1. https://developers.google.com/speed/docs/insights/v5/get-started → "Get a Key"
  2. Terminal: `export PSI_API_KEY=...` (kalıcı olması için `~/.zshrc`/`~/.bashrc`'ye ekle)
  3. Kullanım: `seo-os-dashboard.js --measure --url=… --snapshot`
- **PERPLEXITY_API_KEY** (AI alıntılanma sondası; önerilen sağlayıcı):
  1. https://www.perplexity.ai/settings/api → anahtar oluştur → `export PERPLEXITY_API_KEY=...`
  2. (Alternatif/ek: `OPENAI_API_KEY`, `GEMINI_API_KEY`) → `seo-os-probe.js`
- **GSC service-account** (Arama Telemetrisi paneli):
  1. https://console.cloud.google.com → proje → **Search Console API**'yi etkinleştir
  2. IAM & Admin → Service Accounts → hesap oluştur → Keys → **JSON indir** (güvenli sakla)
  3. GSC → Ayarlar → Kullanıcılar → service-account e-postasını ekle
  4. Kullanım: `seo-os-gsc.js --site=sc-domain:siten.com --creds=sa.json`

## 5) İçerik girdileri (Başlık B/C/D)

**İstenenler:** hedef anahtar kelimeler (→ `.seo-os/keywords.txt`, satır başına bir) ·
en fazla 5 rakip URL (Tur 2'de alındıysa tekrar isteme) · varsa mevcut içerik takvimi/
öne çıkarılacak 3-5 sayfa (wizard ADIM 4 bunları kullanır).

## Envanter tablosu şablonu (`.seo-os/erisim-envanteri.md`)

| # | Kalem | Durum | Not |
|---|-------|-------|-----|
| 1 | Logo + OG görseli (1200×630) | ⏳ bekliyor | Canva adımları verildi |
| 2 | NAP + sosyal profiller | ✅ hazır | |
| 3 | GSC / GA4 / DNS / GBP erişimi | ⏳ bekliyor | K fazında kurulacak |
| 4 | PSI / Perplexity / GSC-SA anahtarları | ⏭ atlandı | panel simülasyonla çalışır |
| 5 | Kelimeler + rakipler + öncelikli sayfalar | ✅ hazır | keywords.txt yazıldı |
