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
# narración de la guía (voz/<voz>/<paso>.mp4 y .ogg y voz/marcas.json): una huella para todos los archivos
hv = hashlib.sha1(b"".join((x.read_bytes()) for x in sorted(list((r / "voz").rglob("*.mp4")) + list((r / "voz").rglob("*.ogg")) + list((r / "voz").rglob("marcas.json"))))).hexdigest()[:10]
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

# política de seguridad de index.html: la huella de cada <script> en línea (si cambia uno, se actualiza sola)
import base64 as _b64
_ix = (r / "index.html").read_text(encoding="utf-8")
_hs = " ".join("'sha256-" + _b64.b64encode(hashlib.sha256(x.encode()).digest()).decode() + "'" for x in re.findall(r"<script>(.*?)</script>", _ix, re.S))
_ix2 = re.sub(r"(script-src 'self')(?: 'sha256-[A-Za-z0-9+/=]+')*", lambda m: m.group(1) + (" " + _hs if _hs else ""), _ix, count=1)
if _ix2 != _ix: (r / "index.html").write_text(_ix2, encoding="utf-8"); print("CSP actualizada")

# lista de archivos del lector para «Descargar todo» (lectura sin conexión): ruta y tamaño
import json as _json
_lista = [f for f in ("app.css", "app.js", "busqueda.js")]
_lista += sorted(str(x.relative_to(r)) for x in (r / "fuentes").glob("*.woff2") if not x.name.startswith("intro-"))
_lista += sorted(str(x.relative_to(r)) for x in (r / "datos").rglob("*") if x.is_file() and x.name != "archivos.json")
_lista += sorted(str(x.relative_to(r)) for x in (r / "voz").rglob("*") if x.is_file() and x.suffix in (".mp4", ".ogg", ".json"))
_arch = {"archivos": [[f, (r / f).stat().st_size] for f in _lista]}
(r / "datos" / "archivos.json").write_text(_json.dumps(_arch, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print("datos/archivos.json: %d archivos, %.1f MB" % (len(_lista), sum(b for _, b in _arch["archivos"]) / 1048576))
