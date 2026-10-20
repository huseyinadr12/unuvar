"""Export only referenced public assets for root or project GitHub Pages hosting."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import argparse, re, shutil

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
OLD_ORIGIN = 'https://unuvar-aydinlatma.brown-heron-0230.chatgpt.site'


def export(output, url):
    output = Path(output).resolve()
    target = urlsplit(url.rstrip('/'))
    if target.scheme != 'https' or not target.netloc or target.query or target.fragment:
        raise ValueError('A clean HTTPS site URL is required.')
    base = target.path.rstrip('/')
    origin = f'{target.scheme}://{target.netloc}{base}'
    if output == DIST or output.is_relative_to(DIST) or DIST.is_relative_to(output):
        raise ValueError('Export must not overwrite the original dist directory.')
    output.mkdir(parents=True, exist_ok=True)
    files = set(DIST.rglob('*.html')) | {DIST/'sitemap.xml', DIST/'robots.txt'}
    pending = list(files)
    asset_pattern = re.compile(r'/assets/[^\s"\'<>(),?#]+')
    while pending:
        file = pending.pop()
        if file.suffix not in ('.html','.css','.js','.svg','.xml','.txt'):
            continue
        for asset in asset_pattern.findall(file.read_text(encoding='utf-8')):
            candidate = DIST / asset.lstrip('/')
            if not candidate.is_file():
                raise ValueError(f'Missing referenced asset: {asset}')
            if candidate not in files:
                files.add(candidate)
                pending.append(candidate)
    license_file = DIST/'assets/fonts/OFL.txt'
    if license_file.is_file(): files.add(license_file)
    for file in sorted(files):
        relative = file.relative_to(DIST)
        destination = output/relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        if file.suffix in ('.html','.css','.js','.svg','.xml','.txt'):
            text = file.read_text(encoding='utf-8').replace(OLD_ORIGIN, origin)
            if file.suffix in ('.html','.css','.js'):
                text = re.sub(r'''(["'\s(])(/assets/[^"'\s<>()]+)''', lambda match: match[1]+base+match[2], text)
                if file.suffix == '.html':
                    text = text.replace('href="/', 'href="'+base+'/')
                    # Avoid applying the base twice to asset hrefs already rewritten.
                    text = text.replace(base+base+'/assets/', base+'/assets/') if base else text
                    if relative.as_posix() not in ('404.html','gizlilik/index.html'):
                        text = text.replace('content="noindex,nofollow"', 'content="index,follow,max-image-preview:large"')
            if relative.as_posix() == 'robots.txt':
                text = f'User-agent: *\nAllow: /\nSitemap: {origin}/sitemap.xml\n'
            destination.write_text(text, encoding='utf-8')
        else:
            shutil.copy2(file, destination)
    (output/'.nojekyll').write_text('', encoding='utf-8')
    validate(output, origin, base)
    print(f'Exported {len(files)} referenced files to {output}; public URL: {origin}/')
    return files


def validate(output, origin, base):
    errors = []
    class Links(HTMLParser):
        def handle_starttag(self, tag, attrs):
            attributes = dict(attrs)
            links = [attributes.get('href',''),attributes.get('src','')]
            for key in ('srcset','imagesrcset'):
                links.extend(item.strip().split()[0] for item in attributes.get(key,'').split(',') if item.strip())
            for link in links:
                parsed = urlsplit(link)
                if parsed.scheme or parsed.netloc or not parsed.path: continue
                if not parsed.path.startswith(base+'/'):
                    errors.append('Link outside project base: '+link); continue
                file = output/unquote(parsed.path[len(base):].lstrip('/'))
                if file.is_dir(): file /= 'index.html'
                if not file.is_file(): errors.append('Missing file: '+link)
    for page in output.rglob('*.html'):
        text = page.read_text(encoding='utf-8')
        if OLD_ORIGIN in text: errors.append('Old canonical origin in '+str(page))
        Links().feed(text)
        route = '/'+page.relative_to(output).as_posix().removesuffix('index.html')
        if f'rel="canonical" href="{origin}{route}"' not in text:
            errors.append('Incorrect canonical: '+route)
    if errors: raise ValueError('\n'.join(errors))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', required=True)
    parser.add_argument('--url', required=True)
    options = parser.parse_args()
    export(options.output, options.url)
