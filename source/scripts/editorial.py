"""Visual merchandising with source-catalog imagery and real enquiry links."""
from pathlib import Path
from html import escape as e
from urllib.parse import quote
import json

ROOT=Path(__file__).resolve().parents[1]

def data():
    return json.loads((ROOT/"data/catalog.json").read_text(encoding="utf-8"))

def picture(s,cls="",priority=False):
    if s.get("studio"): cls += " studio-product"
    return f'<img class="{cls}" src="{s["image"]}" width="{s["width"]}" height="{s["height"]}" alt="{e(s["title"])}" '+('fetchpriority="high"' if priority else 'loading="lazy" decoding="async"')+'>'

def collection_grid(icon,full=False):
    catalog=data()
    ids=["dekoratif-lineer","lineer-siva-ustu","artline-aplik","bahce"]
    entries=catalog["sections"] if full else [next(s for s in catalog["sections"] if s["id"]==slug) for slug in ids]
    descriptions={
      "dekoratif-lineer":"Formun gücü, ışığın etkisi.",
      "lineer-siva-ustu":"Mekânı takip eden yalın çizgiler.",
      "artline-aplik":"Duvarlara karakter katan detaylar.",
      "bahce":"Peyzajı gece yeniden keşfedin."}
    cards="".join(f'''<a class="collection-card" href="/urunler/#sayfa-{s["start"]}" data-collection-family="{s["family"]}" data-collection-name="{e(s["title"])}">
    <div class="collection-image">{picture(s)}<span class="collection-number">{i+1:02d}</span><span class="collection-arrow">{icon("up")}</span></div>
    <div class="collection-caption"><h3>{e(s["title"])}</h3><span>{f'Sayfa {s["start"]:02d}–{s["end"]:02d}' if full else descriptions[s["id"]]}</span>{'<small class="media-retouched">Temsili stüdyo görseli</small>' if s.get("studio") else ('<small class="media-retouched">Dijital olarak düzenlenmiş kullanım örneği</small>' if s.get("retouched") else "")}</div></a>''' for i,s in enumerate(entries))
    controls='''<div class="collection-controls" data-collection-controls hidden>
      <div class="collection-filters" role="group" aria-label="Koleksiyon türü">
      <button type="button" data-family="all" aria-pressed="true">Tümü</button><button type="button" data-family="mimari" aria-pressed="false">Mimari lineer</button><button type="button" data-family="dekoratif" aria-pressed="false">Dekoratif</button><button type="button" data-family="ic" aria-pressed="false">İç mekân</button><button type="button" data-family="dis" aria-pressed="false">Dış mekân & teknik</button></div>
      <label class="collection-search">Ürün grubu ara<input type="search" placeholder="Örn. sarkıt, bahçe, spot" data-collection-search maxlength="80"></label>
      <p class="collection-count" data-collection-count role="status" aria-live="polite">19 koleksiyon</p></div>''' if full else ""
    return f'''<section class="collections-section" id="koleksiyonlar" aria-labelledby="collections-title"><div class="container">
    <div class="section-head"><div><span class="eyebrow">KOLEKSİYONLAR</span><h2 id="collections-title">Işığın farklı hâlleri.</h2></div><p>{"İlgilendiğiniz ürün grubunu seçin; katalogda ilgili bölüme doğrudan ulaşın." if full else "Mimari çizgilerden dekoratif formlara. Mekânınıza uygun seçeneği görerek keşfedin."}</p></div>
    {controls}<div class="collections-grid {"collections-all" if full else ""}">{cards}</div>
    {'<p class="collection-empty" data-collection-empty hidden>Bu aramada ürün grubu bulunamadı. Farklı bir kelime deneyin veya filtreyi “Tümü” olarak değiştirin.</p>' if full else '<a class="text-link collections-more" href="/urunler/#koleksiyonlar">19 ürün grubunun tamamını keşfedin '+icon("arrow")+'</a>'}
    </div></section>'''

def featured(icon,full=False):
    products=json.loads((ROOT/"data/editorial-products.json").read_text(encoding="utf-8"))
    codes=["AS5002","AS5206","AS5211","AS5402"]
    entries=products if full else [next(p for p in products if p["code"]==code) for code in codes]
    cards=[]
    for p in entries:
        url=f'/b2c/?urun={quote(p["code"])}#talep-listesi'
        cards.append(f'''<article class="selection-card"><a href="/urunler/#sayfa-{p["page"]}" class="selection-photo" aria-label="{e(p["code"])} katalog detaylarını incele"><img src="{p["web_image"]}" width="{p["image_width"]}" height="{p["image_height"]}" alt="{e(p["code"])} Artline aydınlatma" loading="lazy" decoding="async"></a>
        <div class="selection-title"><h3>{e(p["code"])}</h3><span>{p["power"]} W</span></div>
        <p>{'Artline sarkıt' if p["source_page"]<22 else ('Artline aplik' if p["source_page"]<25 else 'Artline lambader')}</p>
        <a class="text-link" href="{url}">Talep listesine ekleyin {icon("up")}</a></article>''')
    return f'''<section class="selection-section" aria-labelledby="selection-title"><div class="container">
    <div class="section-head"><div><span class="eyebrow">KOLEKSİYONDAN SEÇKİ</span><h2 id="selection-title">Bir detay, bambaşka bir atmosfer.</h2></div><a class="text-link" href="/urunler/#sayfa-{next(s for s in data()["sections"] if s["id"]=="artline-sarkit")["start"]}">Artline koleksiyonuna bakın {icon("arrow")}</a></div>
    <div class="selection-grid">{"".join(cards)}</div><p class="selection-note">Ürün görselleri dijital olarak düzenlenmiş temsili stüdyo görselleridir. Güncel fiyat, renk seçenekleri ve stok bilgisini ürün koduyla öğrenebilirsiniz.</p></div></section>'''

def process(icon):
    return f'''<section class="project-section"><div class="container project-grid"><div class="project-intro"><span class="eyebrow">BİRLİKTE SEÇELİM</span><h2>Fikrinizi anlatın.<br><em>Işığını birlikte bulalım.</em></h2><p>Tek bir armatür ya da birden çok alan için ürün arıyor olabilirsiniz. Kod, adet ve mekân bilgisiyle başlayın.</p><a class="button yellow" href="/iletisim/#teklif">Fiyat ve ürün bilgisi isteyin {icon("arrow")}</a></div><ol class="project-steps">
    <li><span>01</span><div><h3>Seçiminizi paylaşın</h3><p>Katalogdan bir ürün kodu seçin veya aradığınız ürünün fotoğrafını hazırlayın.</p></div></li>
    <li><span>02</span><div><h3>Detayları netleştirelim</h3><p>Ölçü, adet, gövde rengi, ışık rengi ve kullanım alanını birlikte değerlendirelim.</p></div></li>
    <li><span>03</span><div><h3>Bilgi alarak karar verin</h3><p>Güncel fiyat, stok ve teslim koşullarını öğrenin; mağazamızla görüşerek ilerleyin.</p></div></li></ol></div></section>'''

def quote_form(icon,out,wa):
    return f'''<section class="quote-section" id="teklif" aria-labelledby="quote-title"><div class="container quote-grid">
    <div><span class="eyebrow">ÜRÜN VE FİYAT TALEBİ</span><h2 id="quote-title">Aklınızdaki ışığa<br>bir adım daha yakın.</h2><p class="quote-intro">İlgilendiğiniz ürünü veya mekânınızın ihtiyacını paylaşın. Mesajınızı hazırlayın, WhatsApp üzerinden mağazamıza iletin.</p><div class="quote-help"><h3>Henüz bir ürün seçmediniz mi?</h3><p>Yalnızca kullanım alanını ve ihtiyacınızı yazabilirsiniz. Fotoğrafı açılan WhatsApp sohbetine ekleyebilirsiniz.</p><a class="text-link" href="/urunler/">Koleksiyona göz atın {icon("arrow")}</a></div><p class="quote-note">Talep oluşturmak bir satın alma veya ödeme işlemi başlatmaz. Fiyat, stok ve sipariş koşulları görüşme sırasında netleşir.</p></div>
    <div class="quote-form"><form data-quote-form><div class="quote-fields">
      <label>Ürün kodu <span>(varsa)</span><input name="code" maxlength="80" autocomplete="off" placeholder="Örn. AS5002"></label>
      <label>Adet <span>(varsa)</span><input name="quantity" type="number" min="1" max="100000" step="1" inputmode="numeric" placeholder="Örn. 6"></label>
      <label>Kullanım alanı<select name="space"><option value="">Seçin</option><option>Ev / yaşam alanı</option><option>Ofis / çalışma alanı</option><option>Mağaza / vitrin</option><option>Kafe / restoran / otel</option><option>Bahçe / cephe / dış mekân</option><option>Teknik alan / depo</option><option>Diğer</option></select></label>
      <label>Katalog sayfası <span>(varsa)</span><input name="page" type="number" min="1" max="{data()["page_count"]}" inputmode="numeric" placeholder="Sayfa numarası"></label>
      <label class="quote-wide">İhtiyacınız ve tercihleriniz<textarea name="note" rows="3" maxlength="700" placeholder="Ölçü, gövde rengi, ışık rengi veya aradığınız ürün…"></textarea></label>
    </div><div class="quote-preview"><span>MESAJ ÖNİZLEMESİ</span><p data-quote-preview>Merhaba Ünüvar Aydınlatma, aydınlatma ürünleri hakkında fiyat ve stok bilgisi almak istiyorum.</p></div>
    <button type="submit" class="button yellow quote-submit" data-quote-submit hidden>{icon("wa")} WhatsApp’ta talebi aç {icon("up")}</button></form>
    <noscript>{out(wa("Merhaba Ünüvar Aydınlatma, fiyat ve ürün bilgisi almak istiyorum."),"WhatsApp’tan bilgi alın","button yellow")}</noscript>
    <p class="composer-note">Mesajı WhatsApp içinde siz gönderirsiniz. Bu formdaki bilgiler siteye kaydedilmez.</p></div></div></section>'''

def homepage(icon,out,wa,photo,brands,sections,location,catalog_teaser):
    return f'''<section class="editorial-hero"><div class="container editorial-hero-grid">
      <div class="editorial-hero-copy"><span class="eyebrow">ÜNÜVAR AYDINLATMA · KARAKÖY</span><h1>Işıkla değişen<br><em>mekânlar.</em></h1><p>Yalın bir çizgi, güçlü bir form, doğru bir vurgu. Eviniz ve iş yeriniz için aydınlatma seçeneklerini keşfedin.</p>
      <div class="hero-actions"><a class="button yellow" href="/urunler/#koleksiyonlar">Koleksiyonu keşfedin {icon("arrow")}</a><a class="text-link" href="/iletisim/#teklif">İhtiyacınızı paylaşın {icon("up")}</a></div>
      <div class="hero-footnote"><span>KEŞFET</span><p>Dekoratif formlardan<br>mimari aydınlatmaya.</p><a href="#koleksiyonlar" aria-label="Koleksiyonlara ilerle">↓</a></div></div>
      <figure class="editorial-hero-image"><img src="/assets/collection/hero-v2.webp" width="971" height="1619" alt="Dekoratif halka sarkıtların yer aldığı, dijital olarak düzenlenmiş iç mekân örneği" fetchpriority="high"><figcaption><span>DİJİTAL OLARAK DÜZENLENMİŞ KULLANIM ÖRNEĞİ</span><b>Işık. Form. Atmosfer.</b></figcaption></figure>
    </div></section>
    <div class="service-line"><div class="container"><span>19 ürün grubu</span><span>{data()["page_count"]} sayfalık dijital katalog</span><span>Ürün koduyla fiyat ve stok bilgisi</span><a href="/iletisim/#magaza-konumu">Karaköy’de mağaza {icon("up")}</a></div></div>
    {collection_grid(icon)}
    {featured(icon)}
    <section class="atmosphere-section"><div class="container atmosphere-grid"><figure><img src="/assets/collection/interior-v2.webp" width="1419" height="1108" alt="Pürüzsüz duvar üzerinde dekoratif aplik ve sarkıt kullanım örneği" loading="lazy"><figcaption>Dijital olarak düzenlenmiş kullanım örneği</figcaption></figure><div><span class="eyebrow">MEKÂNINIZDAN BAŞLAYIN</span><h2>Her alanın<br><em>bir ışığı var.</em></h2><p>Bir ürünü beğenmek ilk adım. Kullanım alanı, montaj şekli, ışık rengi ve ölçü ise seçimi tamamlar.</p><div class="space-links"><a href="/urunler/?grup=dekoratif#koleksiyonlar">Ev ve yaşam alanları {icon("arrow")}</a><a href="/urunler/?grup=mimari#koleksiyonlar">Ofis ve mimari alanlar {icon("arrow")}</a><a href="/urunler/?grup=ic#koleksiyonlar">Mağaza ve vitrin {icon("arrow")}</a><a href="/urunler/?grup=dis#koleksiyonlar">Bahçe ve dış mekân {icon("arrow")}</a></div></div></div></section>
    {process(icon)}{catalog_teaser(icon)}{brands()}
    <section class="b2b-home-promo"><div class="container"><div><span class="eyebrow">B2C · SİZİN İÇİN AYDINLATMA</span><h2>Seçimlerinizi tek listede buluşturun.</h2><p>Salonunuz, yemek alanınız veya evinizin tamamı için beğendiğiniz ürünleri seçin. Adetleri belirleyin; fiyat, renk seçenekleri ve teslim bilgisini tek mesajla öğrenin.</p><a class="button yellow" href="/b2c/">B2C alışveriş listemi oluştur {icon("arrow")}</a></div><ol><li>52 Artline ürününden seçin</li><li>Kodla toplu ürün ekleyin</li><li>Özeti indirin veya WhatsApp'ta iletin</li></ol></div></section>
    <section class="guide-short"><div class="container"><div><span class="eyebrow">PROJE ÇÖZÜMLERİ</span><h2>Her mekân için<br>farklı bir başlangıç.</h2></div><div class="guide-short-links"><a href="/cozumler/#cozum-01"><span>01</span><b>Konut ve yaşam</b><small>Dekoratif formlar, kişisel atmosfer</small>{icon("arrow")}</a><a href="/cozumler/#cozum-02"><span>02</span><b>Ofis ve ticari alanlar</b><small>İşlev, yerleşim ve ürün seçimi</small>{icon("arrow")}</a><a href="/cozumler/#cozum-05"><span>03</span><b>Dış mekân ve teknik alanlar</b><small>Ortam koşullarıyla uyumlu seçim</small>{icon("arrow")}</a></div></div></section>
    {sections["faq"]}{location()}'''
