"""Order UI shared by real pages and an isolated browser fixture, with no demo products."""
import json, re

def validate_products(records, dist):
    if not isinstance(records, list):
        raise ValueError('order-catalog.json must contain an array')
    seen=set()
    for record in records:
        if not isinstance(record, dict): raise ValueError('Each catalog item must be an object')
        key=record.get('id','')
        if not isinstance(key,str) or not re.fullmatch(r'[-a-zA-Z0-9_]{1,80}',key) or key in seen:
            raise ValueError('Catalog IDs must be unique and contain letters, digits, hyphens or underscores')
        seen.add(key)
        for field,limit in [('name',120),('brand',40),('code',40),('unit',15)]:
            value=record.get(field,'')
            if not isinstance(value,str) or len(value)>limit or any(ord(c)<32 for c in value):
                raise ValueError(f'{key}: invalid {field}')
        if not record.get('name','').strip(): raise ValueError(f'{key}: missing name')
        image=record.get('image','')
        if not isinstance(image,str) or not image.startswith('/assets/'):
            raise ValueError(f'{key}: image must be a local /assets/ path')
        target=(dist/image.lstrip('/')).resolve()
        if not target.is_relative_to((dist/'assets').resolve()) or not target.is_file():
            raise ValueError(f'{key}: image is missing or outside assets')
    return records

def order_markup(icon, products, phone, origin):
    data=json.dumps(products,ensure_ascii=False).replace('<','\\u003c').replace('>','\\u003e').replace('&','\\u0026')
    return f'''<script id="order-data" type="application/json">{data}</script>
    <dialog id="order-dialog" class="order-dialog" aria-labelledby="order-title" data-phone="{phone}" data-order-source="{origin}/urunler/">
      <div class="order-header"><div><h2 id="order-title">Sipariş listem</h2><p data-order-total>0 ürün kalemi</p></div><button type="button" class="order-close" data-order-close aria-label="Sipariş listesini kapat" autofocus>{icon('close')}</button></div>
      <div class="order-body"><div class="order-empty" data-order-empty>{icon('bag')}<h3>Listeniz henüz boş.</h3><p>Katalog yayınlandığında seçtiğiniz ürünler burada görünecek.</p><a href="/urunler/" class="button outline">Kataloğa git {icon('arrow')}</a></div>
      <div data-order-filled hidden><ul class="order-items" data-order-items></ul><label class="order-form-label" for="order-note">Sipariş notu <span>· İsteğe bağlı</span></label><textarea id="order-note" maxlength="500" rows="3" placeholder="Renk, ölçü veya diğer notlarınız"></textarea><details class="order-preview"><summary>WhatsApp mesajını önizle</summary><label class="sr-only" for="order-message">Sipariş mesajı</label><textarea id="order-message" readonly rows="6"></textarea></details><p class="order-disclaimer">Bu liste bir sipariş talebidir. Fiyat, bulunabilirlik ve teslimat WhatsApp görüşmesinde netleşir. Mesajı WhatsApp’ta siz gönderirsiniz.</p><div class="order-long" data-order-long hidden>Mesaj bağlantı için uzun. Özeti kopyalayıp <a href="https://wa.me/{phone}" target="_blank" rel="noopener noreferrer">WhatsApp’a yapıştırın</a>.</div><a id="order-send" class="button yellow order-send" target="_blank" rel="noopener noreferrer" aria-disabled="true">{icon('wa')} WhatsApp’a gönder {icon('up')}</a><div class="order-secondary"><button type="button" data-order-copy disabled>Özeti kopyala</button><button type="button" data-order-clear hidden>Listeyi temizle</button></div></div><p class="order-status" data-order-status role="status" aria-live="polite"></p></div>
    </dialog><template id="order-row"><li class="order-item"><div class="order-item-head"><div><h3 data-item-name></h3><p class="order-item-code" data-item-code></p></div><button type="button" class="order-remove" data-order-remove>Çıkar</button></div><div class="order-quantity"><button type="button" data-order-minus>−</button><input type="number" min="1" max="9999" step="1" inputmode="numeric"><button type="button" data-order-plus>+</button></div></li></template>'''

def loader_markup():
    return '''<div class="site-loader" id="site-loader"><div class="loader-inner"><div class="loader-brand">Ünüvar<span>AYDINLATMA</span></div><div class="loader-progress" role="progressbar" aria-label="İlk ekranın yüklenme durumu" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"></div><div class="loader-meta"><span data-load-status role="status">Hazırlanıyor.</span><span data-load-number aria-hidden="true">0%</span></div><button type="button" class="loader-skip" data-load-skip>Siteye geç</button></div></div>'''
