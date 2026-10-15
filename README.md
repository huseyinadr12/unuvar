# Ünüvar Aydınlatma

Karaköy, İstanbul’daki Ünüvar Aydınlatma mağazasının web sitesi.

**Web sitesi:** https://huseyinadr12.github.io/unuvar/

Ana sayfa, katalog duyurusu, hakkımızda, iletişim ve gizlilik sayfaları bulunur. Ürün yayınlanmamıştır. WhatsApp mesaj hazırlama ve gelecekte kullanılacak sipariş listesi altyapısı hazırdır.

## Düzenleme ve yayınlama

Python 3.10 veya üzeri yeterlidir; ek Python paketi gerektirmez.

```sh
python source/scripts/build.py
python source/scripts/check.py
python source/scripts/audit_seo.py
python source/scripts/export_pages.py --output docs --url https://huseyinadr12.github.io/unuvar
```

`source/scripts/inner_pages.py` Hakkımızda ve İletişim içeriğini, `source/scripts/content_sections.py` ortak bölümleri, `source/dist/assets/` tasarımı ve etkileşimleri içerir. Ürünler daha sonra `source/data/order-catalog.json` üzerinden eklenebilir.

GitHub Pages, `main` dalının `/docs` klasörünü yayınlar. Değişiklikten sonra yukarıdaki komutlarla çıktıyı güncelleyip `docs` ile kaynak değişikliklerini birlikte commit/push edin. Dışa aktarım yalnızca kullanılan görselleri ve dosyaları alır, `/unuvar/` bağlantılarını ve arama motoru meta verilerini yayın adresine uyarlar.

İletişim formu bir mesaj taslağı hazırlar; mesajı ziyaretçi WhatsApp’ta gönderir. Formda kalıcı kayıt veya sunucuya gönderim yoktur. Google Haritalar bileşeni otomatik yüklenir. Animasyonlar azaltılmış hareket tercihini destekler.

Marka logoları ilgili sahiplerine aittir. Manrope yazı tipi lisansı `source/dist/assets/fonts/OFL.txt` dosyasındadır.
