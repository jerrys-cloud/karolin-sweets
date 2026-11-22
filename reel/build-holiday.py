"""Builds christmas-reel-15s.html and newyear-reel-15s.html from
holiday-template.html, inlining photos and the Santa artwork.
Run:  python3 reel/build-holiday.py"""
import base64, html, io, pathlib, re
from PIL import Image, ImageOps

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
IMG = ROOT / "images"
tpl = (HERE / "holiday-template.html").read_text(encoding="utf-8")
santa_src = re.search(r'<svg viewBox="0 0 160 170".*?</svg>', (ROOT / "index.html").read_text(encoding="utf-8"), re.S).group(0)

def santa(prefix):
    return santa_src.replace('id="sp', f'id="{prefix}').replace("url(#sp", f"url(#{prefix}")

def photo(name, size, box=(0, 0, 1, 1), centering=(0.5, 0.45)):
    im = Image.open(IMG / name).convert("RGB")
    w, h = im.size
    im = im.crop((int(box[0] * w), int(box[1] * h), int(box[2] * w), int(box[3] * h)))
    im = ImageOps.fit(im, size, Image.LANCZOS, centering=centering)
    buf = io.BytesIO(); im.save(buf, "JPEG", quality=82, optimize=True, progressive=True)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()

CARD, DETAIL, PHONE = (440, 580), (840, 760), (480, 470)

REELS = {
  "christmas-reel-15s.html": dict(
    THEME="xmas", TITLE="Christmas Reel",
    C1_TOP=820, C3_TOP=1050, C4_TOP=610,
    S1_AR="كعكات عيد الميلاد المجيد الفاخرة", S1_HE="עוגות כריסמס יוקרתיות", S1_EN="Luxury Christmas Cakes",
    S2_AR="تصاميم ساحرة لكل احتفال 🎄", S2_HE="עיצובים קסומים לכל חגיגה", S2_EN="Magical Custom Designs",
    S3_AR="احجزوا كعكتكم المفضلة الآن 🎅", S3_HE="הזמינו את העוגה שלכם עכשיו", S3_EN="Reserve Yours Now",
    S4_AR="موقعنا الجديد متاح الآن! اطلبوا بضغطة واحدة 📲", S4_HE="האתר החדש באוויר!", S4_EN="Our New Website is Live!",
    TAG1="كيكة شجرة الميلاد", TAG2="كيكة جذع الشتاء", TAG3="كيكة عائلة الثلج", PHONE_CARD="",
    IMG_FAN1=photo("christmas-tree-cake.jpg", CARD),
    IMG_FAN2=photo("christmas-chocolate-pinecones.jpg", CARD),
    IMG_FAN3=photo("christmas-snowmen-cake.jpg", CARD),
    IMG_DETAIL=photo("christmas-cheesecake-berries.jpg", DETAIL),
    SANTA_1=santa("sa"), SANTA_2=santa("sb"), SANTA_3=santa("sc"),
  ),
  "newyear-reel-15s.html": dict(
    THEME="ny", TITLE="New Year Reel",
    C1_TOP=910, C3_TOP=1050, C4_TOP=730,
    S1_AR="استقبلوا العام الجديد بأفخم الحلويات ✨", S1_HE="פותחים שנה חדשה ומתוקה", S1_EN="Welcome the New Year in Luxury",
    S2_AR="كعكات مخصصة لليلة رأس السنة 🥂", S2_HE="עוגות מעוצבות לערב השנה החדשה", S2_EN="Custom New Year Cakes",
    S3_AR="اختاروا كعكتكم المفضلة من الموقع 🎁", S3_HE="בחרו את העוגה שלכם באתר", S3_EN="Pick & Order From Our Website",
    S4_AR="زوروا موقعنا واطلبوا الآن! ✨", S4_HE="היכנסו לאתר והזמינו!", S4_EN="Visit & Order Today",
    TAG1="كيكة الشوكولاتة والرمان", TAG2="كيكة الفيونكة الحمراء", TAG3="كيكة الثلج الذهبية",
    PHONE_CARD="صواني حلويات السهرة",
    # crops hide the old year numbers that appear on these cakes
    IMG_FAN1=photo("christmas-hello-newyear.jpg", CARD, box=(0, .36, 1, 1), centering=(.5, .3)),
    IMG_FAN2=photo("christmas-newyear-red-bow.jpg", CARD, box=(0, 0, 1, .66), centering=(.42, .5)),
    IMG_FAN3=photo("christmas-snow-gold-2026.jpg", CARD, box=(0, 0, 1, .6), centering=(.5, .5)),
    IMG_DETAIL=photo("hospitality-petit-fours.jpg", PHONE),
    SANTA_1="", SANTA_2="", SANTA_3="",
  ),
}
for name, cfg in REELS.items():
    out = tpl
    for k, v in cfg.items():
        v = str(v)
        if k[:2] in ("S1", "S2", "S3", "S4"):          # keep a trailing emoji on the same line as its word
            v = re.sub(r" (\S+)$", "\u00a0\\1", v)
        out = out.replace("{{" + k + "}}", v)
    left = re.findall(r"\{\{[A-Z0-9_]+\}\}", out)
    assert not left, left
    (HERE / name).write_text(out, encoding="utf-8")
    print(name, round(len(out.encode()) / 1024), "KB")
