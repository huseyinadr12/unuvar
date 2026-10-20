# Ünüvar Aydınlatma

Karaköy, İstanbul’daki Ünüvar Aydınlatma mağazasının web sitesi.

**Web sitesi:** https://huseyinadr12.github.io/unuvar/

Ana sayfa, koleksiyon/katalog, B2C teklif, proje çözümleri, teknik seçim bilgileri, hakkımızda, iletişim ve gizlilik sayfaları bulunur. 164 sayfalık PDF katalog 19 ürün grubu, dört koleksiyon ailesi, sayfa önizlemesi ve indirme bağlantısıyla `/urunler/` adresinde yayınlanır. Ürün kodu veya katalog sayfası B2C teklif listesine aktarılır; ziyaretçi adet ve kullanım alanını ekleyip mesajını WhatsApp’ta gönderir.

## Dijital katalog

- `source/data/catalog.json`: 164 sayfanın önizleme yolları, 19 bölümün sayfa aralıkları, koleksiyon görselleri ve filtre grupları.
- `source/data/editorial-products.json`: kaynak katalogdan kontrol edilen 52 Artline ürün kaydı. Fiyat veya canlı stok verisi değildir.
- `source/data/quote-products.json`: katalogdaki 19 gruba ait 360 seçilebilir ürün kodu ve ölçü/güç seçenekleri; B2C ekranının ürün kaynağı.
- `source/dist/assets/catalog/`: standart A4 yatay PDF ve WebP önizlemeleri. Okuyucu seçili sayfayı yükler, görünürken boşta bir sonraki sayfayı hazırlar; PDF otomatik yüklenmez. Güncel, doğrulanmış linearize PDF 31,0 MB'dır (`unuvar-aydinlatma-katalog-v4.pdf`); görsel pikselleri ve sayfa içerikleri değişmemiştir. Önizlemeler `catalog-v3-NNN.webp` yollarını kullanır.
- `source/scripts/catalog_markup.py`, `source/dist/assets/catalog.css`, `source/dist/assets/catalog.js`: katalog tanıtımı, içindekiler, sayfa seçici ve ana sayfa bağlantısı.
- JavaScript kapalıyken PDF indirme ve bölümün PDF sayfasına açılan bağlantıları çalışır. `#sayfa-25` gibi adresler açık bir katalog sayfasını paylaşmak için kullanılabilir.
- Tüm ürün/model aileleri 160 ürün sayfasında aynı logo, görsel, teknik tablo ve sayfa düzeniyle sunulur. Kaynakta tekrar eden AS5011 kodu yıldızlı notla korunmuştur; AS5017 varsayılmamıştır. Eksik/çelişkili ölçüler, spot çizimindeki ölçü çelişkisi ve IP67/IP68 tutarsızlığı ilgili sayfalarda işaretlidir.
- Sayfa çevirme animasyonu, sağ/sol ok tuşları ve yatay kaydırma desteklenir. Azaltılmış hareket tercihinde animasyon atlanır. Yeni sayfa yüklenmeden mevcut sayfa kaybolmaz; hızlı gezinmede eski istekler güncel sayfayı değiştirmez. `catalog.js` yalnız katalog sayfasında yüklenir.
- Okuyucu ürün koleksiyonlarından önce gelir. Yakın sayfa ön yüklemesi veri tasarrufu / 2G'de kapanır; en fazla beş çözülmüş görsel tutulur. Başarısız arka plan isteği ziyaretçi tıkladığında tekrar denenir.
- `source/scripts/optimize_catalog_pdf.py` (isteğe bağlı `pikepdf` bağımlılığı) PDF'deki ASCII85 katmanını kayıpsız kaldırır ve hızlı web görüntüleme için linearize eder. Orijinali değiştirmez; 164 sayfanın içerik akışını ve 148 görselin piksellerini, linearizasyonu ve PDF sözdizimini doğrular.

Yeni katalog sürümünde PDF'yi ve ilgili sayfa önizlemelerini birlikte güncelleyin; `catalog.json`, `editorial-products.json` ve `quote-products.json` sayfa/bölüm aralıklarını eşleştirin. 146 ürün görseli kaynak referanslarıyla yapay zekâ kullanılarak standart stüdyo sunumuna dönüştürülmüştür. Görseller üretici teknik fotoğrafı veya 8K orijinal değildir. Kullanıcının isteğiyle görsel açıklama etiketleri kaldırılmıştır; üretim kayıtları çalışma alanında korunur.

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
node --test source/tests/*.test.cjs
python source/scripts/export_pages.py --output docs --url https://huseyinadr12.github.io/unuvar
```

`source/scripts/inner_pages.py` Hakkımızda ve İletişim içeriğini, `source/scripts/content_sections.py` ortak bölümleri (ürün grupları, fotoğrafla sor, SSS), `source/dist/assets/` tasarımı ve etkileşimleri içerir. Ürünler daha sonra `source/data/order-catalog.json` üzerinden eklenebilir.

GitHub Pages, `main` dalının `/docs` klasörünü yayınlar. Değişiklikten sonra yukarıdaki komutlarla çıktıyı güncelleyip `docs` ile kaynak değişikliklerini birlikte commit/push edin. Dışa aktarım yalnızca kullanılan görselleri ve dosyaları alır, `/unuvar/` bağlantılarını ve arama motoru meta verilerini yayın adresine uyarlar.

İletişim formu bir mesaj taslağı hazırlar; mesajı ziyaretçi WhatsApp’ta gönderir. Formda kalıcı kayıt veya sunucuya gönderim yoktur. Google Haritalar bileşeni otomatik yüklenir. Animasyonlar azaltılmış hareket tercihini destekler.

Marka logoları ilgili sahiplerine aittir. Manrope yazı tipi lisansı `source/dist/assets/fonts/OFL.txt` dosyasındadır.

## B2C teklif ve proje çözümleri

- `/b2c/`: 19 grupta 360 ürün kodu, kod/ad/ölçü ile arama, grup filtresi, toplu `KOD;ADET` girişi, en fazla 50 kalem ve 9999 adet/kalem. İlk görünüm farklı gruplardan ürünleri gösterir. Belirtilmemiş güç değerleri boş bırakılır. Diğer kodlar teyit notuyla eklenebilir.
- Ürün kodları/adetler cihazda yedi gün saklanır. Ad/liste adı, şehir, kullanım alanı ve not bilgileri kalıcı kaydedilmez. Temizleme/çıkarma geri alınabilir.
- Talep özeti WhatsApp'a aktarılır; mesajı ziyaretçi gönderir. Uzun metinler için kopyalama ve CSV indirme vardır. Yazdır / PDF düğmesi tarayıcının yazdırma penceresini açar.
- Bu sayfa üyelikli bayi portalı, canlı fiyat/stok sistemi veya kesin sipariş kaydı değildir. Bunlar için yetkili bayi hesapları, fiyat/stok verisi, sunucu/veritabanı ve sipariş yönetimi gerekir.
- `/cozumler/`: altı kullanım alanı, ürün grubu bağlantıları ve proje talebi hazırlama bilgileri. Teknik rehber ana menüden kaldırılmış, eski adresi ve alt menü erişimi korunmuştur.
- `source/scripts/b2b.py`, `source/dist/assets/b2b.css`, `b2b-core.js`, `b2b.js`; B2B dosyaları yalnız gereken sayfalarda yüklenir.
- `node --test source/tests/b2b-core.test.cjs`: miktar, toplu giriş, limit, saklama süresi ve CSV formül güvenliği kontrolleri.

## Görsel çözünürlüğü

Mevcut kaynak katalogda 254 görselin 213'ünün uzun kenarı 600 pikselin altındadır; 8K orijinal yoktur. Yeni stüdyo görselleri 8K olarak etiketlenmez. Üretici orijinalleri geldiğinde ürün koduyla eşleştirilip bu temsili görsellerin yerine aktarılmalıdır. Ana PNG dosyaları, üretim istemleri ve gerçek piksel boyutları çalışma alanındaki `output/imagegen/studio/manifest.json` ile kayıtlıdır.


## Görsel düzenleme ve B2C geçişi — 20 Ekim 2026

- `/b2c/` bireysel müşteriler için ürün/adet listesi ve WhatsApp fiyat talebi sayfasıdır. `/b2b/` eski bağlantıları sorgu ve sayfa içi konumla birlikte buraya yönlendirir. Mevcut cihaz listelerinin korunması için teknik dosya adları, DOM anahtarları ve localStorage anahtarı değişmedi.
- Ana sayfadaki kullanım görseli `interior-v2.webp` ve sıva üstü lineer kartı `lineer-siva-ustu-v2.webp`, yerleşik ImageGen ile düzenlendi. Duvar/tavan yüzeyleri iyileştirildi. Bunlar ürün teknik fotoğrafı veya tamamlanmış proje referansı değildir.
- Ana sayfa kapak görseli `hero-v2.webp` de düzenlendi. PNG çıktıları ve kullanılan istemler çalışma alanındaki `output/imagegen/` klasöründedir. PDF katalog ve sitedeki ürün kartları aynı yeni stüdyo görsellerini kullanır.
- `refinements.css` ve `motion.js` kart, filtre, liste ve açılır başlık geri bildirimlerini sağlar; azaltılmış hareket tercihi desteklenir.

## Sayfa ve etkileşim animasyonları

- `navigation.js` ve `transitions.css`: açılış DOM hazır olduğunda başlar; 850 ms boyunca gerçek sayfa içeriği 3B perspektifle açılır, kâğıt kıvrımı ışığı üzerinden geçer ve başlıklar sırayla girer. Sayfa bağlantıları 320 ms çıkıştan sonra açılır. Yerel View Transition API'sine bağlı değildir. İndirme, PDF/görsel bağlantıları, başka sekme, dış bağlantı ve değiştirici tuşlarla tıklamalar bu gecikmeye dahil edilmez.
- Sayfa içi başlık bağlantısı doğal kaydırmayı korur ve hedef başlık görünür olduğunda canlanır. Mevcut menü sayfasına tıklamak giriş efektini tekrar oynatır. Geri/ileri gezinme, yarım kalan çıkış durumunu temizler.
- Sayfa aşağı kaydırılırken bölümler sırayla belirir; menü, buton, kart, filtre ve açılır başlıklarda kısa geri bildirimler vardır. Gözlemci çalışmasa bile içerik görünür kalır.
- Katalogda ileri/geri yönüne uygun 720 ms dönüş, kâğıt aydınlığı ve gölge efekti bulunur. Hızlı sayfa değişimi ve hareket tercihinin değişmesi mevcut animasyonu temizler.
- Hareketi azaltma tercihi bütün bu animasyonları devre dışı bırakır.
