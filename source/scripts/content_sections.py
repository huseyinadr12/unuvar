"""Shared store content. Product groups follow what the store stocks; no prices, stock or reviews are claimed."""

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


def presentation_sections(icon, out, wa, instagram, facebook):
    cards = ''.join(
        out(wa(f'Merhaba Ünüvar Aydınlatma, {phrase} hakkında bilgi almak istiyorum.'),
            f'<span class="range-icon">{icon(symbol)}</span><span class="range-name">{title}</span><span class="range-desc">{desc}</span><span class="range-ask">WhatsApp’tan sor {icon("up")}</span>',
            'range-card')
        for title, desc, symbol, phrase in PRODUCT_GROUPS)

    def product_range(heading_level='h2', title='Mağazada neler var?'):
        return f'''<section class="range-section" id="urun-gruplari" aria-labelledby="range-title"><div class="container">
      <div class="section-head"><div><span class="eyebrow">ÜRÜN GRUPLARI</span><{heading_level} id="range-title">{title}</{heading_level}></div><p>Online katalog hazırlanıyor. Bu sırada aradığınız ürünün fiyat ve stok bilgisini WhatsApp’tan hızlıca alabilirsiniz.</p></div>
      <div class="range-grid">{cards}</div>
    </div></section>'''

    ask = f'''<section class="ask-section" aria-labelledby="ask-title"><div class="container ask-grid">
      <div class="ask-copy"><span class="eyebrow">FOTOĞRAFLA SOR</span><h2 id="ask-title">Fotoğrafını gönderin,<br/><span class="glow">birlikte bulalım.</span></h2><p>Yanan bir ampul, eşi aranan bir spot ya da beğendiğiniz bir avize. Ürünün fotoğrafını veya kodunu WhatsApp’tan iletin, mağazamızda uygun ürün olup olmadığını size bildirelim.</p>
      <ol class="ask-steps"><li><span class="step-number" aria-hidden="true">1</span><div><h3>Fotoğraf veya kod gönderin</h3><p>Ürünün kendisi, kutusu ya da üzerindeki etiket yeterli.</p></div></li><li><span class="step-number" aria-hidden="true">2</span><div><h3>Fiyat ve stok bilgisini alın</h3><p>Uygun seçenekleri fiyat ve bulunabilirlik bilgisiyle iletelim.</p></div></li><li><span class="step-number" aria-hidden="true">3</span><div><h3>Mağazadan alın</h3><p>Ürünü Karaköy’deki mağazamızda görüp yerinde alabilirsiniz.</p></div></li></ol></div>
      <div class="ask-card"><div class="chat-top">{icon('wa')}<span><strong>Ünüvar Aydınlatma</strong><small>WhatsApp</small></span></div><div class="chat-body"><span class="chat-label">Örnek mesaj</span><div class="chat-bubble"><span class="chat-photo">{icon('camera')}<small>spot.jpg</small></span><p>Merhaba, fotoğraftaki spotun aynısından 6 adet lazım. Mağazada var mı?</p></div></div>{out(wa('Merhaba Ünüvar Aydınlatma, bir ürün hakkında bilgi almak istiyorum. Fotoğrafını gönderiyorum:'),icon('wa')+' WhatsApp’ta yazın','button yellow chat-send')}</div>
    </div></section>'''

    questions = [
        ('Online sipariş verebilir miyim?', f'Online katalog hazırlanıyor. Şimdilik ürün, fiyat ve stok bilgisini {out(wa(),"WhatsApp üzerinden")} ya da <a href="tel:+905456105009">0545 610 50 09</a> numaralı telefondan alabilirsiniz.'),
        ('Elimdeki ürünün aynısını bulabilir misiniz?', 'Ürünün ya da kutusunun fotoğrafını, varsa üzerindeki kodu gönderin. Mağazamızda aynısı veya uygun bir seçenek olup olmadığını size bildirelim.'),
        ('Mağazaya gelmeden önce aramalı mıyım?', 'Aradığınız ürün belliyse yola çıkmadan önce stok durumunu sormanızı öneririz. Ziyaret saatinizi de aynı numaradan teyit edebilirsiniz.'),
        ('Mağaza tam olarak nerede?', 'Karaköy’de, Emekyemez Mahallesi Tutsak Sokak No:8, Beyoğlu / İstanbul. Yol tarifi ve harita için <a href="/iletisim/#magaza-konumu">İletişim sayfamıza</a> bakabilirsiniz.'),
    ]
    rows = ''.join(f'<details class="question" {"open" if i == 0 else ""}><summary><span>{question}</span><span class="question-toggle" aria-hidden="true"></span></summary><div class="question-answer"><p>{answer}</p></div></details>' for i, (question, answer) in enumerate(questions))
    faq = f'''<section class="faq-section" id="sorular" aria-labelledby="questions-title"><div class="container faq-grid"><div class="faq-intro"><span class="eyebrow">SIK SORULANLAR</span><h2 id="questions-title">Aklınıza takılanlar</h2><p>Cevabını bulamadığınız bir soru varsa bize yazın.</p>{out(wa(),'WhatsApp’tan sorun '+icon('up'),'text-link')}</div><div class="faq-list">{rows}</div></div></section>'''

    social = f'''<section class="follow-section" aria-labelledby="follow-title"><div class="container follow-inner"><div><span class="eyebrow">SOSYAL MEDYA</span><h2 id="follow-title">Mağazamızı takip edin.</h2></div><div class="follow-links">{out(instagram,'<span>Instagram<small>@unuvar.aydinlatma</small></span>'+icon('up'),'follow-link')}{out(facebook,'<span>Facebook<small>Ünüvar Elektrik ve Aydınlatma</small></span>'+icon('up'),'follow-link')}</div></div></section>'''
    return dict(range=product_range, ask=ask, faq=faq, social=social)
