from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[1]
app = root / "src" / "app"
public = root / "public"
app.mkdir(parents=True, exist_ok=True)
public.mkdir(parents=True, exist_ok=True)

ACCENT = (94, 234, 212)  # #5eead4
BG = (0, 0, 0)
FG = (255, 255, 255)


def make(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), BG + (255,))
    draw = ImageDraw.Draw(img)
    m = max(2, size // 10)
    draw.rectangle([size - m * 2, 0, size - 1, m * 2 - 1], fill=ACCENT + (255,))
    try:
        font = ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf", int(size * 0.62))
    except OSError:
        font = ImageFont.load_default()
    text = "R"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (size - tw) / 2 - bbox[0]
    y = (size - th) / 2 - bbox[1] - size * 0.02
    draw.text((x, y), text, font=font, fill=FG + (255,))
    return img


sizes_ico = [16, 32, 48]
ico_images = [make(s) for s in sizes_ico]
ico_path = app / "favicon.ico"
ico_images[-1].save(ico_path, format="ICO", sizes=[(s, s) for s in sizes_ico])

# Next.js app/icon.png — Google wants >= 48x48 multiples of 48
make(48).convert("RGB").save(app / "icon.png", format="PNG")
make(180).convert("RGB").save(app / "apple-icon.png", format="PNG")
# Larger PNG also at a stable public URL for explicit metadata / GSC
make(192).convert("RGB").save(public / "icon-192.png", format="PNG")
make(48).convert("RGB").save(public / "favicon-48.png", format="PNG")

print("wrote:")
for p in [ico_path, app / "icon.png", app / "apple-icon.png", public / "icon-192.png", public / "favicon-48.png"]:
    print(f"  {p} ({p.stat().st_size} bytes)")
