# Kod Güvenliği Protokolü

Bu beceri kapsamında yapılan HER kod değişikliği bu protokole tabidir.

## Değişiklik öncesi zorunlu 3 adım
1. **Etkilenecek dosyaları listele** — tam yol(lar)ı.
2. **Yapılacak değişikliği açıkla** — ne, neden, hangi hedef kelime/metrik için.
3. **Risk seviyesi belirt:**
   - **Low Risk** — yeni izole dosya (llms.txt, schema helper), mevcut davranışı etkilemez.
   - **Medium Risk** — mevcut sayfaya metadata/şema ekleme, içerik/markup düzenleme.
   - **High Risk** — render stratejisi değişimi (SSR→ISR), font/görsel pipeline, ortak layout/build refactor.

## Kurallar
- **Onay almadan kod değiştirme.** Risk ne olursa olsun.
- **%5 kuralı:** Beklenen kazanım (SEO/performans) %5'in altındaysa değişiklik önerme.
- **Refactor sınırı:** Mevcut çalışan fonksiyonelliği bozma riski olan refactor'dan kaçın.
  Gerekiyorsa önce "neden gerekli + risk + geri alma planı" sun.
- **Bütünlük:** Çoklu dosya değişiminde hepsini birlikte teslim et — yarım değişiklik canlıyı bozar.
- **Proje kuralları üstündür:** Projede `CLAUDE.md`, `CONTRIBUTING`, lint/format kuralları varsa onlara uy.
- **Geri alınabilirlik:** High Risk değişikliklerde nasıl geri alınacağını raporda belirt.

## High Risk değişikliklerde ek adım
Madde madde ilerle, her maddeden sonra dur ve onay al. Toplu uygulama yapma.
Mümkünse önce tek bir örnek sayfada uygula, doğrula, sonra yaygınlaştır.

## Geri alma (rollback) şablonu
Her High Risk (ve istenirse Medium Risk) değişiklik için raporda şu bloğu doldur:

```
### Geri Alma Planı — {değişiklik adı}
- **Değişen dosyalar:** {tam yollar}
- **Önceki davranış:** {değişiklikten önce ne yapıyordu}
- **Geri alma yöntemi:**
  - Git: `git revert {commit}` veya `git checkout {commit} -- {dosya}`
  - Manuel: {config/flag değişikliğiyle eski davranışa dönüş — örn. revalidate → force-dynamic}
- **Doğrulama:** geri aldıktan sonra {hangi sayfa/metrik nasıl kontrol edilir}
- **Etki süresi:** {ISR/CDN cache nedeniyle yayılma gecikmesi — örn. revalidate süresi kadar}
```

> Render stratejisi (SSR↔ISR↔SSG) ve cache header değişikliklerinde **CDN/ISR cache'inin
> ne zaman temizleneceğini** mutlaka belirt — geri alma anında değil, cache TTL'i kadar gecikir.
