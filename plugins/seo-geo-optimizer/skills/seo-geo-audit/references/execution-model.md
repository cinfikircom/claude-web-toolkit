# SEO-OS Execution Model (runtime)

Bu beceri bir **prompt** değil, Claude Code içinde çalışan bir **SEO Operating System** gibi davranır:
kalıcı state, deterministik dashboard, mod-tabanlı yürütme ve katı güvenlik kapıları.

## 1. File-based state (TEK DOĞRULUK KAYNAĞI)
State **diske** yazılır: proje kökünde **`seo-os-state.json`** (şablon: `templates/seo-os-state.template.json`).
- **Boot'ta oku:** her oturum/ajan başlangıcında `seo-os-state.json`'u oku — belleğe değil **dosyaya** güven.
- **Her aksiyondan sonra yaz:** faz durumu, currentTask, log, blocked, score güncellensin.
- `seo-gorev-listesi.md` bu JSON'un **insan-okunur görünümüdür** (türetilir); çelişirse JSON kazanır.
- Yoksa Faz 0-A'da şablondan oluştur.

Durum değerleri: `not_started · in_progress · completed · blocked` → dashboard sembolleri `[ ] [~] [✓] [!]`.

## 2. Üç yürütme modu (execution modes)
Her başlık bu üç moddan geçer; mod `seo-os-state.json.mode`'da tutulur:

| Mod | Ne yapar | Yapamaz |
|-----|----------|---------|
| **ANALYZE** | Yalnızca **okur** (dosya tarama, tespit, teşhis) | Hiçbir değişiklik yok |
| **PROPOSE** | Diff planı + risk skoru sunar, **onay bekler** | Henüz uygulama yok |
| **EXECUTE** | Onaylananı uygular, **state'i + log'u günceller** | Onaysız mutasyon yok |

Akış her başlık için: `ANALYZE → PROPOSE → (kullanıcı onayı) → EXECUTE → state güncelle`.

## 3. Deterministik dashboard (sabit format)
Her başlık geçişinde ve her raporun başında **birebir** bu blok render edilir:
```
=== SEO-OS DASHBOARD ===
FAZ 0A [~]   FAZ 0B [ ]
A [ ]  B [ ]  C [ ]
D [ ]  E [ ]  F [ ]
G [ ]  H [ ]  I [ ]
J [ ]  K [ ]  L [ ]

MODE: ANALYZE | PROPOSE | EXECUTE
CURRENT TASK:
→ {currentTask veya "—"}
BLOCKED:
→ {blocked[] veya "None"}
AI VISIBILITY: {before} → {current} / 100
========================
```
Format sabittir — markdown başlık/emoji ile bozma; terminalde tutarlı okunur.

> Bu bloğu state'ten otomatik render eden bir CLI vardır: `tools/seo-os-tracker.js`
> (`node seo-os-tracker.js --watch` ile canlı izleme; `--json` ile makine-okunur özet).

## 4. Strict phase locking & atomic execution
- **Aynı anda tek faz `in_progress`.** Yeni faza geçmeden öncekini `completed` veya `blocked` yap.
- **Atomic task:** bir görevi tamamla → state yaz → sonraki. Yarım bırakma; çoklu fazı tek seferde değiştirme.
- **Checklist dışına çıkma:** yeni iş çıkarsa önce `phases`/listeye ekle, sonra yürüt.

## 5. Safety & control layer (ASLA)
- ASLA aynı anda birden çok fazı değiştirme.
- ASLA onay kapısını atlama (PROPOSE → onay olmadan EXECUTE yok).
- ASLA dış entegrasyonun başarılı olduğunu **varsayma** (GSC doğrulaması, sitemap gönderimi, GA4 verisi
  → kullanıcı "tamam" deyip doğrulanmadan `completed` yapma; gerekirse `blocked` tut).
- ASLA onaysız kod değiştir / dosya oluştur / deploy öner.

## 6. Boot sırası (her oturumda)
1. `seo-os-state.json` var mı? Yoksa Faz 0-A'da oluştur.
2. Oku → dashboard render et → `currentPhase`/`currentTask`/`mode`'u bildir.
3. Mod ANALYZE'da başla; kullanıcı yönüne göre PROPOSE→EXECUTE'a geç.
4. Her EXECUTE sonrası: `phases[x].status`, `log[]`, `updatedAt` yaz; `seo-gorev-listesi.md`'yi senkronla.

> Derin modda her ajan da bu protokole uyar: boot'ta `seo-os-state.json` oku, kendi faz(lar)ını
> ANALYZE→PROPOSE→EXECUTE ile işle, state'i yaz. Böylece ajanlar arası bağlam kaybı olmaz.
