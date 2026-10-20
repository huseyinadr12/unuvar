"""Check generated pages, internal links, image assets and structured data."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json

DIST = Path(__file__).resolve().parents[1] / 'dist'
errors = []

class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.path, self.ids, self.h1 = path, set(), 0
        self.jsonld, self.capture = [], False
    def handle_starttag(self, tag, attributes):
        a = dict(attributes)
        if tag == 'h1': self.h1 += 1
        if a.get('id'):
            if a['id'] in self.ids: errors.append(f'{self.path}: duplicate id {a["id"]}')
            self.ids.add(a['id'])
        if tag == 'img' and 'alt' not in a: errors.append(f'{self.path}: image without alt')
        if tag == 'iframe' and not a.get('title'): errors.append(f'{self.path}: frame without accessible title')
        if tag == 'iframe' and a.get('id') == 'store-map':
            if 'hidden' in a or 'data-src' in a:
                errors.append(f'{self.path}: map must be directly visible')
            if not a.get('src', '').startswith('https://www.google.com/maps/embed?'):
                errors.append(f'{self.path}: invalid map provider')
        for candidate in (a.get('srcset', '') or a.get('imagesrcset', '')).split(','):
            if not candidate.strip(): continue
            src = candidate.strip().split()[0]
            if src.startswith('/') and not (DIST / src.lstrip('/')).is_file():
                errors.append(f'{self.path}: missing responsive image {src}')
        if tag == 'a' and a.get('target') == '_blank' and 'noopener' not in a.get('rel', ''):
            errors.append(f'{self.path}: external link without noopener')
        for key in ('href', 'src'):
            url = urlsplit(a.get(key, ''))
            if url.scheme or url.netloc or not url.path: continue
            target = DIST / unquote(url.path.lstrip('/')) if url.path.startswith('/') else self.path.parent / unquote(url.path)
            if target.is_dir(): target = target / 'index.html'
            if not target.is_file(): errors.append(f'{self.path}: missing {url.path}')
        if tag == 'script' and a.get('type') == 'application/ld+json': self.capture = True
    def handle_data(self, data):
        if self.capture: self.jsonld.append(data)
    def handle_endtag(self, tag):
        if tag == 'script' and self.capture:
            try: json.loads(''.join(self.jsonld))
            except json.JSONDecodeError as exc: errors.append(f'{self.path}: invalid JSON-LD {exc}')
            self.jsonld, self.capture = [], False

pages = list(DIST.rglob('*.html'))
order_records = json.loads((DIST.parent / 'data/order-catalog.json').read_text(encoding='utf-8'))
product_names = [p['name'] for p in json.loads((DIST.parent / 'data/products.json').read_text(encoding='utf-8'))]
for path in pages:
    parsed = Page(path)
    source = path.read_text(encoding='utf-8')
    parsed.feed(source)
    if 'data-map-load' in source: errors.append(f'{path}: obsolete map activation button')
    for marker in ['data-product', 'data-catalog', 'product-detail', 'category-grid', 'search-trigger', '/urun/']:
        if marker in source: errors.append(f'{path}: removed catalog interface is still published: {marker}')
    for name in product_names if not order_records else []:
        if name in source: errors.append(f'{path}: archived product is still published: {name}')
    if not order_records and 'data-order-add=' in source: errors.append(f'{path}: unexpected orderable product')
    if 'qa-one' in source or 'Yalnızca yerel QA' in source: errors.append(f'{path}: test fixture leaked into publication')
    for required in ['order-dialog','order-data']:
        if required not in parsed.ids: errors.append(f'{path}: missing {required}')
    if parsed.h1 != 1: errors.append(f'{path}: expected 1 h1, got {parsed.h1}')
    if 'main' not in parsed.ids: errors.append(f'{path}: missing main anchor')
if len(pages) != 7: errors.append('Expected exactly 6 pages and a 404; check for stale catalog/category pages')
if 'collection-card' not in (DIST / 'urunler/index.html').read_text(encoding='utf-8'):
    errors.append('Product groups are missing from the products page')
catalog = json.loads((DIST.parent / 'data/catalog.json').read_text(encoding='utf-8'))
catalog_html = (DIST / 'urunler/index.html').read_text(encoding='utf-8')
if len(catalog['pages']) != catalog['page_count']:
    errors.append('Catalog preview count does not match its page count')
if [p['page'] for p in catalog['pages']] != list(range(1, catalog['page_count']+1)):
    errors.append('Catalog preview sequence is incomplete')
for entry in catalog['pages']:
    if not (DIST / entry['image'].lstrip('/')).is_file():
        errors.append('Missing catalog preview: '+entry['image'])
    if entry['image'] not in catalog_html:
        errors.append('Catalog preview not exposed to static export: '+entry['image'])
if not (DIST / catalog['pdf'].lstrip('/')).is_file():
    errors.append('Catalog PDF is missing')
for section in catalog['sections']:
    if not 1 <= section['start'] <= section['end'] <= catalog['page_count']:
        errors.append('Invalid catalog chapter range: '+section['title'])
if 'data-reader' not in catalog_html or 'download="unuvar-aydinlatma-katalog.pdf"' not in catalog_html:
    errors.append('Catalog reader or download link is missing')
for path in pages:
    if 'site-loader' in path.read_text(encoding='utf-8'): errors.append(f'{path}: first-visit loader is published')
if errors: raise SystemExit('\n'.join(errors))
print(f'PASS: {len(pages)} pages; {len(order_records)} published orderable products; no QA fixtures; internal links, assets/srcsets, headings, IDs, automatic maps, order markup, product groups and JSON-LD.')
