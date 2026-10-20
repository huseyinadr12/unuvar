"""Shared store content. Product groups follow what the store stocks; no prices, stock or reviews are claimed.
Guide content is general lighting knowledge (colour temperature, lumen, sockets, IP ratings), not store claims."""

# (title, description, icon, phrase used in the WhatsApp message)
PRODUCT_GROUPS = [
    ('Avize ve sarkıt', 'Salon, yemek masası ve giriş için tavan aydınlatmaları.', 'pendant', 'avize ve sarkıt modelleri'),
    ('Aplik', 'Koridor, yatak odası ve cephe için duvar armatürleri.', 'sconce', 'aplik modelleri'),
    ('Spot ve panel', 'Sıva altı ve sıva üstü spotlar, ofis tipi LED paneller.', 'downlight', 'spot ve panel armatürler'),
    ('LED ampul', 'Farklı duy tiplerinde ve ışık renklerinde ampuller.', 'bulb', 'LED ampuller'),
    ('Şerit LED', 'Gizli ışık, raf ve tavan detayları için şerit LED çözümleri.', 'strip', 'şerit LED ürünleri'),
    ('Lambader ve masa lambası', 'Okuma köşesi, çalışma masası ve komodin için.', 'floor', 'lambader ve masa lambaları'),
    ('Dış mekân', 'Bahçe armatürleri, projektörler ve cephe aydınlatması.', 'bollard', 'dış mekân aydınlatması'),
    ('Elektrik malzemesi', 'Anahtar, priz, kablo ve tesisat ihtiyaçları.', 'socket', 'elektrik malzemeleri'),
]

# (title, icon, advice, suggested product groups, WhatsApp phrase)
SPACES = [
    ('Salon ve oturma odası', 'sofa', 'Tek bir tavan ışığı yerine katmanlı düşünün: genel ışık için avize veya sarkıt, okuma köşesine lambader, duvarlara aplik. 2700K ile 3000K arası sıcak beyaz rahat bir ortam verir.', ['Avize', 'Lambader', 'Aplik'], 'salonum'),
    ('Mutfak', 'kitchen', 'Tezgâhta gölgesiz çalışmak için üst dolap altına şerit LED, genel ışık için spot veya panel. 3000K ile 4000K arası renkler yemeği doğal gösterir.', ['Şerit LED', 'Spot', 'Panel'], 'mutfağım'),
    ('Banyo', 'drop', 'Nemli alanda en az IP44 korumalı armatür seçin. Ayna çevresinde yüzü eşit aydınlatan aplik veya şerit LED işe yarar.', ['IP44 aplik', 'Spot', 'Şerit LED'], 'banyom'),
    ('Çalışma odası ve ofis', 'desk', 'Odaklanmak için 4000K nötr beyaz ve göz kamaştırmayan panel veya spot. Masada ayrıca yönlendirilebilir bir masa lambası.', ['Panel', 'Spot', 'Masa lambası'], 'çalışma alanım'),
    ('Mağaza ve vitrin', 'shop', 'Ürünü öne çıkarmak için yönlendirilebilir spot veya ray spot. Renk sunumu (CRI) 90 ve üzeri ışık, ürün renklerini doğru gösterir.', ['Ray spot', 'Panel', 'Şerit LED'], 'iş yerim'),
    ('Bahçe, balkon ve cephe', 'tree', 'Yağmur alan yerlerde en az IP65. Yol ve bahçe kenarında alçak armatür, cephede projektör veya dış mekân apliği.', ['IP65 aplik', 'Projektör', 'Bahçe armatürü'], 'dış mekânım'),
]

# (id, kelvin, name, swatch colour, description, where)
KELVINS = [
    ('k2700', '2700K', 'Sıcak beyaz', '#ffb46b', 'Eski akkor ampule en yakın, sarımsı ve dinlendirici ışık.', 'Yatak odası, salon, restoran'),
    ('k3000', '3000K', 'Sıcak beyaz', '#ffc787', 'Biraz daha temiz ama hâlâ sıcak. Evin hemen her yerinde rahat kullanılır.', 'Salon, mutfak, otel ve kafe'),
    ('k4000', '4000K', 'Nötr beyaz', '#ffe2bf', 'Gün ışığına yakın, net bir ışık. Ayrıntıyı görmeniz gereken yerler için.', 'Ofis, mutfak tezgâhı, banyo, mağaza'),
    ('k6500', '6500K', 'Soğuk beyaz', '#e6eeff', 'Mavimsi ve keskin. Evde yorucu olabilir, teknik alanlarda tercih edilir.', 'Depo, atölye, otopark'),
]


def kelvin_widget(icon):
    inputs = ''.join(f'<input type="radio" name="kelvin" id="{kid}" value="{k}" {"checked" if i == 0 else ""}><label for="{kid}" style="--swatch:{sw}"><b>{k}</b><small>{name}</small></label>' for i, (kid, k, name, sw, _, _) in enumerate(KELVINS))
    descs = ''.join(f'<div class="k-desc" data-for="{kid}"><h3>{k} · {name}</h3><p>{desc}</p><p class="k-where">{icon("pin")} {where}</p></div>' for kid, k, name, _, desc, where in KELVINS)
    return f'''<div class="kelvin"><div class="kelvin-stage" aria-hidden="true"><span class="k-glow"></span><span class="k-cord"></span><span class="k-shade"></span><span class="k-beam"></span><span class="k-table"></span></div>
      <div class="kelvin-panel"><fieldset class="kelvin-picker"><legend>Bir ışık rengi seçin</legend><div class="kelvin-options">{inputs}</div></fieldset><div class="kelvin-info">{descs}</div></div></div>'''


def presentation_sections(icon, out, wa, instagram, facebook):
    cards = ''.join(
        out(wa(f'Merhaba Ünüvar Aydınlatma, {phrase} hakkında bilgi almak istiyorum.'),
            f'<span class="range-icon">{icon(symbol)}</span><span class="range-name">{title}</span><span class="range-desc">{desc}</span><span class="range-ask">WhatsApp’tan sor {icon("up")}</span>',
            'range-card')
        for title, desc, symbol, phrase in PRODUCT_GROUPS)

    def product_range(heading_level='h2', title='Mağazada neler var?'):
        return f'''<section class="range-section" id="urun-gruplari" aria-labelledby="range-title"><div class="container">
      <div class="section-head"><div><span class="eyebrow">ÜRÜN GRUPLARI</span><{heading_level} id="range-title">{title}</{heading_level}></div><p><a href="/urunler/#katalog">Dijital kataloğumuzu inceleyin.</a> Aradığınız ürünün güncel fiyat ve stok bilgisini WhatsApp’tan alabilirsiniz.</p></div>
      <div class="range-grid">{cards}</div>
    </div></section>'''

    space_cards = ''.join(f'''<article class="space-card"><div class="space-top"><span class="space-icon">{icon(symbol)}</span><span class="space-index">0{i + 1}</span></div><h3>{title}</h3><p>{advice}</p><ul class="space-tags">{''.join(f'<li>{tag}</li>' for tag in tags)}</ul>{out(wa(f'Merhaba Ünüvar Aydınlatma, {phrase} için aydınlatma önerisi almak istiyorum.'), 'Bu alan için öneri alın '+icon('up'), 'text-link')}</article>''' for i, (title, symbol, advice, tags, phrase) in enumerate(SPACES))
    spaces = f'''<section class="spaces-section" id="mekanlar" aria-labelledby="spaces-title"><div class="container">
      <div class="section-head"><div><span class="eyebrow">MEKÂNA GÖRE IŞIK</span><h2 id="spaces-title">Hangi alana ne lazım?</h2></div><p>Her odanın ihtiyacı farklı. Aşağıdaki önerilerle başlayın, mekânınızın fotoğrafını gönderirseniz birlikte netleştirelim.</p></div>
      <div class="spaces-grid">{space_cards}</div>
    </div></section>'''

    guide_teaser = f'''<section class="guide-teaser" aria-labelledby="kelvin-title"><div class="container">
      <div class="section-head"><div><span class="eyebrow">IŞIK REHBERİ</span><h2 id="kelvin-title">Işığın rengi, mekânın havasını değiştirir.</h2></div><p>Ampul kutusundaki “K” değeri ışığın rengini gösterir. Seçenekleri deneyin, farkı görün.</p></div>
      {kelvin_widget(icon)}
      <div class="guide-links"><a class="guide-link" href="/rehber/#parlaklik"><b>Watt değil lümen</b><span>Eski ampulünüzün LED karşılığı</span>{icon('arrow')}</a><a class="guide-link" href="/rehber/#duy-tipleri"><b>Duy tipleri</b><span>E27, E14, GU10 ve diğerleri</span>{icon('arrow')}</a><a class="guide-link" href="/rehber/#ip-koruma"><b>IP koruma sınıfı</b><span>Banyo ve dış mekân için</span>{icon('arrow')}</a></div>
    </div></section>'''

    ask = f'''<section class="ask-section" aria-labelledby="ask-title"><div class="container ask-grid">
      <div class="ask-copy"><span class="eyebrow">FOTOĞRAFLA SOR</span><h2 id="ask-title">Fotoğrafını gönderin,<br/><span class="glow">birlikte bulalım.</span></h2><p>Yanan bir ampul, eşi aranan bir spot ya da beğendiğiniz bir avize. Ürünün fotoğrafını veya kodunu WhatsApp’tan iletin, mağazamızda uygun ürün olup olmadığını size bildirelim.</p>
      <ol class="ask-steps"><li><span class="step-number" aria-hidden="true">1</span><div><h3>Fotoğraf veya kod gönderin</h3><p>Ürünün kendisi, kutusu ya da üzerindeki etiket yeterli.</p></div></li><li><span class="step-number" aria-hidden="true">2</span><div><h3>Fiyat ve stok bilgisini alın</h3><p>Uygun seçenekleri fiyat ve bulunabilirlik bilgisiyle iletelim.</p></div></li><li><span class="step-number" aria-hidden="true">3</span><div><h3>Mağazadan alın</h3><p>Ürünü Karaköy’deki mağazamızda görüp yerinde alabilirsiniz.</p></div></li></ol></div>
      <div class="ask-card"><div class="chat-top">{icon('wa')}<span><strong>Ünüvar Aydınlatma</strong><small>WhatsApp</small></span></div><div class="chat-body"><span class="chat-label">Örnek mesaj</span><div class="chat-bubble"><span class="chat-photo">{icon('camera')}<small>spot.jpg</small></span><p>Merhaba, fotoğraftaki spotun aynısından 6 adet lazım. Mağazada var mı?</p></div></div>{out(wa('Merhaba Ünüvar Aydınlatma, bir ürün hakkında bilgi almak istiyorum. Fotoğrafını gönderiyorum:'),icon('wa')+' WhatsApp’ta yazın','button yellow chat-send')}</div>
    </div></section>'''

    questions = [
        ('Online sipariş verebilir miyim?', f'<a href="/urunler/#katalog">Dijital katalogdan</a> beğendiğiniz ürünün kodunu bize iletebilirsiniz. Güncel fiyat, stok ve sipariş koşullarını {out(wa(),"WhatsApp üzerinden")} ya da <a href="tel:+905456105009">0545 610 50 09</a> numaralı telefondan öğrenebilirsiniz. Site üzerinden ödeme alınmaz.'),
        ('Elimdeki ürünün aynısını bulabilir misiniz?', 'Ürünün ya da kutusunun fotoğrafını, varsa üzerindeki kodu gönderin. Mağazamızda aynısı veya uygun bir seçenek olup olmadığını size bildirelim.'),
        ('Hangi ışık rengini seçmeliyim?', 'Dinlenme alanları için 2700K ile 3000K arası sıcak beyaz, mutfak tezgâhı, banyo ve çalışma alanı için 4000K nötr beyaz uygundur. Ayrıntılar <a href="/rehber/#isik-rengi">Işık rehberimizde</a>.'),
        ('Eski ampulümün LED karşılığı kaç watt?', 'Karşılaştırırken watt yerine lümene bakın. 60W akkor ampulün ışığı yaklaşık 806 lümendir ve bunu genellikle 8 ile 9W arası bir LED ampul karşılar. <a href="/rehber/#parlaklik">Tablonun tamamı</a>'),
        ('Banyo ve dış mekân için nelere dikkat etmeliyim?', 'Armatürün IP koruma sınıfına bakın: banyo için en az IP44, yağmur alan dış mekân için en az IP65. <a href="/rehber/#ip-koruma">IP sınıflarını inceleyin</a>.'),
        ('Mağazaya gelmeden önce aramalı mıyım?', 'Aradığınız ürün belliyse yola çıkmadan önce stok durumunu sormanızı öneririz. Ziyaret saatinizi de aynı numaradan teyit edebilirsiniz.'),
        ('Mağaza tam olarak nerede?', 'Karaköy’de, Emekyemez Mahallesi Tutsak Sokak No:8, Beyoğlu / İstanbul. Yol tarifi ve harita için <a href="/iletisim/#magaza-konumu">İletişim sayfamıza</a> bakabilirsiniz.'),
    ]
    rows = ''.join(f'<details class="question" {"open" if i == 0 else ""}><summary><span>{question}</span><span class="question-toggle" aria-hidden="true"></span></summary><div class="question-answer"><p>{answer}</p></div></details>' for i, (question, answer) in enumerate(questions))
    faq = f'''<section class="faq-section" id="sorular" aria-labelledby="questions-title"><div class="container faq-grid"><div class="faq-intro"><span class="eyebrow">SIK SORULANLAR</span><h2 id="questions-title">Aklınıza takılanlar</h2><p>Cevabını bulamadığınız bir soru varsa bize yazın.</p>{out(wa(),'WhatsApp’tan sorun '+icon('up'),'text-link')}</div><div class="faq-list">{rows}</div></div></section>'''

    social = f'''<section class="follow-section" aria-labelledby="follow-title"><div class="container follow-inner"><div><span class="eyebrow">SOSYAL MEDYA</span><h2 id="follow-title">Mağazamızı takip edin.</h2></div><div class="follow-links">{out(instagram,'<span>Instagram<small>@unuvar.aydinlatma</small></span>'+icon('up'),'follow-link')}{out(facebook,'<span>Facebook<small>Ünüvar Elektrik ve Aydınlatma</small></span>'+icon('up'),'follow-link')}</div></div></section>'''
    return dict(range=product_range, spaces=spaces, guide_teaser=guide_teaser, ask=ask, faq=faq, social=social)
