"""Builds kids-christmas-reel.html from kids-template.html (inlines photos,
Santa, snowman and gift artwork).  Run:  python3 reel/build-kids.py"""
import base64, io, pathlib, re
from PIL import Image, ImageOps

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
tpl = (HERE / "kids-template.html").read_text(encoding="utf-8")
SANTA = re.search(r'<svg viewBox="0 0 160 170".*?</svg>', (ROOT / "index.html").read_text(encoding="utf-8"), re.S).group(0)

def santa(p):
    return SANTA.replace('id="sp', f'id="{p}').replace("url(#sp", f"url(#{p}")

def snowman(p):
    return f'''<svg viewBox="0 0 200 270" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <radialGradient id="{p}w" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#eef3f7"/><stop offset="1" stop-color="#c9d6e2"/></radialGradient>
    <linearGradient id="{p}hat" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d4495e"/><stop offset="1" stop-color="#7a1628"/></linearGradient>
    <linearGradient id="{p}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7e3b3"/><stop offset=".5" stop-color="#c99a4e"/><stop offset="1" stop-color="#f7e3b3"/></linearGradient>
  </defs>
  <path d="M58 122 L18 92 M30 101 L20 112 M28 99 L22 84" stroke="#6b4a2b" stroke-width="5" stroke-linecap="round" fill="none"/>
  <g class="snow__arm"><path d="M142 122 L184 88 M172 98 L188 100 M170 96 L176 80" stroke="#6b4a2b" stroke-width="5" stroke-linecap="round" fill="none"/></g>
  <circle cx="100" cy="206" r="62" fill="url(#{p}w)"/>
  <circle cx="100" cy="128" r="46" fill="url(#{p}w)"/>
  <circle cx="100" cy="66" r="36" fill="url(#{p}w)"/>
  <circle cx="100" cy="122" r="4.5" fill="#2b2320"/><circle cx="100" cy="140" r="4.5" fill="#2b2320"/><circle cx="100" cy="190" r="5" fill="#2b2320"/>
  <circle cx="86" cy="60" r="4.5" fill="#2b2320"/><circle cx="114" cy="60" r="4.5" fill="#2b2320"/>
  <circle cx="80" cy="74" r="6" fill="#f19a9a" opacity=".55"/><circle cx="120" cy="74" r="6" fill="#f19a9a" opacity=".55"/>
  <path d="M100 66 L130 72 L100 76 Z" fill="#f08a2c"/>
  <path d="M88 82 q12 9 24 0" stroke="#2b2320" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M64 96 Q100 110 136 96 L136 108 Q100 122 64 108 Z" fill="url(#{p}hat)"/>
  <path d="M118 104 L132 146 L118 148 L108 110 Z" fill="url(#{p}hat)"/>
  <path d="M120 140 h12 M118 132 h12" stroke="url(#{p}g)" stroke-width="3"/>
  <path d="M66 46 C66 14 96 4 118 14 C128 20 132 30 134 40 L122 44 C120 36 114 32 108 32 C118 36 132 40 134 46 Z" fill="url(#{p}hat)"/>
  <rect x="62" y="38" width="76" height="16" rx="8" fill="#fff8ee" stroke="url(#{p}g)" stroke-width="1.6"/>
  <circle cx="136" cy="40" r="9" fill="#fff8ee" stroke="url(#{p}g)" stroke-width="1.4"/>
</svg>'''

def gift(p, box, dark, ribbon="url(#{p}r)"):
    ribbon = ribbon.format(p=p)
    return f'''<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="{p}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{box}"/><stop offset="1" stop-color="{dark}"/></linearGradient>
    <linearGradient id="{p}r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7e3b3"/><stop offset=".5" stop-color="#c99a4e"/><stop offset="1" stop-color="#f7e3b3"/></linearGradient>
  </defs>
  <rect x="14" y="48" width="92" height="68" rx="6" fill="url(#{p}b)"/>
  <rect x="8" y="34" width="104" height="20" rx="5" fill="url(#{p}b)" stroke="rgba(255,255,255,.18)"/>
  <rect x="52" y="34" width="16" height="82" fill="{ribbon}"/>
  <path d="M60 34 C44 10 22 14 30 28 C34 36 50 36 60 34 Z M60 34 C76 10 98 14 90 28 C86 36 70 36 60 34 Z" fill="{ribbon}" stroke="#a87a35" stroke-width="1.2"/>
  <circle cx="60" cy="33" r="6" fill="{ribbon}" stroke="#a87a35" stroke-width="1.2"/>
</svg>'''

def photo(name, size, centering=(0.5, 0.5)):
    im = ImageOps.fit(Image.open(ROOT / "images" / name).convert("RGB"), size, Image.LANCZOS, centering=centering)
    buf = io.BytesIO(); im.save(buf, "JPEG", quality=84, optimize=True, progressive=True)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()

VALUES = dict(
    SANTA_A=santa("sa"), SANTA_B=santa("sb"),
    SNOW_A=snowman("na"), SNOW_B=snowman("nb"), SNOW_C=snowman("nc"),
    GIFT_RED=gift("g1", "#c53a50", "#6a1422"), GIFT_GREEN=gift("g2", "#2f7a55", "#123824"),
    GIFT_GOLD=gift("g3", "#fff8ee", "#e6d3b0", "#b3283f"), GIFT_GREEN2=gift("g4", "#2f7a55", "#123824"),
    GIFT_RED2=gift("g5", "#c53a50", "#6a1422"),
    IMG_MAIN=photo("kids-cookie-decorating-poster.jpg", (960, 640)),
    IMG_K1=photo("kids-kit-cookie-box.jpg", (320, 320)),
    IMG_K2=photo("kids-kit-cupcake-tree.jpg", (320, 320)),
    IMG_K3=photo("kids-kit-gingerbread-house.jpg", (320, 320)),
)
out = tpl
for k, v in VALUES.items():
    out = out.replace("{{" + k + "}}", v)
assert not re.findall(r"\{\{[A-Z0-9_]+\}\}", out)
dst = HERE / "kids-christmas-reel.html"
dst.write_text(out, encoding="utf-8")
print(dst.name, round(len(out.encode()) / 1024), "KB")
