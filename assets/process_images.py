from PIL import Image, ImageOps
import os

BASE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(BASE, "raw")
IMG = os.path.join(BASE, "img")

def save_resized(src, dest, max_w, quality=82):
    im = Image.open(src)
    im = ImageOps.exif_transpose(im)
    if im.mode != "RGB":
        im = im.convert("RGB")
    if im.width > max_w:
        h = int(im.height * (max_w / im.width))
        im = im.resize((max_w, h), Image.LANCZOS)
    im.save(dest, "JPEG", quality=quality, optimize=True)
    print(dest, im.size, os.path.getsize(dest) // 1024, "KB")

# Gallery photos
save_resized(os.path.join(RAW, "gym-1.jpeg"), os.path.join(IMG, "gym-1.jpg"), 1600)
save_resized(os.path.join(RAW, "gym-2.jpeg"), os.path.join(IMG, "gym-2.jpg"), 1600)
save_resized(os.path.join(RAW, "gym-3.jpeg"), os.path.join(IMG, "gym-3.jpg"), 1600)

# Testimonial before/after
save_resized(os.path.join(RAW, "testimonial-before.jpeg"), os.path.join(IMG, "testimonial-before.jpg"), 900)
save_resized(os.path.join(RAW, "testimonial-after.jpeg"), os.path.join(IMG, "testimonial-after.jpg"), 900)

# Favicon set from logo
logo = Image.open(os.path.join(IMG, "logo-source.jpg"))
logo = ImageOps.exif_transpose(logo).convert("RGBA")

for size in (16, 32, 48, 180, 192, 512):
    resized = logo.resize((size, size), Image.LANCZOS)
    name = "apple-touch-icon.png" if size == 180 else f"favicon-{size}.png"
    resized.save(os.path.join(IMG, name))
    print(name, resized.size)

# Multi-size .ico
icon_sizes = [(16, 16), (32, 32), (48, 48)]
logo.save(os.path.join(IMG, "favicon.ico"), sizes=icon_sizes)
print("favicon.ico written")

# Nav-sized logo (small, transparent-safe PNG)
nav_logo = logo.resize((128, 128), Image.LANCZOS)
nav_logo.save(os.path.join(IMG, "logo.png"))
print("logo.png written", nav_logo.size)
