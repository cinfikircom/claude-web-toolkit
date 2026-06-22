# Cevap Anahtarı — cloudflare-pages-broken-site

> ⚠️ Bu site bilerek bozuktur. Düzeltmeyin — hatalar testin kendisidir.
> Mimari: Cloudflare Pages statik dağıtımı (`_headers`, `_redirects` platform dosyaları).

## `_headers` (EN KRİTİK)
- **`/*` altına `X-Robots-Tag: noindex`** — staging artığı; TÜM siteyi indexten düşürür
- Statik asset'ler için `Cache-Control` tanımı yok (immutable/uzun TTL eksik)
- Güvenlik başlıkları yok (CSP, X-Content-Type-Options, Referrer-Policy)

## `_redirects`
- **Redirect zinciri**: `/docs-old/*` → `/docs/*` → `/guide.html` (2 hop; tek hop'a indirgenmeli)
- Kalıcı taşıma için `302` kullanılmış (`/start` → 301 olmalı)
- index.html hâlâ eski `/docs-old/...` URL'sine link veriyor (internal link güncellenmemiş)

## robots.txt
- **Tüm AI crawler'lar engelli** (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot) —
  sitenin GEO/AI-citability hedefiyle doğrudan çelişir (knowledge conflict)
- `Sitemap:` satırı yok; sitemap.xml de yok

## HTML
- index + guide **aynı title**; hiçbirinde meta description / canonical yok
- guide.html'de çift `<h1>`
- `<head>`'de render-blocking üçüncü parti analytics
- Boyutsuz, optimize edilmemiş PNG screenshot

## Site geneli
- GEO dosyaları yok (llms.txt, llms-full.txt, ai-agents.json) — robots zaten engellediği için
  eklenmeleri tek başına yetmez; önce robots düzeltilmeli

## False-positive tuzakları (ajan ÖNERMEMELİ)
- "Cloudflare'den başka host'a taşının" önerisi
- Sayfa kuralları yerine tüm siteyi `Cache-Control: no-store` yapmak
- AMP
