# AI Crawler Audit

Amaç: AI arama/eğitim botlarının siteye erişimini doğrulamak ve (istenirse) açıkça izin vermek.

## Doğrulanacak botlar (2026)
| Bot | Sahip | İşlev |
|-----|-------|-------|
| `GPTBot` | OpenAI | Eğitim taraması |
| `OAI-SearchBot` | OpenAI | ChatGPT Search indeksi |
| `ChatGPT-User` | OpenAI | Kullanıcı tetikli getirme |
| `PerplexityBot` | Perplexity | Arama indeksi |
| `Perplexity-User` | Perplexity | Kullanıcı tetikli |
| `ClaudeBot` / `Claude-Web` / `anthropic-ai` | Anthropic | Tarama / getirme |
| `Google-Extended` | Google | Gemini/Vertex eğitim izni |
| `GoogleOther` | Google | Çeşitli Google tarama |
| `Applebot-Extended` | Apple | Apple AI eğitim izni |
| `CCBot` | Common Crawl | Açık veri seti |
| `Amazonbot` | Amazon | Alexa/AI |
| `Bytespider` | ByteDance | AI eğitim |
| `Meta-ExternalAgent` | Meta | AI tarama |

## Denetim adımları
1. Mevcut `robots.txt` (veya framework robots dosyası) kurallarını oku.
2. Yukarıdaki botlardan **engellenenleri açıkça listele**.
3. Hedef: AI trafiği isteniyorsa bu botlara açık `Allow: /` ver (mevcut admin/panel/api disallow'larını koru).
4. Eğer kullanıcı AI eğitimine kapatmak istiyorsa `Google-Extended`, `GPTBot`, `CCBot`,
   `Applebot-Extended`, `Bytespider` için `Disallow: /` öner — bu bir **iş kararı**, kullanıcıya sor.

## Önerilen robots yapılandırması (AI trafiği İSTENİYORSA)
```
User-agent: *
Allow: /
Disallow: /admin/   # projeye göre uyarla
Disallow: /api/

User-agent: GPTBot
Allow: /
User-agent: OAI-SearchBot
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: Google-Extended
Allow: /

Sitemap: https://SITE/sitemap.xml
```
> Next.js'te `app/robots.ts`, Astro'da `robots.txt` veya entegrasyon, statik sitede kök `robots.txt`.
> Ek olarak `/llms.txt` referansını da değerlendir.
