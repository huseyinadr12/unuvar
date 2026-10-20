"""Audit generated HTML, canonical relationships, JSON-LD and performance budgets.

This is a static technical audit, not a Google ranking or Lighthouse measurement.
"""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
import gzip, hashlib, json, re, xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
CONFIG = json.loads((ROOT/'data/seo-config.json').read_text(encoding='utf-8'))
errors, rows = [], []

class Document(HTMLParser):
    def __init__(self):
        super().__init__()
        self.meta, self.links, self.images, self.sources = {}, [], [], []
        self.title, self.structured, self.buffer = '', [], ''
        self.capture, self.lang = None, ''
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag=='html': self.lang=a.get('lang','')
        if tag=='meta': self.meta[a.get('name',a.get('property',''))]=a.get('content','')
        if tag=='link': self.links.append(a)
        if tag=='img': self.images.append(a)
        if tag=='source': self.sources.append(a)
        if tag=='title': self.capture='title'; self.buffer=''
        if tag=='script' and a.get('type')=='application/ld+json': self.capture='json'; self.buffer=''
    def handle_data(self, data):
        if self.capture: self.buffer += data
    def handle_endtag(self, tag):
        if tag=='title' and self.capture=='title': self.title=self.buffer; self.capture=None
        if tag=='script' and self.capture=='json': self.structured.append(json.loads(self.buffer)); self.capture=None

def check(condition, message):
    if not condition: errors.append(message)

titles, descriptions, canonicals = set(), set(), set()
for path in sorted(DIST.rglob('*.html')):
    relative=path.relative_to(DIST).as_posix()
    route='/' if relative=='index.html' else '/'+relative.removesuffix('index.html')
    page=Document(); page.feed(path.read_text(encoding='utf-8'))
    canonical=[l['href'] for l in page.links if l.get('rel')=='canonical']
    check(page.lang=='tr',f'{route}: wrong document language')
    check(len(canonical)==1,f'{route}: expected one canonical')
    if len(canonical)!=1: continue
    if route == '/b2b/':
        check(page.meta.get('site-redirect') == '/b2c/' and urlsplit(canonical[0]).path == '/b2c/' and 'noindex' in page.meta.get('robots',''), 'Legacy route must canonicalize to B2C and stay out of the index')
        continue
    url=urlsplit(canonical[0]); origin=f'{url.scheme}://{url.netloc}'
    check(url.scheme=='https' and url.path==route and not url.query and not url.fragment,f'{route}: canonical mismatch')
    check(page.title not in titles and page.title.strip(),f'{route}: duplicate/empty title'); titles.add(page.title)
    description=page.meta.get('description','')
    check(description not in descriptions and len(description)>=(10 if route=='/404.html' else 35),f'{route}: duplicate/missing description'); descriptions.add(description)
    check(page.meta.get('og:url')==canonical[0],f'{route}: social URL mismatch')
    for key in ['og:title','og:description','og:site_name','og:image','og:image:alt','twitter:card','twitter:title','twitter:description','twitter:image','twitter:image:alt']:
        check(bool(page.meta.get(key)),f'{route}: missing {key}')
    check(page.meta.get('og:title')==page.title,f'{route}: title mismatch')
    check(page.meta.get('twitter:image')==page.meta.get('og:image'),f'{route}: preview image mismatch')
    image_url=urlsplit(page.meta.get('og:image',''))
    check(image_url.netloc==url.netloc and (DIST/image_url.path.lstrip('/')).is_file(),f'{route}: invalid social image')
    check(int(page.meta.get('og:image:width','0'))>0 and int(page.meta.get('og:image:height','0'))>0,f'{route}: image dimensions missing')
    if not CONFIG['indexable'] or route=='/404.html': check('noindex' in page.meta.get('robots',''),f'{route}: private/404 page indexable')
    graph=page.structured[0].get('@graph',[]) if page.structured else []
    nodes={n.get('@id'):n for n in graph}
    check(origin+'/#business' in nodes and origin+'/#website' in nodes and canonical[0]+'#webpage' in nodes,f'{route}: missing linked entities')
    for node in graph:
        for key in ['isPartOf','about','publisher','breadcrumb']:
            if key in node: check(node[key].get('@id') in nodes,f'{route}: unresolved {key}')
        check('aggregateRating' not in node and 'review' not in node and 'offers' not in node,f'{route}: unverified commercial schema')
        if node.get('@type')=='BreadcrumbList':
            items=node['itemListElement']; check(len(items)>=2,f'{route}: breadcrumb too short')
            check([x['position'] for x in items]==list(range(1,len(items)+1)),f'{route}: breadcrumb ordering')
            check(items[-1]['item']==canonical[0],f'{route}: breadcrumb destination mismatch')
    business=nodes.get(origin+'/#business',{})
    check(business.get('telephone')=='+90 545 610 50 09' and business.get('address',{}).get('streetAddress')=='Emekyemez Mahallesi, Tutsak Sokak No:8',f'{route}: inconsistent business identity')
    for preload in (l for l in page.links if l.get('as')=='image'):
        check(any(source.get('srcset')==preload.get('imagesrcset') and source.get('sizes')==preload.get('imagesizes') for source in page.sources),f'{route}: mismatched responsive preload')
    check(len([img for img in page.images if img.get('fetchpriority')=='high'])<=1,f'{route}: competing priority images')
    for img in page.images:
        check(bool(img.get('width')) and bool(img.get('height')),f'{route}: image without reserved dimensions')
    if route!='/404.html': canonicals.add(canonical[0])
    rows.append({'path':route,'title':page.title,'title_characters':len(page.title),'description_characters':len(description),'schema_types':[n.get('@type') for n in graph],'robots':page.meta.get('robots')})

sitemap=ET.parse(DIST/'sitemap.xml')
urls=[e.text for e in sitemap.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
check(len(urls)==len(set(urls)) and set(urls)==canonicals,'Sitemap must match unique canonical pages and exclude 404/filter URLs')
check(CONFIG['publication']!='owner-private' or not CONFIG['indexable'],'Owner-private publication must not be indexable')
if not CONFIG['indexable']: check('Disallow: /' in (DIST/'robots.txt').read_text(),'Private robots configuration changed')
budgets={'app.css':90000,'app.js':26000}
assets={}
for name,limit in budgets.items():
    content=(DIST/'assets'/name).read_bytes()
    assets[name]={'bytes':len(content),'gzip_estimate_bytes':len(gzip.compress(content)),'budget_bytes':limit}
    check(len(content)<=limit,f'{name}: asset budget exceeded')
for file in (DIST/'assets/fonts').glob('*.woff2'): assets[file.name]={'bytes':file.stat().st_size}
check(sum(file.stat().st_size for file in (DIST/'assets/fonts').glob('*.woff2'))<=50000,'Font budget exceeded')
report={'kind':'Static technical SEO audit; not Lighthouse or field Core Web Vitals','publication':CONFIG['publication'],'indexing_enabled':CONFIG['indexable'],'page_count':len(rows),'sitemap_urls':len(urls),'assets':assets,'product_data_sha256':hashlib.sha256((ROOT/'data/products.json').read_bytes()).hexdigest(),'pages':rows,'errors':errors}
(ROOT/'reports').mkdir(exist_ok=True)
(ROOT/'reports/seo-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
if errors: raise SystemExit('\n'.join(errors))
print(f'PASS: {len(rows)} unique pages; canonical/sitemap parity, social metadata, connected JSON-LD, business consistency, responsive preload and asset budgets. Indexing: {CONFIG["indexable"]}.')
