"""Page-specific metadata and linked, factual JSON-LD for the existing content."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((ROOT / 'data/seo-config.json').read_text(encoding='utf-8'))
if CONFIG['publication'] == 'owner-private' and CONFIG['indexable']:
    raise ValueError('Private review builds must keep indexing disabled. Confirm public hosting before changing publication and indexable together.')

def metadata(path, title, description, origin, business):
    name = CONFIG['site_name']
    titles = {
        '/': 'Ünüvar Aydınlatma | Karaköy Aydınlatma Mağazası',
        '/urunler/': 'Aydınlatma Kataloğu ve Ürünler | Ünüvar Aydınlatma',
        '/b2c/': 'B2C Teklif ve Ürün Talep Listesi | Ünüvar Aydınlatma',
        '/cozumler/': 'Proje ve Mekân Aydınlatma Çözümleri | Ünüvar Aydınlatma',
        '/rehber/': 'Işık Rehberi: Kelvin, Lümen, Duy Tipleri ve IP | Ünüvar Aydınlatma',
        '/hakkimizda/': 'Hakkımızda | Karaköy Ünüvar Aydınlatma',
        '/iletisim/': 'Fiyat Talebi ve İletişim | Ünüvar Aydınlatma Karaköy',
        '/gizlilik/': 'Gizlilik ve Site Bilgileri | Ünüvar Aydınlatma',
        '/404.html': 'Sayfa Bulunamadı | Ünüvar Aydınlatma',
    }
    descriptions = {
        '/': 'Karaköy’de aydınlatma ve elektrik malzemesi: avize, sarkıt, aplik, spot, LED ampul, şerit LED. Ürün fotoğrafını WhatsApp’tan gönderin veya Tutsak Sokak’taki mağazamıza gelin.',
        '/urunler/': f'{json.loads((ROOT / "data/catalog.json").read_text(encoding="utf-8"))["page_count"]} sayfalık Ünüvar Aydınlatma kataloğu ve 19 ürün grubu. Mimari, dekoratif ve dış mekân aydınlatmalarını keşfedin; ürün koduyla fiyat bilgisi alın.',
        '/hakkimizda/': 'Ünüvar Aydınlatma, Karaköy Tutsak Sokak’ta aydınlatma ve elektrik malzemesi mağazası. Ürün gruplarımızı ve çalıştığımız markaları tanıyın.',
        '/iletisim/': 'Ürün kodu, adet ve kullanım alanıyla fiyat ve stok bilgisi isteyin. Ünüvar Aydınlatma: 0545 610 50 09, Tutsak Sokak No:8, Karaköy.',
    }
    full_title = titles.get(path, f'{title} | {name}')
    description = descriptions.get(path, description)
    crumbs = [('Ana sayfa', '/')]
    if path != '/':
        crumbs += [({'/b2c/':'B2C teklif','/cozumler/':'Proje çözümleri','/urunler/':'Katalog','/rehber/':'Işık rehberi','/hakkimizda/':'Hakkımızda','/iletisim/':'İletişim','/gizlilik/':'Gizlilik ve site bilgileri'}.get(path, title), path)]
    business = {key: value for key, value in business.items() if key != '@context'}
    business.update({'@id':origin+'/#business'})
    website = {'@type':'WebSite','@id':origin+'/#website','url':origin+'/','name':name,'inLanguage':CONFIG['language'],'publisher':{'@id':business['@id']}}
    page_type = {'/hakkimizda/':'AboutPage','/iletisim/':'ContactPage'}.get(path, 'WebPage')
    image = CONFIG['social_image']
    page = {'@type':page_type,'@id':origin+path+'#webpage','url':origin+path,'name':full_title,'description':description,'inLanguage':CONFIG['language'],'isPartOf':{'@id':website['@id']},'about':{'@id':business['@id']},'primaryImageOfPage':{'@type':'ImageObject','url':origin+image}}
    graph = [business, website, page]
    if len(crumbs)>1 and path not in ('/404.html','/gizlilik/'):
        breadcrumb = {'@type':'BreadcrumbList','@id':origin+path+'#breadcrumb','itemListElement':[{'@type':'ListItem','position':i+1,'name':label,'item':origin+url} for i,(label,url) in enumerate(crumbs)]}
        page['breadcrumb'] = {'@id':breadcrumb['@id']}
        graph.append(breadcrumb)
    return {'title':full_title,'description':description,'image':image,'schema':{'@context':'https://schema.org','@graph':graph},'robots':'index,follow,max-image-preview:large' if CONFIG['indexable'] and path!='/404.html' else 'noindex,nofollow'}

def robots(origin):
    if CONFIG['indexable']:
        return f'User-agent: *\nAllow: /\nSitemap: {origin}/sitemap.xml\n'
    return 'User-agent: *\nDisallow: /\n# Owner-private review. Authentication controls access; indexing stays disabled.\n'
