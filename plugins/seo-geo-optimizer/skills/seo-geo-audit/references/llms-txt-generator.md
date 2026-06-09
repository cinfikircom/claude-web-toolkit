# llms.txt & AI Agent Erişim Dosyaları

Amaç: LLM tabanlı arama motorlarının (ChatGPT Search, Perplexity, Gemini, Claude) ve AI
ajanlarının site içeriğini keşfetmesini, chunk'lamasını ve alıntılamasını sağlamak.
Bu dosyalar **AI motorları için sitemap.xml eşdeğeridir** — yoksa site içeriği LLM'lere
rastgele/eksik ulaşır.

## Standartlar (2026)

| Dosya | Format | İşlev |
|-------|--------|-------|
| `/llms.txt` | Markdown (MD) | Kısa özet + önemli sayfa linkleri (sitemap gibi) |
| `/llms-full.txt` | Markdown (MD) | Tüm önemli sayfaların tam metin içeriği |
| `/ai-agents.json` | JSON | Yapılandırılmış erişim manifestosu |
| `ai-agents` route | Çerçeveye bağlı | Dinamik erişim endpoint'i |

## `/llms.txt` formatı

```
# {SITE ADI}
> {Tek cümlelik site açıklaması — LLM'ler burayı citation preamble olarak kullanır}

## Hakkımızda / About
- [Hakkımızda](https://site.com/hakkimizda): Şirket {sektör} alanında {kuruluş yılı}...
- [İletişim](https://site.com/iletisim): Adres, telefon, eposta...

## Hizmetler / Services
- [Servis Adı](https://site.com/servis-1): {tek cümle}
- [Servis Adı](https://site.com/servis-2): {tek cümle}

## Önemli İçerik / Key Content
- [Sayfa](https://site.com/sayfa): {kısa açıklama}

## Daha Fazla / More
- llms-full.txt: https://site.com/llms-full.txt
- ai-agents.json: https://site.com/ai-agents.json
```

**Kurallar:**
- Mutlak URL kullan (göreceli değil)
- Her linkte kısa açıklama olmalı (LLM sayfa içeriğini tahmin edebilsin)
- Başlık hiyerarşisi korunsun (H2 → H3)
- Dosya kökte, robots.txt ile aynı seviyede

## `/llms-full.txt` formatı

Tüm önemli sayfaların markdown temsili. Her sayfa için:
```
# Sayfa Başlığı
URL: https://site.com/sayfa
Last-Modified: 2026-06-09

{12-15 cümlelik temiz markdown — navigation/header/footer/sidebar ATILMIŞ}
```

**Önemli:** llms-full.txt yalnızca **içerik** içermeli — nav, footer, sidebar, reklam gibi
tekrarlayan markup'ları at. Her sayfanın özü 3-5 KB arası olmalı.

## `/ai-agents.json` formatı

```json
{
  "name": "Site Adı",
  "description": "Site açıklaması — 1-2 cümle",
  "url": "https://site.com",
  "llms": {
    "llms.txt": "https://site.com/llms.txt",
    "llmsFull": "https://site.com/llms-full.txt"
  },
  "api": {
    "search": "https://site.com/api/search?q={query}",
    "docs": "https://site.com/api/docs"
  },
  "rules": {
    "allow": ["GPTBot", "OAI-SearchBot", "PerplexityBot", "ClaudeBot"],
    "crawlDelay": 5,
    "maxTokensPerPage": 16000
  },
  "categories": ["hizmet", "lokasyon", "blog"],
  "sitemap": "https://site.com/sitemap.xml",
  "language": "tr",
  "lastModified": "2026-06-09T12:00:00+03:00"
}
```

## Keşif zinciri & robots.txt deklarasyonu

AI motorları dosyaları şu zincirle keşfeder — her halkanın bir öncekine işaret etmesi gerekir:

```
robots.txt  ──►  /llms.txt  ──►  /llms-full.txt
     │                 └────────►  /ai-agents.json
     └──►  Sitemap: …/sitemap.xml
```

`robots.txt` içine llms.txt referansını ekle (Sitemap direktifiyle aynı mantık):
```
# robots.txt
Sitemap: https://site.com/sitemap.xml
# AI agent erişim dosyaları
LLMs: https://site.com/llms.txt
```
> `LLMs:` direktifi henüz resmi bir robots standardı değil; yine de yaygınlaşan bir convention.
> Asıl keşif `/llms.txt`'in **kökte** (robots.txt ile aynı seviye) bulunmasıyla olur.
> AI bot erişim kuralları (Allow/Disallow) için → `references/ai-crawler-audit.md`.

## Framework'e göre uygulama

### Next.js (App Router)
```ts
// app/llms.txt/route.ts
export async function GET() {
  const pages = await getImportantPages() // CMS/DB'den çek
  const body = generateLlmsTxt(pages)
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  })
}
```

### Astro
```astro
// src/pages/llms.txt.ts
export async function GET() {
  const pages = await Astro.glob('../content/**/*.md')
  const body = generateLlmsTxt(pages)
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  })
}
```

### Statik site
Derleme zamanında `public/llms.txt` ve `public/llms-full.txt` oluştur.

### Düz HTML / PHP
Kök dizine elle `llms.txt` dosyası koy. CMS ile dinamik oluşturuluyorsa route ekle.

## Denetim adımları

1. `/llms.txt`, `/llms-full.txt`, `/ai-agents.json` var mı kontrol et.
2. Yoksa framework'e uygun şekilde oluştur.
3. llms.txt içeriğini tara:
   - Mutlak URL'ler mi?
   - Her linkin açıklaması var mı?
   - En önemli 10-50 sayfa listelenmiş mi?
4. llms-full.txt varsa: tekrarlayan markup var mı, içerik temiz mi?
5. ai-agents.json: doğru bot listesi, güncel `lastModified`?

## Beklenen GEO etkisi

| Eylem | Etki |
|-------|------|
| `/llms.txt` yok → var | ChatGPT/Perplexity tarafından **keşfedilme** |
| `/llms-full.txt` ekleme | Sayfa içeriğinin **tam metin alıntılanma** şansı ↑ |
| `/ai-agents.json` ekleme | Yapılandırılmış erişim, API keşfi |
| Hepsi eksik → hepsi var | GEO görünürlüğünde **%30-60 artış** (ampirik) |

> Referans: https://llmstxt.org/ — güncel standart ve topluluk örnekleri.
