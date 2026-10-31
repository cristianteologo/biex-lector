"""Genera el código del sitio oficial (Wix › Código personalizado) y la página de respaldo del lector (sitio headless de Wix).
Uso habitual (solo cambia el commit fijado para la red de respaldo):
  python3 generar_insercion.py --sha SHA > insercion.html
  python3 generar_insercion.py --cargador --sha SHA > index.html
  python3 generar_insercion.py --intro > intro.html   (presentación de apertura y datos estructurados)
  python3 generar_insercion.py --intro --config plantillas/otra.json > intro.html   (otra plantilla de textos y versos)
Opciones: --completo URL (página propia del lector; por defecto GitHub Pages), --base URL y --base2 URL (de dónde carga app.js,
app.css y los datos el lector armado dentro de la página; por defecto GitHub Pages y jsDelivr fijado al SHA), --respaldo URL
(copia en Wix headless). La inserción se minimiza (sin sangrías ni comentarios de línea) y debe quedar por debajo de 15 000 caracteres."""
import sys, re, pathlib, argparse
# Alojamiento del lector: al cambiar de alojamiento (p. ej., a uno sin nombre de usuario) basta con cambiar estas dos líneas
REPO = "cristianteologo/biex-lector"
PAGES = "https://%s.github.io/%s/" % tuple(REPO.split("/"))
HEADLESS = "https://headless-acyvpvsbblb-bibliaexacta-140c.wix-site-host.com/"
barra = lambda u: u if not u or u.endswith("/") else u + "/"
ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument("--sha", help="commit del repositorio para jsDelivr / githack")
ap.add_argument("--cargador", action="store_true", help="genera la página index.html del sitio headless")
ap.add_argument("--cabecera", action="store_true", help="genera el código de la cabecera del sitio oficial (manifiesto e ícono de BiEx)")
ap.add_argument("--intro", action="store_true", help="genera el código de la presentación de apertura (comienzo del cuerpo, todas las páginas)")
ap.add_argument("--config", default="", help="con --intro: plantilla de la presentación (por defecto plantillas/presentacion.json)")
ap.add_argument("--completo", default=PAGES); ap.add_argument("--respaldo", default=HEADLESS)
ap.add_argument("--base"); ap.add_argument("--base2")
ap.add_argument("antiguos", nargs="*", help="forma antigua: URL de jsDelivr fijada a un commit (se toma su SHA); el resto se ignora")
a = ap.parse_args()
for u in a.antiguos:
    m = re.match(r"https://cdn\.jsdelivr\.net/gh/" + re.escape(REPO) + r"@([0-9a-f]{7,40})/?$", u)
    if m and not a.sha: a.sha = m.group(1)
jsd = "https://cdn.jsdelivr.net/gh/%s@%s/" % (REPO, a.sha) if a.sha else None
gh = "https://rawcdn.githack.com/%s/%s/" % (REPO, a.sha) if a.sha else None
d = pathlib.Path(__file__).parent
if a.cargador:
    base, base2 = barra(a.base or jsd), barra(a.base2 or gh)
    if not base or not base2: sys.exit("Falta --sha (o --base y --base2).")
    out = (d / "cargador.plantilla.html").read_text(encoding="utf-8").replace("__BASE__", base).replace("__BASE2__", base2)
    sys.stdout.write(out); sys.stderr.write("caracteres: %d\n" % len(out)); sys.exit()
if a.cabecera:
    # Código para la cabecera (<head>) del sitio oficial: nombre e ícono de BiEx al instalar el sitio como aplicación
    if not jsd: sys.exit("Falta --sha.")
    out = ('<link rel="manifest" href="%sapp-oficial.webmanifest">\n<link rel="apple-touch-icon" href="%sicono/apple-touch-icon.png">\n'
           '<meta name="apple-mobile-web-app-title" content="Biblia Exacta">\n<meta name="application-name" content="Biblia Exacta">\n'
           '<script>(function(){try{var m=document.querySelectorAll(\'link[rel="manifest"]\');for(var i=0;i<m.length;i++)if(m[i].href.indexOf("app-oficial.webmanifest")<0)m[i].parentNode.removeChild(m[i]);}catch(e){}})();</script>\n') % (jsd, jsd)
    sys.stdout.write(out); sys.stderr.write("caracteres: %d\n" % len(out)); sys.exit()
if a.intro:
    import hashlib
    v = hashlib.sha1((d / ".." / "intro.js").read_bytes()).hexdigest()[:10]
    t = (d / "intro.plantilla.html").read_text(encoding="utf-8").replace("__BASE__", barra(a.base or a.completo)).replace("__V__", v)
    if not re.fullmatch(r"[A-Za-z0-9_./-]*", a.config) or ".." in a.config: sys.exit("--config: ruta no válida")
    t = t.replace('    if ("__CONFIG__") s.setAttribute("data-config", "__CONFIG__");\n', "" if not a.config else '    s.setAttribute("data-config", "%s");\n' % a.config)
    t = re.sub(r"/\*.*?\*/\n", "", t, count=1, flags=re.S)
    out = "\n".join(l.strip() for l in t.splitlines() if l.strip() and not l.strip().startswith("//")) + "\n"
    sys.stdout.write(out); sys.stderr.write("caracteres: %d (límite de Wix: 15000)\n" % len(out))
    sys.exit("La inserción supera el límite de Wix." if len(out) > 15000 else 0)
base, base2 = barra(a.base or a.completo), barra(a.base2 or jsd)
if not base2: sys.exit("Falta --sha (o --base2).")
t = (d / "insercion.plantilla.html").read_text(encoding="utf-8")
t = t.replace("__BASE__", base).replace("__BASE2__", base2).replace("__COMPLETO__", barra(a.completo)).replace("__RESPALDO__", barra(a.respaldo))
# Minimizar: quitar el comentario de cabecera, las líneas de comentario y las sangrías
t = re.sub(r"/\*.*?\*/\n", "", t, count=1, flags=re.S)
lineas = [l.strip() for l in t.splitlines()]
out = "\n".join(l for l in lineas if l and not l.startswith("//")) + "\n"
sys.stdout.write(out)
sys.stderr.write("caracteres: %d (límite de Wix: 15000)\n" % len(out))
if len(out) > 15000: sys.exit("La inserción supera el límite de Wix.")
