"""PDF catalog, lightweight page reader and a home-page entry point."""
from pathlib import Path
from html import escape
import json
from editorial import collection_grid

ROOT = Path(__file__).resolve().parents[1]


def catalog_data():
    data = json.loads((ROOT / "data/catalog.json").read_text(encoding="utf-8"))
    pdf = ROOT / "dist" / data["pdf"].lstrip("/")
    if not pdf.is_file():
        raise ValueError("Catalog PDF is missing")
    for entry in data["pages"]:
        if not (ROOT / "dist" / entry["image"].lstrip("/")).is_file():
            raise ValueError(f"Catalog preview is missing: {entry['image']}")
    data["size_label"] = f'{pdf.stat().st_size / 1_000_000:.1f}'.replace(".", ",") + " MB"
    return data


def catalog_teaser(icon):
    data = catalog_data()
    return f'''<section class="catalog-teaser" aria-labelledby="catalog-teaser-title"><div class="container catalog-teaser-inner">
      <div><span class="eyebrow">DİJİTAL KATALOG</span><h2 id="catalog-teaser-title">Koleksiyon, elinizin altında.</h2>
      <p>Lineer, dekoratif ve dış mekân aydınlatmaları. {data["page_count"]} sayfa, 19 ürün grubu. Çevrim içi inceleyin veya PDF olarak yanınızda taşıyın.</p></div>
      <a class="button yellow" href="/urunler/#katalog">Kataloğu inceleyin {icon("arrow")}</a>
    </div></section>'''


def catalog_page(icon, wa, out):
    data = catalog_data()
    pdf = escape(data["pdf"], quote=True)
    pages = data["pages"]
    count = data["page_count"]
    options = "".join(
        f'<option value="{p["page"]}" data-page-image="{escape(p["image"], quote=True)}">'
        f'{p["page"]:02d} · {escape(p["title"])}</option>' for p in pages
    )
    chapters = "".join(
        f'<a href="{pdf}#page={s["start"]}" data-reader-go="{s["start"]}" target="_blank" rel="noopener">'
        f'<span>{escape(s["title"])}</span><span>{s["start"]:02d}'+
        (f'–{s["end"]:02d}' if s["end"] != s["start"] else "")+'</span></a>'
        for s in data["sections"]
    )
    return f'''<section class="catalog-intro" id="katalog" aria-labelledby="catalog-title"><div class="container catalog-intro-grid">
      <div class="catalog-intro-copy"><span class="eyebrow">ÜNÜVAR AYDINLATMA KATALOĞU</span>
      <h1 id="catalog-title">Mekânın ışığı.<br>Aydınlatma koleksiyonu.</h1>
      <p>Lineer armatürlerden dekoratif sarkıtlara, bahçe aydınlatmasından teknik çözümlere. Ürünleri ve ölçülerini kataloğumuzdan inceleyin.</p>
      <div class="catalog-actions"><a class="button yellow" href="#katalog-okuyucu">Kataloğu incele {icon("arrow")}</a>
      <a class="button outline" href="{pdf}" download="unuvar-aydinlatma-katalog.pdf">PDF indir {icon("download")}</a></div>
      <p class="catalog-file-meta">{count} sayfa <span aria-hidden="true">·</span> {len(data["sections"])} ürün grubu <span aria-hidden="true">·</span> PDF / {data["size_label"]}</p>
      </div><a class="catalog-cover" href="#katalog-okuyucu" aria-label="{count} sayfalık kataloğu incelemeye başla">
      <img src="{pages[0]["image"]}" width="1684" height="1191" alt="Ünüvar Aydınlatma kataloğu: Mekânın ışığı" fetchpriority="high"></a>
    </div></section>
    {collection_grid(icon, full=True)}<section class="catalog-reading-section" id="katalog-okuyucu" aria-labelledby="reader-title"><div class="container">
      <div class="catalog-reading-heading"><div><span class="eyebrow">KATALOĞA GÖZ ATIN</span><h2 id="reader-title">Aradığınız bölüme geçin.</h2></div>
      <a class="text-link" href="{pdf}" target="_blank" rel="noopener">PDF’yi yeni sekmede aç {icon("up")}</a></div>
      <details class="catalog-contents"><summary>İçindekiler <span>{len(data["sections"])} ürün grubu</span></summary><nav aria-label="Katalog bölümleri">{chapters}</nav></details>
      <div class="catalog-reader" data-reader>
        <div class="catalog-toolbar" hidden data-reader-controls>
          <button type="button" class="reader-step" data-reader-prev aria-label="Önceki katalog sayfası" disabled>← <span>Önceki</span></button>
          <div class="reader-page-field"><label for="reader-page">Sayfa</label><select id="reader-page">{options}</select><span>/ {count}</span></div>
          <button type="button" class="reader-step" data-reader-next aria-label="Sonraki katalog sayfası"><span>Sonraki</span> →</button>
        </div>
        <div class="reader-canvas" aria-busy="false">
          <img data-reader-image src="{pages[0]["image"]}" width="1684" height="1191" alt="Katalog sayfa 1: Kapak" loading="lazy" decoding="async">
          <p class="reader-error" data-reader-error hidden>Bu sayfanın önizlemesi yüklenemedi. Kataloğu aşağıdaki PDF bağlantısından açabilirsiniz.</p>
        </div>
        <div class="catalog-reader-footer"><p data-reader-status role="status" aria-live="polite" aria-atomic="true">Sayfa 1 / {count} · Kapak</p>
        <div><a class="text-link" data-reader-large href="{pages[0]["image"]}" target="_blank" rel="noopener">Sayfayı büyüt {icon("up")}</a>
        <a class="text-link" data-reader-pdf href="{pdf}#page=1" target="_blank" rel="noopener">PDF’de aç {icon("up")}</a></div></div>
        <noscript><p class="reader-noscript">Tüm sayfalara ulaşmak için PDF’yi açın. İçindekiler bağlantıları PDF’de ilgili sayfaya gider.</p></noscript>
      </div>
      <div class="catalog-enquiry"><div><h3>Beğendiğiniz ürünün kodunu bize iletin.</h3><p>Güncel fiyat, stok, ölçü ve teknik özellikleri birlikte teyit edelim.</p></div>
      <a href="/iletisim/?sayfa=1#teklif" class="button yellow" data-reader-enquiry>Bu sayfadan ürün sorun {icon("arrow")}</a></div>
      <p class="catalog-source-note">Katalogdaki teknik bilgiler ürün koduna göre teyit edilir. “Teyit gerekli” olarak işaretlenen ölçüler için mağazamızla görüşebilirsiniz.</p>
    </div></section>'''
