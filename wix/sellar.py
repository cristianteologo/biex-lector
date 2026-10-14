"""Pone en index.html la huella de app.css y app.js (?v=…) para que GitHub Pages no sirva versiones viejas en caché."""
import hashlib, pathlib, re
r = pathlib.Path(__file__).resolve().parent.parent
idx = r / "index.html"
s = idx.read_text(encoding="utf-8")
for f in ("app.css", "app.js"):
    hsh = hashlib.sha1((r / f).read_bytes()).hexdigest()[:10]
    s = re.sub(r'(["\'])' + re.escape(f) + r'(\?v=[0-9a-f]+)?\1', lambda m: m.group(1) + f + "?v=" + hsh + m.group(1), s)
idx.write_text(s, encoding="utf-8")
print("index.html sellado")
