# Ünüvar Aydınlatma

Karaköy, İstanbul’daki Ünüvar Aydınlatma mağazasının web sitesi.

**Web sitesi:** https://huseyinadr12.github.io/unuvar/

Ana sayfa, dijital katalog ve ürün grupları, ışık rehberi, hakkımızda, iletişim ve gizlilik sayfaları bulunur. 44 sayfalık PDF katalog 19 bölüm, sayfa önizlemesi ve indirme bağlantısıyla `/urunler/` adresinde yayınlanır. Güncel fiyat ve stok bilgisi WhatsApp'tan sorulur. Sipariş listesi altyapısı, ayrı sipariş kataloğuna kayıt eklendiğinde görünür.

## Dijital katalog

- `source/data/catalog.json`: 44 sayfanın önizleme yolları ve 19 bölümün sayfa aralıkları.
- `source/dist/assets/catalog/`: düzenlenmiş PDF ve WebP önizlemeleri. Önizleme okuyucusu yalnız seçilen sayfanın görselini yükler; 16 MB PDF ancak ziyaretçi açtığında/indirdiğinde yüklenir.
- `source/scripts/catalog_markup.py`, `source/dist/assets/catalog.css`, `source/dist/assets/catalog.js`: katalog tanıtımı, içindekiler, sayfa seçici ve ana sayfa bağlantısı.
- JavaScript kapalıyken PDF indirme ve bölümün PDF sayfasına açılan bağlantıları çalışır. `#sayfa-25` gibi adresler açık bir katalog sayfasını paylaşmak için kullanılabilir.
- Düzenlenen katalogda Artline güç başlıkları ve 52 tablo standartlaştırılmıştır. AS5017 yüksekliği, AS5207 genişliği, AS5401 yüksekliği ve AS5405/AS5406 eksik ölçüleri tahmin edilmeden “Teyit gerekli” olarak işaretlenmiştir. Kaynakta yer alan diğer teknik değerler, belge/garanti ifadeleri ve IP sınıfı tutarsızlıkları ürün kodu üzerinden teyit edilmelidir.

Yeni katalog sürümünde PDF'yi ve ilgili sayfa önizlemelerini birlikte güncelleyin, `catalog.json` sayfa/bölüm aralıklarını eşleştirin ve aşağıdaki derleme/denetim/dışa aktarım komutlarını çalıştırın. Kaynak ürün görselleri yeniden üretilmemiştir; mevcut katalogdan alınmıştır.

## Sık düzenlenenler

- **Çalışma saatleri:** `source/scripts/build.py` içindeki `HOURS` listesi. Boş bırakılırsa sitede "telefonla teyit edin" notu görünür; doldurulduğunda ana sayfa, konum bölümü ve İletişim sayfasında listelenir.
- **Ürün grupları:** `source/scripts/content_sections.py` içindeki `PRODUCT_GROUPS`.
- **Mekâna göre öneriler ve ışık rengi seçici:** aynı dosyada `SPACES` ve `KELVINS`; rehber tabloları (lümen, duy tipleri, IP) `source/scripts/inner_pages.py` içinde.
- **Açılış animasyonu:** `source/dist/assets/intro-head.js` (sekme başına bir kez, yalnızca ana sayfada) ve `transitions.css`.
- **Renkler ve tasarım:** `source/dist/assets/site.css` (en üstteki `:root` değişkenleri tabela ve logodan alınan antrasit, beyaz ve sarıdır).

## Düzenleme ve yayınlama

Python 3.10 veya üzeri yeterlidir; ek Python paketi gerektirmez.

```sh
python source/scripts/build.py
python source/scripts/check.py
python source/scripts/audit_seo.py
python source/scripts/export_pages.py --output docs --url https://huseyinadr12.github.io/unuvar
```

`source/scripts/inner_pages.py` Hakkımızda ve İletişim içeriğini, `source/scripts/content_sections.py` ortak bölümleri (ürün grupları, fotoğrafla sor, SSS), `source/dist/assets/` tasarımı ve etkileşimleri içerir. Ürünler daha sonra `source/data/order-catalog.json` üzerinden eklenebilir.

GitHub Pages, `main` dalının `/docs` klasörünü yayınlar. Değişiklikten sonra yukarıdaki komutlarla çıktıyı güncelleyip `docs` ile kaynak değişikliklerini birlikte commit/push edin. Dışa aktarım yalnızca kullanılan görselleri ve dosyaları alır, `/unuvar/` bağlantılarını ve arama motoru meta verilerini yayın adresine uyarlar.

İletişim formu bir mesaj taslağı hazırlar; mesajı ziyaretçi WhatsApp’ta gönderir. Formda kalıcı kayıt veya sunucuya gönderim yoktur. Google Haritalar bileşeni otomatik yüklenir. Animasyonlar azaltılmış hareket tercihini destekler.

Marka logoları ilgili sahiplerine aittir. Manrope yazı tipi lisansı `source/dist/assets/fonts/OFL.txt` dosyasındadır.
