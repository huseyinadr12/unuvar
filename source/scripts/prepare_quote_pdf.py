"""Prepare pinned, self-hosted PDF dependencies and licensed Turkish fonts."""
from pathlib import Path
import base64, hashlib, io, json, tarfile, urllib.request
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools import subset
from PIL import Image

ASSETS = Path(__file__).resolve().parents[1] / 'dist/assets'
TARGET = ASSETS / 'quote-pdf'
TARGET.mkdir(parents=True, exist_ok=True)
PACKAGES = [
    ('jspdf', '4.2.1', 'dist/jspdf.umd.min.js', 'jspdf-4.2.1.min.js'),
    ('jspdf-autotable', '5.0.9', 'dist/jspdf.plugin.autotable.min.js', 'autotable-5.0.9.min.js'),
]
for name, version, member, output in PACKAGES:
    meta = json.load(urllib.request.urlopen(f'https://registry.npmjs.org/{name}/{version}'))
    data = urllib.request.urlopen(meta['dist']['tarball']).read()
    integrity = 'sha512-' + base64.b64encode(hashlib.sha512(data).digest()).decode()
    if integrity != meta['dist']['integrity']:
        raise ValueError(f'Integrity mismatch: {name}')
    with tarfile.open(fileobj=io.BytesIO(data), mode='r:gz') as archive:
        (TARGET / output).write_bytes(archive.extractfile('package/' + member).read())
        license_name = next(m for m in archive.getnames() if m.lower() in ('package/license', 'package/license.txt'))
        (TARGET / (name + '-LICENSE.txt')).write_bytes(archive.extractfile(license_name).read())

# Merge the two existing OFL-licensed Manrope webfont subsets first. The Latin
# extension subset supplies Turkish glyphs; the Latin subset supplies ASCII.
from fontTools.merge import Merger
font_paths = [ASSETS/'fonts/manrope-latin.woff2', ASSETS/'fonts/manrope-latin-ext.woff2']
for weight, label in [(400, 'Regular'), (600, 'Semibold')]:
    parts = []
    for path in font_paths:
        font = TTFont(path)
        if 'fvar' in font:
            font = instantiateVariableFont(font, {'wght': weight}, inplace=True)
        font.flavor = None
        buffer = io.BytesIO()
        font.save(buffer)
        buffer.seek(0)
        parts.append(buffer)
    font = Merger().merge(parts)
    options = subset.Options()
    options.name_IDs = ['*']
    sub = subset.Subsetter(options=options)
    sub.populate(unicodes=list(range(32, 256)) + list(range(0x100, 0x180)) + [0x2013, 0x2014, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2026, 0x20ba])
    sub.subset(font)
    font.save(TARGET/f'Manrope-{label}.ttf')

with Image.open(ASSETS/'logo.webp') as logo:
    logo.crop((136, 260, 841, 580)).resize((705, 320), Image.Resampling.LANCZOS).save(TARGET/'logo.png', optimize=True)
(TARGET/'FONT-LICENSE.txt').write_bytes((ASSETS/'fonts/OFL.txt').read_bytes())
print('Prepared PDF libraries, logo and Turkish Manrope fonts.')
