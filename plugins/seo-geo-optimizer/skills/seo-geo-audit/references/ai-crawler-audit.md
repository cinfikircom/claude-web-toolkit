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
> Ek olarak `/llms.txt` referansını da değerlendir (→ `references/llms-txt-generator.md`).

## Doğrulama — kuralların çalıştığını nasıl test edersin

**1. robots.txt erişilebilir mi + içeriği doğru mu:**
```bash
curl -sI https://SITE/robots.txt | head -1     # 200 OK bekle
curl -s  https://SITE/robots.txt                # kuralları gözle doğrula
```

**2. Belirli bir bot olarak istek simülasyonu** (sayfanın bota döndürdüğü yanıt):
```bash
curl -s -A "GPTBot" -o /dev/null -w "%{http_code}\n" https://SITE/
curl -s -A "Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/bot)" https://SITE/ | head
```
> Not: `curl -A` yalnızca sunucunun UA'ya göre farklı davranıp davranmadığını test eder
> (UA-bazlı engelleme/cloaking). robots.txt kuralı bir *talebi* ifade eder; gerçek botun
> uyup uymadığını sunucu logundan görürsün.

**3. Gerçek bot trafiğini doğrula (sunucu access log):**
```bash
# Nginx/Apache access log'da AI botlarını say
grep -iE "GPTBot|OAI-SearchBot|PerplexityBot|ClaudeBot|Google-Extended|CCBot" \
  /var/log/nginx/access.log | awk '{print $1, $12}' | sort | uniq -c | sort -rn
```

**4. Google Search Console:** *Ayarlar → Tarama istatistikleri (Crawl stats)* — Googlebot/Google-Extended
isteklerini, yanıt kodlarını ve robots.txt getirme durumunu gösterir.

**5. robots.txt sözdizimi:** Search Console'un robots.txt test aracı veya
`https://SITE/robots.txt` → Google "robots.txt Tester" ile belirli bir URL+UA için izin kontrolü.

> Engelleme (`Disallow`) ekledikten sonra mutlaka #2 ve #3 ile **canlıda** doğrula —
> framework'ün ürettiği robots dosyası beklediğinden farklı olabilir.
