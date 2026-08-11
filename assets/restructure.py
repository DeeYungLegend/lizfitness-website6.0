import re, os, base64, sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(BASE)
HTML_PATH = os.path.join(PROJ, "index.html")
IMG_DIR = os.path.join(BASE, "img")
CSS_DIR = os.path.join(BASE, "css")
JS_DIR = os.path.join(BASE, "js")

with open(HTML_PATH, "r", encoding="utf-8") as f:
    html = f.read()

# 1. Extract <style> -> assets/css/style.css
style_match = re.search(r"<style>(.*?)</style>", html, re.DOTALL)
with open(os.path.join(CSS_DIR, "style.css"), "w", encoding="utf-8") as f:
    f.write(style_match.group(1).strip() + "\n")
html = html[:style_match.start()] + '<link rel="stylesheet" href="assets/css/style.css">' + html[style_match.end():]

# 2. Extract both <script> blocks -> assets/js/app.js (concatenated, in order), remove both from html,
#    insert a single <script src="assets/js/app.js" defer></script> before </body>
script_matches = list(re.finditer(r"<script>(.*?)</script>", html, re.DOTALL))
combined_js = "\n\n".join(m.group(1).strip() for m in script_matches)
with open(os.path.join(JS_DIR, "app.js"), "w", encoding="utf-8") as f:
    f.write(combined_js + "\n")
# remove script blocks (iterate in reverse so earlier offsets stay valid)
for m in reversed(script_matches):
    html = html[:m.start()] + html[m.end():]
html = html.replace("</body>", '<script src="assets/js/app.js" defer></script>\n</body>')

# 3. Replace the 10 base64 images.
# indices 0 (nav logo) and 9 (footer logo) -> new logo.png (already generated, no decode needed)
# index 1 (hero) -> new gym-1.jpg (already generated, replacing old hero per "replace with current images")
# indices 2-6 (gallery x5) and 7-8 (testimonial x2) -> decode & save as -old files, preserved 1:1 for now,
#   will be swapped out via a follow-up markup edit pass.
img_pattern = re.compile(r'data:image/(png|jpeg|jpg);base64,([A-Za-z0-9+/=]+)')

gallery_names = ["gallery-old-1.jpg", "gallery-old-2.jpg", "gallery-old-3.jpg", "gallery-old-4.jpg", "gallery-old-5.jpg"]
testimonial_names = ["testimonial-old-1.jpg", "testimonial-old-2.jpg"]

counter = {"i": 0}

def repl(m):
    idx = counter["i"]
    counter["i"] += 1
    ext, data = m.group(1), m.group(2)
    if idx in (0, 9):
        return "assets/img/logo.png"
    if idx == 1:
        return "assets/img/gym-1.jpg"
    if 2 <= idx <= 6:
        name = gallery_names[idx - 2]
        with open(os.path.join(IMG_DIR, name), "wb") as f:
            f.write(base64.b64decode(data))
        return f"assets/img/{name}"
    if 7 <= idx <= 8:
        name = testimonial_names[idx - 7]
        with open(os.path.join(IMG_DIR, name), "wb") as f:
            f.write(base64.b64decode(data))
        return f"assets/img/{name}"
    raise Exception("unexpected image index " + str(idx))

html = img_pattern.sub(repl, html)

with open(HTML_PATH, "w", encoding="utf-8") as f:
    f.write(html)

print("Done. New index.html length:", len(html))
print("Remaining base64 occurrences:", len(re.findall(r'data:image', html)))
