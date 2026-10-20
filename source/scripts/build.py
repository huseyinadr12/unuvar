from pathlib import Path
import json, html, urllib.parse, hashlib
from seo import metadata, robots
from order_markup import order_markup, validate_products
from content_sections import presentation_sections, kelvin_widget
from inner_pages import about_page, contact_page, guide_page
from catalog_markup import catalog_page, catalog_teaser
from editorial import homepage, collection_grid, process, quote_form, data as catalog_manifest
from b2b import b2b_page, solutions_page

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
ORIGIN = 'https://unuvar-aydinlatma.brown-heron-0230.chatgpt.site'
BRANDS = json.loads((ROOT / 'data/brands.json').read_text(encoding='utf-8'))
MEDIA = json.loads((ROOT / 'data/media.json').read_text(encoding='utf-8'))
PHONE = '905456105009'
ORDER_PRODUCTS = validate_products(json.loads((ROOT / 'data/order-catalog.json').read_text(encoding='utf-8')), DIST)
HEAD_JS = (DIST / 'assets/navigation-head.js').read_text(encoding='utf-8')
INTRO_JS = (DIST / 'assets/intro-head.js').read_text(encoding='utf-8')
# Çalışma saatleri teyit edildiğinde doldurun, örn. [('Pazartesi - Cumartesi', '09:00 - 19:00'), ('Pazar', 'Kapalı')]
HOURS = []
IG = 'https://www.instagram.com/unuvar.aydinlatma/'
FB = 'https://www.facebook.com/p/%C3%9Cn%C3%BCvar-Elektrik-VE-Aydinlatma-100089000323477/'
BUSINESS_MAP = 'https://www.google.com/maps/place/%C3%9Cn%C3%BCvar+Ayd%C4%B1nlatma+Elektrik/@41.0262442,28.9710587,17z/data=!3m1!4b1!4m6!3m5!1s0x14cab9f6e7d1a36d:0xfa8c9bd37519d265!8m2!3d41.0262442!4d28.9710587!16s%2Fg%2F11vcmwg5yl'
MAP_EMBED = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3009.9548282147616!2d28.9710587!3d41.0262442!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14cab9f6e7d1a36d%3A0xfa8c9bd37519d265!2zw5xuw7x2YXIgQXlkxLFubGF0bWEgRWxla3RyaWs!5e0!3m2!1str!2str!4v1791981731667!5m2!1str!2str'
MAP = 'https://www.google.com/maps/dir/?api=1&destination=41.0262442%2C28.9710587'

def bundle(filename, parts):
    content = '\n'.join((DIST / 'assets' / part).read_text(encoding='utf-8').replace('@charset "UTF-8";', '') for part in parts)
    (DIST / 'assets' / filename).write_text(content, encoding='utf-8')
    return '/assets/' + filename + '?v=' + hashlib.sha256(content.encode()).hexdigest()[:12]

def asset_url(name):
    return '/assets/' + name + '?v=' + hashlib.sha256((DIST/'assets'/name).read_bytes()).hexdigest()[:12]

CSS = bundle('app.css', ['site.css', 'orders.css', 'catalog.css', 'transitions.css', 'editorial.css', 'refinements.css'])
JS = bundle('app.js', ['site.js', 'motion.js', 'contact.js', 'order-core.js', 'orders.js', 'editorial.js'])
CATEGORIES = {
    'panel-spot': ('Panel ve spot', 'İhtiyacınız olan ışık, sade bir görünüm.', 'spot'),
    'dekoratif-led': ('Dekoratif LED', 'Mekânınızın çizgilerini ışıkla vurgulayın.', 'spark'),
    'masa-lambalari': ('Masa lambaları', 'Çalışırken, okurken, kendinize vakit ayırırken.', 'lamp'),
    'led-ampuller': ('LED ampuller', 'Günlük ihtiyaçlarınıza uygun ışığı bulun.', 'bulb'),
}
ICONS = {
    'download':'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
    'bag':'<path d="M5 7h14l1 14H4L5 7Z"/><path d="M9 8V5a3 3 0 0 1 6 0v3"/>',
    'arrow':'<path d="M5 12h14M13 6l6 6-6 6"/>',
    'up':'<path d="M6 18 18 6M6 6h12v12"/>',
    'search':'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>',
    'phone':'<path d="M8 3 4 4c-2 9 7 18 16 16l1-4-5-2-2 2a15 15 0 0 1-6-6l2-2-2-5Z"/>',
    'pin':'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z"/><circle cx="12" cy="10" r="2.4"/>',
    'wa':'<path d="M20 11.5a8 8 0 0 1-12 7l-5 1 1-5a8 8 0 1 1 16-3Z"/><path d="m8 7 1.5 2-1 1a9 9 0 0 0 4.5 4.5l1-1 2 1.5"/>',
    'menu':'<path d="M4 7h16M4 12h16M4 17h16"/>',
    'close':'<path d="m6 6 12 12M6 18 18 6"/>',
    'bulb':'<path d="M9 18h6m-6 3h6m-6-6c0-3-4-3-4-7a7 7 0 0 1 14 0c0 4-4 4-4 7v1H9Z"/>',
    'spot':'<ellipse cx="12" cy="7" rx="9" ry="4"/><path d="M3 7v4c0 5 18 5 18 0V7M8 18l-2 4m6-4v4m4-4 2 4"/>',
    'spark':'<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z"/>',
    'lamp':'<path d="M6 21h13m-6 0V11m0 0L6 7l5-5 7 4-5 5Zm0 0 5 5"/>',
    'check':'<path d="m5 12 4 4L19 6"/>',
    'copy':'<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
    'chevron':'<path d="m9 5 7 7-7 7"/>',
    'pendant':'<path d="M12 2v5"/><path d="M4 15a8 8 0 0 1 16 0Z"/><path d="M10 18.5a2 2 0 0 0 4 0"/>',
    'sconce':'<path d="M4 8v8M4 12h5"/><path d="M10 5h6l3 10H7Z"/><path d="M11 19h4"/>',
    'downlight':'<path d="M3 7h18"/><path d="M7 7a5 5 0 0 0 10 0"/><path d="m9 16-1.5 4M12 16v4m3-4 1.5 4"/>',
    'strip':'<rect x="2" y="9" width="20" height="6" rx="1.5"/><path d="M6 12h.01M10 12h.01M14 12h.01M18 12h.01"/>',
    'floor':'<path d="M8 3h8l2.5 6h-13Z"/><path d="M12 9v12M8 21h8"/>',
    'bollard':'<rect x="8" y="3" width="8" height="6" rx="1.5"/><path d="M9 9h6v12H9ZM5 21h14M4 6H2m20 0h-2"/>',
    'socket':'<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="12" cy="12" r="5"/><path d="M10 12h.01M14 12h.01"/>',
    'camera':'<path d="M4 8h3l2-3h6l2 3h3v11H4Z"/><circle cx="12" cy="13" r="3.5"/>',
    'clock':'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    'sofa':'<path d="M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3"/><path d="M2 13a2 2 0 0 1 4 0v2h12v-2a2 2 0 0 1 4 0v5H2Z"/><path d="M5 18v2M19 18v2"/>',
    'kitchen':'<path d="M4 10h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Z"/><path d="M2 10h20M9 6c0-1 1-1 1-2m4 2c0-1 1-1 1-2"/>',
    'drop':'<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"/><path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5"/>',
    'desk':'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    'shop':'<path d="M3 9 4.5 4h15L21 9"/><path d="M3 9h18v1.5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0Z"/><path d="M5 13v8h14v-8M10 21v-5h4v5"/>',
    'tree':'<path d="M12 22v-6"/><path d="M12 16a6 6 0 0 0 6-6 6 6 0 0 0-12 0 6 6 0 0 0 6 6Z"/>',
}

def e(s): return html.escape(str(s), quote=True)
def icon(n): return f'<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">{ICONS[n]}</svg>'
def wa(text='Merhaba, Ünüvar Aydınlatma hakkında bilgi almak istiyorum.'):
    return f'https://wa.me/{PHONE}?text={urllib.parse.quote(text)}'
def out(url, label, cls=''):
    return f'<a class="{cls}" href="{e(url)}" target="_blank" rel="noopener noreferrer">{label}</a>'
def logo(): return '<span class="logo-crop"><img src="/assets/logo.webp" width="230" height="230" alt="Ünüvar Aydınlatma"></span>'
def photo(alt, hero=False, priority=False):
    name, widths, height = 'magaza-profesyonel-v5', [480, 800, 1448], 1086
    sizes = '(max-width: 900px) calc(100vw - 40px), 640px' if hero else '(max-width: 900px) calc(100vw - 40px), 600px'
    srcsets = {ext: ', '.join(f'/assets/{name}-{w}.{ext} {w}w' for w in widths) for ext in ['avif', 'webp']}
    loading = 'fetchpriority="high"' if hero or priority else 'loading="lazy" decoding="async"'
    return f'<picture class="responsive-picture"><source type="image/avif" srcset="{srcsets["avif"]}" sizes="{sizes}"><img class="store-image" src="/assets/{name}-{widths[1]}.webp" srcset="{srcsets["webp"]}" sizes="{sizes}" width="{widths[-1]}" height="{height}" alt="{e(alt)}" {loading}></picture>'

def hours_block():
    if HOURS:
        rows = ''.join(f'<div><dt>{e(day)}</dt><dd>{e(time)}</dd></div>' for day, time in HOURS)
        return f'<dl class="hours">{rows}</dl>'
    return f'<p class="hours-note">{icon("clock")}<span>Çalışma saatlerini <a href="tel:+905456105009">0545 610 50 09</a> numarasından teyit edebilirsiniz.</span></p>'

def map_panel():
    return f'''<div class="map-shell"><div class="map-heading"><span>{icon('pin')} Ünüvar Aydınlatma</span><small>KARAKÖY · İSTANBUL</small></div><div class="map-canvas"><iframe id="store-map" title="Ünüvar Aydınlatma Elektrik mağaza konumu" src="{e(MAP_EMBED)}" width="600" height="450" loading="eager" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen tabindex="0"></iframe></div><div class="map-footer"><p>Karaköy · Beyoğlu, İstanbul</p>{out(BUSINESS_MAP,'Google Haritalar’da aç '+icon('up'),'text-link')}</div></div>'''

def location():
    return f'''<section class="location-section" id="ulasim" aria-labelledby="location-title"><div class="container location-grid"><div class="location-copy"><span class="eyebrow">MAĞAZAMIZ</span><h2 id="location-title">Karaköy’de, Tutsak Sokak’ta.</h2><address>Emekyemez Mahallesi<br/>Tutsak Sokak No:8, 34421<br/>Beyoğlu / İstanbul</address>{hours_block()}<div class="location-actions">{out(MAP,'Yol tarifi al '+icon('up'),'button yellow')}<a class="text-link" href="tel:+905456105009">{icon('phone')} 0545 610 50 09</a></div></div>{map_panel()}</div></section>'''

def breadcrumb(items):
    links=['<a href="/">Ana sayfa</a>']
    for name,url in items:
        links.append(f'<a href="{url}">{e(name)}</a>' if url else f'<span aria-current="page">{e(name)}</span>')
    return '<nav class="breadcrumb" aria-label="Sayfa yolu">'+('<span aria-hidden="true">/</span>'.join(links))+'</nav>'
def brand_logos():
    return ''.join(f'<div class="brand-card brand-{brand["name"]}"><img src="/assets/brands/{brand["file"]}" width="{brand["width"]}" height="{brand["height"]}" alt="{e(brand["label"])}" loading="lazy"></div>' for brand in BRANDS)

def brands():
    return f'''<section class="brands-showcase" id="markalar" aria-labelledby="brands-title"><div class="container brands-inner"><h2 id="brands-title">Mağazamızda bulabileceğiniz markalar</h2><div class="brand-cards">{brand_logos()}</div></div></section>'''

SECTIONS = presentation_sections(icon, out, wa, IG, FB)

INTRO = '<div class="intro-screen" aria-hidden="true"><div class="intro-mark"><span class="intro-word">Ünüvar<i class="intro-tab"></i></span><span class="intro-sub">AYDINLATMA</span><span class="intro-line"></span></div></div>'

def shell(title, desc, body, current='home', path='/', hero=False, schema=None, intro=False):
    nav=''.join(f'<a href="{u}" {"aria-current=page" if current==key else ""}>{label}</a>' for key,label,u in [('home','Ana sayfa','/'),('products','Koleksiyon & katalog','/urunler/'),('solutions','Proje çözümleri','/cozumler/'),('b2b','B2C teklif','/b2c/'),('contact','İletişim','/iletisim/')])
    schema= schema or {'@context':'https://schema.org','@type':'Store','name':'Ünüvar Aydınlatma','url':ORIGIN,'logo':ORIGIN+'/assets/logo.webp','image':ORIGIN+'/assets/magaza-profesyonel-v5-1448.webp','telephone':'+90 545 610 50 09','sameAs':[IG,FB],'address':{'@type':'PostalAddress','streetAddress':'Emekyemez Mahallesi, Tutsak Sokak No:8','addressLocality':'Beyoğlu','addressRegion':'İstanbul','postalCode':'34421','addressCountry':'TR'},'geo':{'@type':'GeoCoordinates','latitude':41.0262442,'longitude':28.9710587},'hasMap':BUSINESS_MAP}
    seo = metadata(path, title, desc, ORIGIN, schema)
    schema = seo['schema']
    full_title, desc = seo['title'], seo['description']
    social = MEDIA[seo['image']]
    preload = '<link rel="preload" as="image" type="image/avif" href="/assets/magaza-profesyonel-v5-800.avif" imagesrcset="/assets/magaza-profesyonel-v5-480.avif 480w, /assets/magaza-profesyonel-v5-800.avif 800w, /assets/magaza-profesyonel-v5-1448.avif 1448w" imagesizes="(max-width: 900px) calc(100vw - 40px), 640px" fetchpriority="high">' if hero else ''
    extras = f'<link rel="stylesheet" href="{asset_url("b2b.css")}">' if current in ("home","b2b","solutions") else ""
    if current == "b2b": extras += f'<script defer src="{asset_url("b2b-core.js")}"></script><script defer src="{asset_url("b2b.js")}"></script>'
    if current == "products": extras += f'<script defer src="{asset_url("catalog.js")}"></script>'
    return f'''<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script>document.documentElement.classList.add("js");{HEAD_JS}{INTRO_JS if intro else ""}</script><title>{e(full_title)}</title><meta name="description" content="{e(desc)}"><meta name="robots" content="{seo['robots']}"><meta name="theme-color" content="#ffffff"><link rel="canonical" href="{ORIGIN}{path}"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><meta property="og:title" content="{e(full_title)}"><meta property="og:site_name" content="Ünüvar Aydınlatma"><meta property="og:description" content="{e(desc)}"><meta property="og:type" content="website"><meta property="og:locale" content="tr_TR"><meta property="og:url" content="{ORIGIN}{path}"><meta property="og:image" content="{ORIGIN}{seo['image']}"><meta property="og:image:width" content="{social['width']}"><meta property="og:image:height" content="{social['height']}"><meta property="og:image:type" content="{social['type']}"><meta property="og:image:alt" content="{e(title)} · Ünüvar Aydınlatma"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{e(full_title)}"><meta name="twitter:description" content="{e(desc)}"><meta name="twitter:image" content="{ORIGIN}{seo['image']}"><meta name="twitter:image:alt" content="{e(title)} · Ünüvar Aydınlatma"><link rel="preload" as="font" type="font/woff2" href="/assets/fonts/manrope-latin.woff2" crossorigin><link rel="preload" as="font" type="font/woff2" href="/assets/fonts/manrope-latin-ext.woff2" crossorigin><link rel="stylesheet" href="{CSS}">{extras}{preload}<script defer src="{JS}"></script><script type="application/ld+json">{json.dumps(schema,ensure_ascii=False).replace('</','<\\/')}</script></head>
    <body class="page-{current}">{INTRO if intro else ""}<a class="skip" href="#main">İçeriğe geç</a>
    <div class="utility-strip"><div class="container"><span>KARAKÖY / İSTANBUL · AYDINLATMA VE ELEKTRİK</span><a href="tel:+905456105009">0545 610 50 09</a></div></div><header class="site-header"><div class="container header-inner"><a href="/" class="logo-link" aria-label="Ünüvar Aydınlatma ana sayfa">{logo()}</a><nav class="desktop-nav" aria-label="Ana menü">{nav}</nav><div class="header-actions"><button class="icon-button order-trigger" type="button" data-order-open aria-label="Sipariş listesi (0)" aria-haspopup="dialog" aria-controls="order-dialog" hidden>{icon('bag')}<span class="order-count" data-order-count aria-hidden="true">0</span></button><a class="header-phone" href="tel:+905456105009">{icon('phone')} 0545 610 50 09</a><a href="/iletisim/#teklif" class="button yellow header-wa">Fiyat bilgisi {icon("up")}</a><button class="icon-button menu-trigger" aria-label="Menüyü aç" aria-controls="mobile-nav" aria-expanded="false">{icon('menu')}</button></div></div><nav id="mobile-nav" class="mobile-nav" aria-label="Mobil menü" hidden>{nav}</nav></header>
    <main id="main" tabindex="-1">{body}</main>
    <footer class="site-footer"><div class="container footer-main"><div class="footer-brand"><a href="/" class="footer-wordmark">Ünüvar<span>AYDINLATMA</span></a><p>Karaköy’de aydınlatma ve elektrik malzemesi.</p><div class="social-links">{out(IG,'Instagram '+icon('up'))}{out(FB,'Facebook '+icon('up'))}</div></div><div><h3>Ünüvar Aydınlatma</h3><a href="/hakkimizda/">Hakkımızda</a><a href="/iletisim/">İletişim ve ulaşım</a><a href="/urunler/">Koleksiyon ve katalog</a><a href="/cozumler/">Proje çözümleri</a><a href="/b2c/">B2C teklif ve talep listesi</a><a href="/rehber/">Teknik seçim bilgileri</a><a href="/#sorular">Sık sorulanlar</a></div><div><h3>İletişim</h3><a class="footer-phone" href="tel:+905456105009">0545 610 50 09</a><address>Emekyemez Mahallesi<br/>Tutsak Sokak No:8<br/>Beyoğlu / İstanbul</address>{out(MAP,'Yol tarifi al '+icon('up'),'text-link')}</div></div><div class="container footer-bottom"><span>© 2026 Ünüvar Aydınlatma</span><a href="/gizlilik/">Gizlilik ve site bilgileri</a></div></footer>
    <button class="back-to-top" type="button" aria-label="Sayfanın başına dön" hidden>{icon("arrow")}</button><div class="mobile-contact"><a href="tel:+905456105009">{icon('phone')} Ara</a>{out(wa(),icon('wa')+' WhatsApp’tan yazın')}</div><div class="toast" role="status" aria-live="polite"></div>{order_markup(icon, ORDER_PRODUCTS, PHONE, ORIGIN)}</body></html>'''


def write(path,content):
    f=DIST / path.lstrip('/')
    if not f.suffix: f=f/'index.html'
    f.parent.mkdir(parents=True,exist_ok=True)
    f.write_text(content,encoding='utf-8')

# Remove previously generated catalog routes from the deployment. The original
# product records and assets stay in source control for the owner's future work.
for stale in [DIST / 'urun', *(DIST / 'urunler' / category for category in CATEGORIES)]:
    if stale.resolve().is_relative_to(DIST.resolve()) and stale.exists():
        for generated in stale.rglob('*.html'):
            generated.unlink()

home=homepage(icon, out, wa, photo, brands, SECTIONS, location, catalog_teaser)
write('/',shell('Karaköy’de aydınlatma ve elektrik malzemesi','Avize, sarkıt, aplik, spot, LED ampul, şerit LED ve elektrik malzemesi. Karaköy’deki Ünüvar Aydınlatma mağazasını ziyaret edin veya WhatsApp’tan ürün sorun.',home,hero=False,intro=False))

catalog=f'''<div class="container">{breadcrumb([('Katalog',None)])}</div>{catalog_page(icon, wa, out)}{process(icon)}'''
if ORDER_PRODUCTS:
    cards=''.join(f'<article class="order-card"><img src="{e(p["image"])}" alt="{e(p["name"])}" width="540" height="540" loading="lazy"><small>{e(p.get("brand",""))} {e(p.get("code",""))}</small><h2>{e(p["name"])}</h2><button type="button" class="button yellow" data-order-add="{e(p["id"])}">Listeye ekle {icon("bag")}</button><noscript>Sipariş listesi için JavaScript gereklidir. Telefonla bize ulaşabilirsiniz.</noscript></article>' for p in ORDER_PRODUCTS)
    catalog+=f'<div class="container"><section class="page-heading"><h2>Sipariş listesine ekleyin.</h2><p>Seçimlerinizi listeye ekleyin, WhatsApp üzerinden bize iletin.</p></section><div class="order-grid">{cards}</div></div>'
write('/urunler/',shell('Aydınlatma kataloğu',f'{catalog_manifest()["page_count"]} sayfalık Ünüvar Aydınlatma kataloğunu keşfedin. 19 ürün grubu, dekoratif ve mimari aydınlatma seçenekleri. PDF indirin, fiyat bilgisi alın.',catalog,current='products',path='/urunler/'))

write('/b2c/',shell('B2C teklif ve talep listesi','Eviniz için aydınlatma ürünlerini seçin, adetleri belirleyin ve listenizi hazırlayın. Güncel fiyat, ürün seçenekleri ve teslim bilgilerini WhatsApp üzerinden sorun.',b2b_page(icon,breadcrumb),current='b2b',path='/b2c/'))
write('/b2b/',f'<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><meta name="site-redirect" content="/b2c/"><title>B2C teklif sayfasına yönlendiriliyorsunuz | Ünüvar Aydınlatma</title><link rel="canonical" href="{ORIGIN}/b2c/"><link rel="stylesheet" href="{CSS}"><script defer src="{asset_url("legacy-b2b.js")}"></script></head><body><main id="main" class="container page-heading"><span class="eyebrow">ÜNÜVAR AYDINLATMA</span><h1>Yeni B2C teklif sayfamız.</h1><p>Ürün seçiminize yeni sayfamızdan devam edebilirsiniz.</p><a class="button yellow" data-redirect-link href="/b2c/">B2C teklif sayfasını açın</a></main></body></html>')
write('/cozumler/',shell('Mekâna göre aydınlatma çözümleri','Konut, ofis, mağaza, otel, peyzaj ve teknik alanlar için aydınlatma ürün gruplarını keşfedin. Projeniz için ürün ve adet listesi hazırlayın.',solutions_page(icon,breadcrumb),current='solutions',path='/cozumler/'))

guide = guide_page(icon, out, wa, breadcrumb, SECTIONS, kelvin_widget)
write('/rehber/',shell('Işık rehberi','Işık rengi (Kelvin), lümen ve watt karşılıkları, E27, E14, GU10 duy tipleri ve IP koruma sınıfları. Mekâna göre aydınlatma önerileri.',guide,current='guide',path='/rehber/'))

about = about_page(icon, out, wa, photo, breadcrumb, SECTIONS, brands)
write('/hakkimizda/',shell('Hakkımızda','Ünüvar Aydınlatma, Karaköy’de aydınlatma ve elektrik malzemesi mağazası. Ürün gruplarımızı ve markalarımızı tanıyın.',about,current='about',path='/hakkimizda/'))

contact = contact_page(icon, out, wa, photo, breadcrumb, map_panel, MAP, hours_block())
write('/iletisim/',shell('İletişim ve ulaşım','Ünüvar Aydınlatma: 0545 610 50 09. Karaköy mağazamıza ulaşın, telefon veya WhatsApp üzerinden bizimle görüşün.',contact,current='contact',path='/iletisim/'))

privacy='''<div class="container narrow"><section class="page-heading"><span class="eyebrow">SİTE BİLGİLERİ</span><h1>Gizlilik ve iletişim.</h1><p>Son güncelleme: 20 Ekim 2026</p></section><div class="prose"><h2>Bu site nasıl çalışır?</h2><p>Bu site Ünüvar Aydınlatma’yı tanıtır ve mağaza iletişim bilgilerini sunar. Site üzerinde üyelik veya ödeme bulunmaz. Sipariş listesi bir talep taslağıdır; kesinleşmiş sipariş ya da satın alma oluşturmaz. Reklam veya ziyaretçi analitiği için ek izleme kodu kullanılmaz.</p><h2>B2C teklif listesi</h2><p>Seçtiğiniz ürün kodları ve adetleri, bu cihazın tarayıcısında en fazla yedi gün saklanır. Adınız / liste adı, şehir, kullanım alanı ve notlar kalıcı kaydedilmez. Listeyi temizleyerek ürün kayıtlarını silebilirsiniz. Siteye bir sipariş veya hesap kaydı gönderilmez. Excel için indir düğmesi ürün kodu ve adetlerini CSV olarak cihazınıza kaydeder; Yazdır / PDF seçeneği adınız ve kullanım alanı bilgileriniz dahil talep özetini yazdırabilir. Özeti kopyala düğmesi özeti panoya kopyalar. WhatsApp düğmesi hazırlanan talep metnini ilgili hizmete aktarır; mesajı WhatsApp içinde siz gönderirsiniz.</p><h2>İletişim mesajı</h2><p>İletişim sayfasındaki ürün kodu, adet, kullanım alanı, katalog sayfası ve notunuz, yalnızca tarayıcınızda bir WhatsApp mesaj taslağı hazırlar. Bilgiler bu siteye gönderilmez ve kalıcı olarak kaydedilmez. WhatsApp’ta talebi aç düğmesine bastığınızda taslak ilgili hizmete aktarılır; mesajı siz gönderirsiniz.</p><h2>Dış bağlantılar</h2><p>WhatsApp, Instagram, Facebook ve Google Haritalar bağlantıları ilgili hizmetleri açar. Bu hizmetlere geçişinizde onların gizlilik ve kullanım koşulları geçerlidir. WhatsApp bağlantısı bir karşılama mesajı hazırlar; mesajı siz gönderirsiniz.</p><h2>Mağaza haritası</h2><p>Google Haritalar bileşeni ana sayfa ve iletişim sayfası açıldığında otomatik yüklenir. Bu işlem, tarayıcınızın Google ile bağlantı kurmasına ve IP adresi gibi teknik bağlantı bilgilerinin Google’a iletilmesine neden olur. Harita için Google’ın gizlilik ve kullanım koşulları geçerlidir. Mağaza adresini ayrıca sayfadaki metinden okuyabilir ve telefonla bize ulaşabilirsiniz.</p><h2>Barındırma</h2><p>Siteye erişim, barındırma sağlayıcısının altyapısı üzerinden gerçekleşir. Erişim yönetimi ve teknik kayıtlar sağlayıcının politikaları kapsamında işlenebilir.</p><h2>Bize ulaşın</h2><p>Site ve içerikler hakkında 0545 610 50 09 numaralı telefondan Ünüvar Aydınlatma’ya ulaşabilirsiniz.</p></div></div>'''
write('/gizlilik/',shell('Gizlilik ve site bilgileri','Ünüvar Aydınlatma web sitesinin veri akışı, bağlantıları ve iletişim bilgileri.',privacy,current='legal',path='/gizlilik/'))
write('/404.html',shell('Sayfa bulunamadı','Aradığınız sayfaya ulaşılamadı.',f'<div class="container not-found"><span class="eyebrow">404</span><h1>Bu sayfanın ışığı kapalı.</h1><p>Aradığınız sayfa taşınmış veya kaldırılmış olabilir.</p><a href="/" class="button yellow">Ana sayfaya dön {icon("arrow")}</a></div>',current='notfound',path='/404.html'))
paths=['/','/urunler/','/b2c/','/cozumler/','/rehber/','/hakkimizda/','/iletisim/','/gizlilik/']
write('/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join(f'<url><loc>{ORIGIN}{path}</loc></url>' for path in paths)+'</urlset>')
write('/robots.txt',robots(ORIGIN))
print(f'Built {len(paths)} pages + 404 + legacy redirect, sitemap and robots. Orderable catalog items: {len(ORDER_PRODUCTS)}.')
