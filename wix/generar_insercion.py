"""Genera el código para el sitio oficial (Wix › Código personalizado) y la página propia del lector (sitio headless).
Uso:
  python3 generar_insercion.py BASE_URL [BASE_URL_ALTERNA] URL_COMPLETA > insercion.html
  python3 generar_insercion.py --cargador BASE_URL [BASE_URL_ALTERNA] > index.html
BASE_URL: jsDelivr fijado a un commit (https://cdn.jsdelivr.net/gh/USUARIO/REPO@SHA/).
BASE_URL_ALTERNA: la misma versión por otra red; si se omite, se deduce de BASE_URL (rawcdn.githack.com).
URL_COMPLETA: la página propia del lector (sitio headless); la inserción la abre primero y, si no arranca,
arma el lector dentro de la página; también es el enlace de respaldo."""
import sys, re, pathlib
def barra(u): return u if u.endswith("/") else u + "/"
def alterna(base):
    m = re.match(r"https://cdn\.jsdelivr\.net/gh/([^/]+)/([^@/]+)@([^/]+)/", base)
    if not m: sys.exit("No se pudo deducir la red alterna de " + base + "; pásala como argumento.")
    return "https://rawcdn.githack.com/%s/%s/%s/" % m.groups()
args = sys.argv[1:]
cargador = bool(args) and args[0] == "--cargador"
if cargador: args = args[1:]
if not args: sys.exit(__doc__)
base = barra(args[0])
if cargador:
    base2 = barra(args[1]) if len(args) > 1 else alterna(base)
    completo = ""
else:
    if len(args) == 2: base2, completo = alterna(base), args[1]
    elif len(args) >= 3: base2, completo = barra(args[1]), args[2]
    else: sys.exit(__doc__)
    if not completo.endswith("/"): completo += "/"
nombre = "cargador.plantilla.html" if cargador else "insercion.plantilla.html"
t = (pathlib.Path(__file__).parent / nombre).read_text(encoding="utf-8")
out = t.replace("__BASE__", base).replace("__BASE2__", base2).replace("__COMPLETO__", completo)
sys.stdout.write(out)
sys.stderr.write("caracteres: %d%s\n" % (len(out), "" if cargador else " (límite de Wix: 15000)"))
