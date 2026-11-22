"""Builds reel-15s.html: inlines the photos (base64) into reel-template.html
so the reel is a single self-contained file.  Run:  python3 reel/build.py"""
import base64, io, pathlib
from PIL import Image, ImageOps

HERE = pathlib.Path(__file__).resolve().parent
IMAGES = HERE.parent / "images"
SLOTS = {   # placeholder: (photo, size)
    "IMG_A": ("birthday-macarons.jpg", (900, 1068)),
    "IMG_B": ("hospitality-dessert-cups.jpg", (900, 1068)),
    "IMG_C": ("christmas-chocolate-pinecones.jpg", (900, 1068)),
    "IMG_D": ("christmas-snow-gold-2026.jpg", (480, 611)),
    "IMG_E": ("birthday-unicorn.jpg", (480, 611)),
    "IMG_F": ("christmas-newyear-red-bow.jpg", (480, 611)),
    "IMG_G": ("kids-kit-cookie-box.jpg", (480, 611)),
}
html = (HERE / "reel-template.html").read_text(encoding="utf-8")
for key, (name, size) in SLOTS.items():
    im = ImageOps.fit(Image.open(IMAGES / name).convert("RGB"), size, Image.LANCZOS, centering=(0.5, 0.45))
    buf = io.BytesIO(); im.save(buf, "JPEG", quality=82, optimize=True, progressive=True)
    html = html.replace("{{" + key + "}}", "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode())
out = HERE / "reel-15s.html"
out.write_text(html, encoding="utf-8")
print(out, round(out.stat().st_size / 1024), "KB")
