from editorial import quote_form, process
"""Store-led inner pages, using confirmed business details and the real store photo."""


def about_page(icon, out, wa, photo, breadcrumb, sections, brands):
    return f'''<div class="container">{breadcrumb([('Hakkımızda', None)])}</div>
    <section class="about-opening"><div class="container about-grid">
      <div class="about-intro"><span class="eyebrow">HAKKIMIZDA</span><h1>Karaköy’den<br>mekânınıza.</h1><p class="lead">Ünüvar Aydınlatma, İstanbul’un aydınlatma ve elektrik malzemesi çarşısı Karaköy’de, Emekyemez Mahallesi Tutsak Sokak’ta hizmet veriyor.</p><p>Mağazamızda avize ve sarkıttan LED ampule, spot ve panelden şerit LED’e, dış mekân armatürlerinden elektrik malzemesine kadar geniş bir ürün yelpazesi bulabilirsiniz. Evinizdeki tek bir ampulden işletmenizin tüm aydınlatmasına kadar ihtiyacınızı birlikte çözelim.</p><div class="about-actions"><a class="button yellow" href="/iletisim/">Mağazaya ulaşın {icon('arrow')}</a>{out(wa(), icon('wa')+' WhatsApp’tan yazın', 'text-link')}</div></div>
      <figure class="about-photo">{photo('Ünüvar Aydınlatma Karaköy mağazasının vitrini ve girişi', priority=True)}<figcaption>{icon('pin')} Emekyemez Mah. Tutsak Sk. No:8, Karaköy</figcaption></figure>
    </div></section>
    <section class="values-section"><div class="container"><div class="section-head"><div><span class="eyebrow">NELER YAPIYORUZ?</span><h2>Ürün satışından doğru ürünü bulmaya.</h2></div></div><div class="values-grid">
      <article class="value-card"><span class="value-icon">{icon('bulb')}</span><h3>Aydınlatma ürünleri</h3><p>Avize, sarkıt, aplik, spot, panel, LED ampul, şerit LED, lambader ve dış mekân armatürleri.</p></article>
      <article class="value-card"><span class="value-icon">{icon('socket')}</span><h3>Elektrik malzemesi</h3><p>Anahtar, priz, kablo ve tesisat ihtiyaçlarınızı aydınlatmayla birlikte tek adresten karşılayın.</p></article>
      <article class="value-card"><span class="value-icon">{icon('camera')}</span><h3>Fotoğrafla ürün bulma</h3><p>Elinizdeki ürünün fotoğrafını veya kodunu gönderin, aynısını ya da uygun bir seçeneği birlikte bulalım.</p></article>
    </div></div></section>
    {brands()}
    {process(icon)}
    {sections['social']}'''


def contact_page(icon, out, wa, photo, breadcrumb, map_panel, map_url, hours_html):
    return f'''<div class="container">{breadcrumb([('İletişim', None)])}</div>
    <section class="contact-opening"><div class="container"><div class="page-heading"><span class="eyebrow">İLETİŞİM VE ULAŞIM</span><h1>Işığı birlikte konuşalım.</h1><p>İlgilendiğiniz ürünü, adedi ve kullanım alanını paylaşın. Fiyat ve stok bilgisini öğrenin veya Karaköy’deki mağazamıza uğrayın.</p></div>
      <div class="contact-channels"><a class="channel-card" href="tel:+905456105009"><span class="channel-symbol">{icon('phone')}</span><span><small>TELEFON</small><strong>0545 610 50 09</strong><span>Doğrudan arayın</span></span></a>{out(wa(), '<span class="channel-symbol">'+icon('wa')+'</span><span><small>WHATSAPP</small><strong>Mesaj gönderin</strong><span>Fotoğraf ve ürün kodu paylaşabilirsiniz</span></span>', 'channel-card channel-wa')}<a class="channel-card" href="#magaza-konumu"><span class="channel-symbol">{icon('pin')}</span><span><small>MAĞAZA</small><strong>Karaköy, Beyoğlu</strong><span>Konum ve yol tarifi</span></span></a></div>
    </div></section>
    {quote_form(icon, out, wa)}
    <section class="contact-destination" id="magaza-konumu" aria-labelledby="destination-title"><div class="container"><div class="destination-grid">{map_panel()}<aside class="destination-store"><div class="destination-photo">{photo('Ünüvar Aydınlatma mağaza girişi')}</div><div class="destination-address"><h2 id="destination-title">Ünüvar Aydınlatma</h2><address>Emekyemez Mahallesi<br/>Tutsak Sokak No:8, 34421<br/>Beyoğlu / İstanbul</address>{hours_html}<div class="destination-actions">{out(map_url, 'Yol tarifi al '+icon('up'), 'button outline')}<button class="text-button" type="button" data-copy="Ünüvar Aydınlatma, Emekyemez Mahallesi, Tutsak Sokak No:8, 34421 Beyoğlu / İstanbul">{icon('copy')} Adresi kopyala</button></div></div></aside></div></div></section>
'''


# General lighting reference values (EU lamp-equivalence lumen figures).
LUMENS = [('25W', 250, '2 - 3W'), ('40W', 470, '4 - 5W'), ('60W', 806, '8 - 9W'), ('75W', 1055, '10 - 11W'), ('100W', 1521, '13 - 15W')]
SOCKETS = [
    ('E27', 'Standart vidalı duy', '27 mm vida. Tavan lambası, abajur ve lambaderlerde en yaygın duy.', '<circle cx="24" cy="16" r="11"/><path d="M18 26v4h12v-4M17 33h14M18 36.5h12M19 40h10M22 43.5h4"/>'),
    ('E14', 'İnce vidalı duy', '14 mm vida. Avize, aplik ve küçük dekoratif armatürlerde.', '<path d="M24 4c6 7 6 17 0 22-6-5-6-15 0-22Z"/><path d="M20 28h8v3h-8ZM20.5 34h7M21 37h6M21.5 40h5M23 43h2"/>'),
    ('GU10', 'Çevirmeli spot duyu', 'İki kalın pimli, takıp çevirerek kilitlenir. Doğrudan 230V ile çalışan spotlarda.', '<path d="M9 8h30l-8 17H17Z"/><path d="M18 25h12v6H18Z"/><path d="M20.5 31v7M27.5 31v7"/><circle cx="20.5" cy="40" r="2.2"/><circle cx="27.5" cy="40" r="2.2"/>'),
    ('GU5.3 / MR16', '12V spot', 'İki ince pimli, itilerek takılır. Trafo ile çalışır; değiştirirken trafoyu da kontrol edin.', '<path d="M9 8h30l-8 17H17Z"/><path d="M18 25h12v5H18Z"/><path d="M21.5 30v12M26.5 30v12"/>'),
    ('G9', 'Kapsül duy', 'Halka biçiminde iki pimli küçük kapsül. Avize ve dekoratif armatürlerde.', '<rect x="17" y="5" width="14" height="23" rx="7"/><path d="M21 28v6M27 28v6"/><circle cx="21" cy="37.5" r="3.2"/><circle cx="27" cy="37.5" r="3.2"/>'),
]
# (code, dust level 0-6, water level 0-8, meaning, where)
IP_CLASSES = [
    ('IP20', 2, 0, 'Suya karşı koruma yok', '12,5 mm ve üzeri katı cisimlere karşı koruma; suya karşı koruma sınıfı yoktur.'),
    ('IP44', 4, 4, 'Sıçrayan suya dayanıklı', 'Su sıçramasına karşı koruma. Montaj bölgesi ve ürünün kullanım talimatı ayrıca değerlendirilir.'),
    ('IP65', 6, 5, 'Toz geçirmez, su jetine dayanıklı', 'Su jeti testine göre koruma. Ürünün dış mekân ve ortam uygunluğu ayrıca teyit edilir.'),
    ('IP67', 6, 7, 'Kısa süreli suya daldırmaya dayanıklı', 'Belirli süre ve derinlikte daldırma testi. Sürekli su altında kullanıma tek başına uygunluk vermez.'),
]


def guide_page(icon, out, wa, breadcrumb, sections, kelvin_widget):
    top = max(lm for _, lm, _ in LUMENS)
    lumen_rows = ''.join(f'<tr><th scope="row">{old}</th><td><span class="lm-bar" style="--w:{lm / top:.3f}"></span><span class="lm-value">≈ {lm} lm</span></td><td>{led}</td></tr>' for old, lm, led in LUMENS)
    sockets = ''.join(f'<article class="socket-card"><svg class="socket-art" viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">{art}</svg><h3><span>{code}</span> {name}</h3><p>{text}</p></article>' for code, name, text, art in SOCKETS)
    def meter(level, total):
        return ''.join(f'<i class="{"on" if i < level else ""}"></i>' for i in range(total))
    ips = ''.join(f'<article class="ip-card"><h3>{code}</h3><p class="ip-meaning">{meaning}</p><div class="ip-meter"><span>Toz</span><span class="ip-dots" aria-label="Toz koruması {dust}/6">{meter(dust, 6)}</span></div><div class="ip-meter"><span>Su</span><span class="ip-dots" aria-label="Su koruması {water}/8">{meter(water, 8)}</span></div><p>{where}</p></article>' for code, dust, water, meaning, where in IP_CLASSES)
    toc = ''.join(f'<a href="#{anchor}"><b>0{i + 1}</b> {label}</a>' for i, (anchor, label) in enumerate([('isik-rengi', 'Işık rengi'), ('parlaklik', 'Parlaklık'), ('duy-tipleri', 'Duy tipleri'), ('ip-koruma', 'IP koruma'), ('mekanlar', 'Mekâna göre')]))
    return f'''<div class="container">{breadcrumb([('Işık rehberi', None)])}</div>
    <section class="guide-hero"><div class="container"><div class="page-heading"><span class="eyebrow">IŞIK REHBERİ</span><h1>Doğru ışığı seçmek için kısa rehber.</h1><p>Ampul alırken ya da yeni bir armatür seçerken en çok sorulan konular: ışık rengi, parlaklık, duy tipi ve su koruması. Kafanız karışırsa ürünün fotoğrafını gönderin, birlikte bakalım.</p></div><nav class="guide-toc" aria-label="Rehber bölümleri">{toc}</nav></div></section>
    <section class="guide-block" id="isik-rengi" aria-labelledby="g-kelvin"><div class="container"><div class="section-head"><div><span class="eyebrow">01 · IŞIK RENGİ</span><h2 id="g-kelvin">Kelvin: ışığın rengi</h2></div><p>Kutuda yazan K değeri düştükçe ışık sarılaşır ve sıcaklaşır, yükseldikçe beyazlaşır ve maviye döner. Aynı odada tek bir renk kullanmak daha dengeli bir görüntü verir.</p></div>{kelvin_widget(icon)}</div></section>
    <section class="guide-block alt" id="parlaklik" aria-labelledby="g-lumen"><div class="container guide-split"><div><span class="eyebrow">02 · PARLAKLIK</span><h2 id="g-lumen">Watt değil, lümen.</h2><p>LED ampullerde watt harcanan enerjiyi, lümen ise verilen ışığı gösterir. Eski ampulünüzün yerine LED alırken kutudaki lümen değerini karşılaştırın.</p><p class="guide-tip">{icon('bulb')}<span>LED gücü markaya ve modele göre değişir. Watt değerleri yaklaşıktır; asıl ölçü lümendir.</span></p></div>
      <div class="lumen-table-wrap"><table class="lumen-table"><caption class="sr-only">Akkor ampul gücüne göre ışık miktarı ve LED karşılığı</caption><thead><tr><th scope="col">Eski akkor ampul</th><th scope="col">Işık miktarı</th><th scope="col">LED karşılığı</th></tr></thead><tbody>{lumen_rows}</tbody></table></div></div></section>
    <section class="guide-block" id="duy-tipleri" aria-labelledby="g-socket"><div class="container"><div class="section-head"><div><span class="eyebrow">03 · DUY TİPLERİ</span><h2 id="g-socket">Ampulün takıldığı yer.</h2></div><p>Yeni ampul almadan önce eskisinin duyuna bakın. Emin değilseniz ampulün fotoğrafı yeterli.</p></div><div class="socket-grid">{sockets}</div></div></section>
    <section class="guide-block alt" id="ip-koruma" aria-labelledby="g-ip"><div class="container"><div class="section-head"><div><span class="eyebrow">04 · IP KORUMA</span><h2 id="g-ip">Banyo ve dış mekân için IP sınıfı.</h2></div><p>İlk rakam katı cisimlere, ikinci rakam suya karşı koruma testini tanımlar. Montaj yeri ve maruz kalınacak koşullar birlikte değerlendirilmelidir.</p></div><div class="ip-grid">{ips}</div></div></section>
    <div class="container guide-reference">Genel bilgi kaynakları: <a href="https://www.lighting.philips.com.tr/consumer/led-lights/how-to-choose-a-led-bulb" target="_blank" rel="noopener">Philips LED ampul seçim rehberi</a> · <a href="https://www.iec.ch/ip-ratings" target="_blank" rel="noopener">IEC IP koruma sınıfları</a>. Uygulama ve montaj için ürün talimatını ve elektrik uzmanının değerlendirmesini esas alın.</div>
    {sections['spaces']}{process(icon)}'''
