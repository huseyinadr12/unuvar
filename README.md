# Ünüvar Aydınlatma

Karaköy, İstanbul’daki Ünüvar Aydınlatma mağazasının web sitesi.

**Web sitesi:** https://huseyinadr12.github.io/unuvar/

Ana sayfa, koleksiyon/katalog, B2C teklif, proje çözümleri, teknik seçim bilgileri, hakkımızda, iletişim ve gizlilik sayfaları bulunur. 55 sayfalık PDF katalog 19 ürün grubu, dört koleksiyon ailesi, sayfa önizlemesi ve indirme bağlantısıyla `/urunler/` adresinde yayınlanır. Ürün kodu veya katalog sayfası fiyat talebi formuna aktarılır; ziyaretçi adet ve kullanım alanını ekleyip mesajını WhatsApp’ta gönderir. Sipariş listesi altyapısı, ayrı sipariş kataloğuna kayıt eklendiğinde görünür.

## Dijital katalog

- `source/data/catalog.json`: 55 sayfanın önizleme yolları, 19 bölümün sayfa aralıkları, koleksiyon görselleri ve filtre grupları.
- `source/data/editorial-products.json`: kaynak katalogdan kontrol edilen 52 Artline ürün kaydı. Fiyat veya canlı stok verisi değildir.
- `source/dist/assets/catalog/`: düzenlenmiş PDF ve WebP önizlemeleri. Önizleme okuyucusu yalnız seçilen sayfanın görselini yükler; yaklaşık 12,6 MB PDF ancak ziyaretçi açtığında/indirdiğinde yüklenir.
- `source/scripts/catalog_markup.py`, `source/dist/assets/catalog.css`, `source/dist/assets/catalog.js`: katalog tanıtımı, içindekiler, sayfa seçici ve ana sayfa bağlantısı.
- JavaScript kapalıyken PDF indirme ve bölümün PDF sayfasına açılan bağlantıları çalışır. `#sayfa-25` gibi adresler açık bir katalog sayfasını paylaşmak için kullanılabilir.
- 52 Artline ürünü 14 sayfada büyük görseller ve standart teknik bilgilerle yeniden dizilmiştir. Kaynakta tekrar eden AS5011 kodu yıldızlı notla korunmuştur; AS5017 varsayılmamıştır. Eksik/çelişkili ölçüler, spot çizimindeki ölçü çelişkisi ve IP67/IP68 tutarsızlığı ilgili sayfalarda işaretlidir. Diğer teknik değerler ve belge/garanti ifadeleri ürün kodu üzerinden teyit edilmelidir.

Yeni katalog sürümünde PDF'yi ve ilgili sayfa önizlemelerini birlikte güncelleyin, `catalog.json` sayfa/bölüm aralıklarını eşleştirin ve aşağıdaki derleme/denetim/dışa aktarım komutlarını çalıştırın. Kaynak ürün görselleri yeniden üretilmemiştir; mevcut katalogdan alınmıştır.

## Sık düzenlenenler

- **Çalışma saatleri:** `source/scripts/build.py` içindeki `HOURS` listesi. Boş bırakılırsa sitede "telefonla teyit edin" notu görünür; doldurulduğunda ana sayfa, konum bölümü ve İletişim sayfasında listelenir.
- **Ürün grupları:** `source/scripts/content_sections.py` içindeki `PRODUCT_GROUPS`.
- **Mekâna göre öneriler ve ışık rengi seçici:** aynı dosyada `SPACES` ve `KELVINS`; rehber tabloları (lümen, duy tipleri, IP) `source/scripts/inner_pages.py` içinde.
- **Ana sayfa ve satış akışı:** `source/scripts/editorial.py`; koleksiyon kartları, seçili ürünler, fiyat talebi formu ve üç adımlı süreç.
- **Renkler ve tasarım:** `source/dist/assets/editorial.css`; krem, antrasit, sarı ve pirinç tonları, büyük tipografi ve görsel odaklı düzen. Açılış ekranı kullanılmaz; içerik görünürlüğü animasyona bağlı değildir.
- **Koleksiyon filtresi ve talep formu:** `source/dist/assets/editorial.js`. Türkçe karakterleri dikkate alan arama ve ürün/sayfa aktarımı.

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

## B2C teklif ve proje çözümleri

- `/b2c/`: 52 Artline kaydı, kod/ad ile arama, grup filtresi, toplu `KOD;ADET` girişi, en fazla 50 kalem ve 9999 adet/kalem. Diğer kodlar teyit notuyla eklenebilir.
- Ürün kodları/adetler cihazda yedi gün saklanır. Ad/liste adı, şehir, kullanım alanı ve not bilgileri kalıcı kaydedilmez. Temizleme/çıkarma geri alınabilir.
- Talep özeti WhatsApp'a aktarılır; mesajı ziyaretçi gönderir. Uzun metinler için kopyalama ve CSV indirme vardır. Yazdır / PDF düğmesi tarayıcının yazdırma penceresini açar.
- Bu sayfa üyelikli bayi portalı, canlı fiyat/stok sistemi veya kesin sipariş kaydı değildir. Bunlar için yetkili bayi hesapları, fiyat/stok verisi, sunucu/veritabanı ve sipariş yönetimi gerekir.
- `/cozumler/`: altı kullanım alanı, ürün grubu bağlantıları ve proje talebi hazırlama bilgileri. Teknik rehber ana menüden kaldırılmış, eski adresi ve alt menü erişimi korunmuştur.
- `source/scripts/b2b.py`, `source/dist/assets/b2b.css`, `b2b-core.js`, `b2b.js`; B2B dosyaları yalnız gereken sayfalarda yüklenir.
- `node --test source/tests/b2b-core.test.cjs`: miktar, toplu giriş, limit, saklama süresi ve CSV formül güvenliği kontrolleri.

## Görsel çözünürlüğü

Mevcut kaynak katalogda 254 görselin 213'ünün uzun kenarı 600 pikselin altındadır; 8K orijinal yoktur. Ürün fotoğrafları 8K olarak etiketlenmez. Orijinaller geldiğinde ürün koduyla eşleştirilip kataloğa ve web boyutlarına aktarılmalıdır. Yapay zekâ ile hazırlanan tek ürün örneği inceleme çıktısıdır; gerçek ürün fotoğraflarının yerine yayımlanmamıştır.


## Görsel düzenleme ve B2C geçişi — 20 Ekim 2026

- `/b2c/` bireysel müşteriler için ürün/adet listesi ve WhatsApp fiyat talebi sayfasıdır. `/b2b/` eski bağlantıları sorgu ve sayfa içi konumla birlikte buraya yönlendirir. Mevcut cihaz listelerinin korunması için teknik dosya adları, DOM anahtarları ve localStorage anahtarı değişmedi.
- Ana sayfadaki kullanım görseli `interior-v2.webp` ve sıva üstü lineer kartı `lineer-siva-ustu-v2.webp`, yerleşik ImageGen ile düzenlendi. Duvar/tavan yüzeyleri iyileştirildi. Bu görseller düzenlenmiş kullanım örnekleri olarak etiketlenir; ürün teknik fotoğrafı veya tamamlanmış proje referansı değildir.
- Yeni görseller 8K olarak etiketlenmez. PNG çıktıları ve kullanılan istemler çalışma alanındaki `output/imagegen/` klasöründedir. PDF kataloğun teknik ürün görselleri bu düzenlemede değişmedi.
- `refinements.css` ve `motion.js` sayfa, kart, filtre, liste ve açılır başlık geri bildirimlerini sağlar; azaltılmış hareket tercihi desteklenir. Bağlantılar animasyon için geciktirilmez.
