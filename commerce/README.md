# Ünüvar mağaza ve yönetim altyapısı

Mevcut GitHub Pages sitesinden ayrı çalışan Node.js + SQLite uygulaması. 360 gerçek katalog kaydı başlangıçta **fiyatsız ve taslak** olarak alınır. Ürün adı, fiyat, stok ve yayın durumu admin panelinden yönetilir. Mağazada yayınlanan ürünler sepete eklenir; müşteri iletişim bilgileri ve sepetiyle sipariş talebi gönderir. Talepler kalıcı veritabanına kaydedilir; yönetici görüşme durumunu ve iç notları düzenler.

**Henüz çevrimiçi ödeme entegrasyonu yoktur.** Kullanıcının ödeme sağlayıcısı hesabı bulunmuyor. `/api/checkout` kapalıdır; hiçbir talep ödenmiş olarak işaretlenemez. Talep stok rezervasyonu yapmaz. Kargo bedeli belirtilmediği için ücretsiz kargo veya nihai ödeme toplamı gösterilmez. Bu hazırlık uygulaması internetten kartla satışa hazır olarak sunulmamalıdır.

## Yerel ilk kurulum

Node.js 22.13 veya üzeri gerekir; ek npm bağımlılığı yoktur. Depo kökünde PowerShell:

```powershell
$env:LOCAL_SETUP='1'
node commerce/server.mjs
```

`http://127.0.0.1:8732/admin/` adresinde ilk yönetici kendi e-posta ve en az 14 karakterli parolasını belirler. Kurulum yalnız localhost bağlantılarında, `LOCAL_SETUP=1` ile ve hiç yönetici yokken açıktır. Daha sonra aynı ekran giriş ekranıdır. Mağaza `/magaza/` adresindedir. İlk kurulum tamamlanınca sunucuyu `LOCAL_SETUP` olmadan başlatabilirsiniz. Parola düz metin saklanmaz; scrypt ile tuzlanır.

Veritabanı `commerce/.local/store.sqlite` içindedir; Git'e veya `docs` yayın klasörüne eklenmez. Yedeklerde SQLite WAL dosyaları ve tutarlı anlık görüntü kullanımı dikkate alınmalıdır. Test verileri gerçek mağaza veritabanına eklenmez.

## Güvenlik ve veri davranışı

- Admin oturumu sunucuda tutulur; çerez HttpOnly ve SameSite=Strict'tir, HTTPS ortamında Secure kullanılır. Oturumlar 8 saat sonra sona erer, çıkış sunucudaki oturumu siler.
- Yazma isteklerinde kaynak denetimi; admin işlemlerinde ayrıca CSRF doğrulaması; giriş ve talep gönderiminde hız sınırı vardır.
- Ürün/sipariş istekleri parametreli SQL kullanır. Fiyat ve toplam sunucuda hesaplanır; istemciden gelen fiyatlara güvenilmez. Güncel olmayan ürün sürümü, stok aşımı ve mükerrer ürün satırı reddedilir.
- Aynı talebin tekrar gönderilmesi idempotency anahtarıyla tek kayda döner. Anahtar başka içerikle kullanılamaz.
- Admin değişiklikleri denetim tablosuna kaydedilir. İletişim bilgileri yalnız giriş yapılmış admin API'sinden okunur. Müşteri adresi/kart verisi bu aşamada alınmaz; müşteri alanları tarayıcıda kalıcı saklanmaz.
- Sepet ve talep durumu gerçek verilerden gelir. Gerçek olmayan fiyat, stok, satış sayısı veya ödeme başarısı üretilmez.

## Canlıya geçişte kalan işler

1. HTTPS alan adı ve kalıcı diskli Node.js sunucu belirleyin. GitHub Pages bu API ve SQLite uygulamasını çalıştıramaz. Mevcut statik site aynı sunucuda sunulabilir; yönetim bağlantısı ana menüye eklenmez.
2. Yönetici hesabını yerelde oluşturup veritabanını güvenli şekilde sunucuya taşıyın. Sunucuda `HOST`, `PORT`, `SITE_ORIGIN` ve `COMMERCE_DB` ortam değişkenlerini belirleyin. HTTPS ters vekili, disk erişim izinleri, yedekleme, izleme ve veri saklama politikasını yapılandırın. İlk kurulum internete açılmaz.
3. Ödeme sağlayıcısı hesabı açılınca sağlayıcının resmi sunucu API'si ve imzalı bildirimleri entegre edilmeli. Tutar/para birimi/sipariş doğrulaması, yinelenen bildirimler, stok rezervasyonu, ödeme zaman aşımı, iptal ve iade senaryoları test edilmeli. Şu anda sağlayıcı adaptörü yoktur.
4. Gerçek fiyatlar, stok, kargo ve teslim koşulları girilmeli; müşteri bilgilerini kaydeden yeni akışa uygun gizlilik/satış metinleri işletmeyle tamamlanmalı. Sağlayıcının test ortamı onaylanmadan gerçek kartla ödeme açılmamalı.

```powershell
node --test commerce/test/*.test.mjs
```

Testler yetkisiz erişim, CSRF, kaynak kontrolü, fiyat/stok doğrulaması, mükerrer talepler ve kapalı ödeme davranışını kapsar. Node 22 SQLite modülü deneysel uyarısı verebilir; bu sürümle yerel test edilmiştir. Üretim dağıtımı henüz yapılmamıştır.
