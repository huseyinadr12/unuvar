"""Lossless web PDF export. Requires pikepdf; never resizes/re-encodes images."""
import argparse
import base64
import hashlib
import json
from pathlib import Path

import pikepdf


def image_fingerprints(pdf):
    """Compare decoded pixels, size and mode independent of PDF stream filters."""
    fingerprints = []
    for obj in pdf.objects:
        if isinstance(obj, pikepdf.Stream) and obj.get("/Subtype") == "/Image":
            image = pikepdf.PdfImage(obj).as_pil_image()
            fingerprints.append((image.size, image.mode, hashlib.sha256(image.tobytes()).hexdigest()))
    return sorted(fingerprints)


def optimize(source, destination):
    source, destination = Path(source).resolve(), Path(destination).resolve()
    if source == destination:
        raise ValueError("Keep the original PDF; choose a separate output path.")
    destination.parent.mkdir(parents=True, exist_ok=True)
    with pikepdf.open(source) as original:
        original_images = image_fingerprints(original)
        original_pages = [bytes(page.Contents.read_bytes()) for page in original.pages]
        for obj in original.objects:
            if not isinstance(obj, pikepdf.Stream):
                continue
            filters = obj.get("/Filter")
            if isinstance(filters, pikepdf.Array) and filters[0] == "/ASCII85Decode":
                remaining = pikepdf.Array(list(filters)[1:])
                obj.write(base64.a85decode(obj.read_raw_bytes(), adobe=True), filter=remaining)
        # Remove ASCII85 wrapping, compress structural streams, put page 1 first.
        # DCT/JPEG image data passes through without another lossy encoding.
        original.save(destination, linearize=True, compress_streams=True,
                      stream_decode_level=pikepdf.StreamDecodeLevel.generalized,
                      object_stream_mode=pikepdf.ObjectStreamMode.disable)
    with pikepdf.open(destination) as result:
        assert result.is_linearized and result.check_linearization()
        assert image_fingerprints(result) == original_images, "Image pixels changed"
        assert [bytes(page.Contents.read_bytes()) for page in result.pages] == original_pages, "Page contents changed"
        assert not result.check_pdf_syntax()
        report = dict(pages=len(result.pages), images=len(original_images),
                      original_bytes=source.stat().st_size, optimized_bytes=destination.stat().st_size,
                      linearized=True, image_pixels_identical=True, page_contents_identical=True)
    print(json.dumps(report, indent=2))
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("source")
    parser.add_argument("destination")
    args = parser.parse_args()
    optimize(args.source, args.destination)
