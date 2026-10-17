"""Pone las huellas (?v=…) para que GitHub Pages y los navegadores no sirvan versiones viejas en caché:
1. dentro de app.js, la de cada archivo que el lector carga después (busqueda.js y la narración de la guía en voz/), en const VERSIONES;
2. en index.html, la de app.css y app.js."""
import hashlib, pathlib, re
r = pathlib.Path(__file__).resolve().parent.parent
huella = lambda f: hashlib.sha1((r / f).read_bytes()).hexdigest()[:10]
app = r / "app.js"
a = app.read_text(encoding="utf-8")
for nombre in ("busqueda",):
    a, n = re.subn(r'(const VERSIONES = \{[^}]*\b' + nombre + r': ")[0-9a-f]*(")', lambda m: m.group(1) + huella(nombre + ".js") + m.group(2), a)
    if n != 1: raise SystemExit("No se encontró la huella de " + nombre + " en app.js")
# narración de la guía (voz/<voz>/<paso>.m4a y voz/marcas.json): una huella para todos los archivos
hv = hashlib.sha1(b"".join((x.read_bytes()) for x in sorted(list((r / "voz").rglob("*.m4a")) + list((r / "voz").rglob("*.opus")) + list((r / "voz").rglob("marcas.json"))))).hexdigest()[:10]
a, n = re.subn(r'(const VERSIONES = \{[^}]*\bvoz: ")[0-9a-f]*(")', lambda m: m.group(1) + hv + m.group(2), a)
if n != 1: raise SystemExit("No se encontró la huella de voz en app.js")
app.write_text(a, encoding="utf-8")
idx = r / "index.html"
s = idx.read_text(encoding="utf-8")
for f in ("app.css", "app.js"):
    hsh = huella(f)
    s = re.sub(r'(["\'])' + re.escape(f) + r'(\?v=[0-9a-f]+)?\1', lambda m: m.group(1) + f + "?v=" + hsh + m.group(1), s)
idx.write_text(s, encoding="utf-8")
print("app.js e index.html sellados")
