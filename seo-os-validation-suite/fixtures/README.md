# Fixture Library — Broken-by-Design Test Sites

Ana `golden-seo-test-site/` (Next.js) fixture'ına ek mimari varyantlar. Her fixture **bilerek
bozuktur** — düzeltmeyin; hatalar testin kendisidir. Her klasörde:

| Dosya | Rol |
|-------|-----|
| site dosyaları | Bozuk-tasarımlı statik site (bağımlılıksız, `npx serve .` ile açılır) |
| `INJECTED-ISSUES.md` | Cevap anahtarı: sayfa sayfa enjekte edilen tüm hatalar |
| `baseline.json` | 4×25 kategori kontrolleri (scorer formatı) |
| `decision-matrix.json` | v2 uzman beklentileri (statik cevap yok; scorer dinamik türetir) |

## Fixture'lar
- **`ecommerce-broken-site/`** — statik HTML mağaza: faceted URL canonical'sızlığı, Product/Offer
  schema eksikliği, fiyat tutarsızlığı, dev görseller, render-blocking jQuery.
- **`multilingual-broken-site/`** — EN/TR/DE: hreflang yok, yanlış `lang`, locale'ler arası kopya
  title, x-default yok, yarı çevrilmiş içerik.
- **`cloudflare-pages-broken-site/`** — Cloudflare Pages dağıtımı: `_headers` ile kazara global
  `X-Robots-Tag: noindex`, cache-control eksik, `_redirects` zinciri, robots.txt'te tüm AI botları
  engelli (GEO hedefiyle çelişki).

## Skorlama
```bash
cd seo-os-validation-suite
node seo-os-scorer.js path/to/agent-output.json \
  --baseline=fixtures/ecommerce-broken-site/baseline.json \
  --matrix=fixtures/ecommerce-broken-site/decision-matrix.json
```
E2E harness ile gerçek koşu:
```bash
node harness/run-agent-harness.js \
  --site=fixtures/multilingual-broken-site \
  --baseline=fixtures/multilingual-broken-site/baseline.json \
  --matrix=fixtures/multilingual-broken-site/decision-matrix.json
```
Gerçek CWV ölçümü (statik fixture'ları herhangi bir static server ile başlatın):
```bash
npx serve fixtures/ecommerce-broken-site -l 4310 &
node lighthouse-runner.js --url=http://localhost:4310 \
  --baseline=fixtures/ecommerce-broken-site/baseline.json
```
