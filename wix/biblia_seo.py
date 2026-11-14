#!/usr/bin/env python3
# AB1 y AB2 (BiEx, 14-nov-2026): páginas rastreables para los buscadores. El lector es una aplicación de una sola página
# (sus rutas van tras «#», que los buscadores no indexan); estas páginas estáticas dan a cada libro y a cada capítulo su
# propia dirección, con el texto de BiEx (vista Lectura), y llevan al lector en el mismo punto. Además, la página de la
# comunidad de estudio y el sitemap. Sin JavaScript, sin barras de desplazamiento, en alta definición (texto y CSS).
# Uso: python3 wix/biblia_seo.py   (desde la carpeta del lector; después, wix/sellar.py)
import json, os, re, html, hashlib, datetime
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITIO = "https://bibliaexacta.pages.dev"
SLUG = {"MAT": "mateo", "MRK": "marcos", "LUK": "lucas", "JHN": "juan", "ACT": "hechos", "ROM": "romanos", "1CO": "1-corintios", "2CO": "2-corintios",
        "GAL": "galatas", "EPH": "efesios", "PHP": "filipenses", "COL": "colosenses", "1TH": "1-tesalonicenses", "2TH": "2-tesalonicenses",
        "1TI": "1-timoteo", "2TI": "2-timoteo", "TIT": "tito", "PHM": "filemon", "HEB": "hebreos", "JAS": "jacobo", "1PE": "1-pedro",
        "2PE": "2-pedro", "1JN": "1-juan", "2JN": "2-juan", "3JN": "3-juan", "JUD": "judas", "REV": "revelacion"}
e = html.escape
libros = {c: json.load(open(os.path.join(R, "datos/libros", c + ".json"), encoding="utf-8")) for c in SLUG}
crono = json.load(open(os.path.join(R, "datos/cronologia.json"), encoding="utf-8"))
orden = [c for c in (crono.get("ordenes", {}).get("crono") or list(SLUG)) if c in SLUG]
for c in SLUG:
    if c not in orden: orden.append(c)
css = open(os.path.join(R, "wix/biblia.css"), encoding="utf-8").read()
v_css = hashlib.sha1(css.encode()).hexdigest()[:10]
os.makedirs(os.path.join(R, "biblia"), exist_ok=True)
open(os.path.join(R, "biblia/biblia.css"), "w", encoding="utf-8").write(css)
HOY = datetime.date.today().isoformat()

def nombre(b): return b["t"] + " [" + b["n"] + "]" if b.get("t") and b["t"] != b["n"] else b["n"]
def plano(t): return re.sub(r"\s+", " ", re.sub(r"[ⁿᵐᶠ⟪⟫]", "", t or "")).strip()
def texto_verso(x):
    """Lectura (organizada si existe), con los pasajes añadidos después en violeta y cursiva (regla 15)."""
    org = isinstance(x.get("o"), str) and x["o"]
    t = x["o"] if org else (x.get("t") or "")
    sp = x.get("ox" if org else "x") or []
    if not sp: return e(t)
    out, k = [], 0
    for a, z in sorted(sp):
        out.append(e(t[k:a])); out.append('<span class="an">⟦' + e(t[a:z]) + '⟧</span>'); k = z
    out.append(e(t[k:])); return "".join(out)
def cab(titulo, desc, url, ld, extra=""):
    return ('<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            '<title>' + e(titulo) + '</title>\n<meta name="description" content="' + e(desc) + '">\n<link rel="canonical" href="' + url + '">\n'
            '<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">\n<meta name="theme-color" content="#09090a">\n'
            '<meta property="og:type" content="article">\n<meta property="og:site_name" content="Biblia Exacta (BiEx)">\n<meta property="og:locale" content="es_LA">\n'
            '<meta property="og:title" content="' + e(titulo) + '">\n<meta property="og:description" content="' + e(desc) + '">\n<meta property="og:url" content="' + url + '">\n'
            '<meta property="og:image" content="' + SITIO + '/og.jpg">\n<meta name="twitter:card" content="summary_large_image">\n'
            '<link rel="icon" href="/favicon.ico" sizes="48x48">\n<link rel="icon" href="/icono/icono.svg" type="image/svg+xml">\n<link rel="apple-touch-icon" href="/icono/apple-touch-icon.png">\n'
            '<link rel="preload" href="/fuentes/biex-texto.woff2" as="font" type="font/woff2" crossorigin>\n<link rel="stylesheet" href="/biblia/biblia.css?v=' + v_css + '">\n'
            '<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False, separators=(",", ":")) + '</script>\n' + extra + '</head>\n<body>\n'
            '<header class="b-cab"><a class="b-marca" href="/" aria-label="Biblia Exacta, inicio del lector"><span class="b-sello">BiEx</span><span class="b-nom">Biblia Exacta</span></a>'
            '<nav class="b-nav"><a href="/biblia/">Los 27 libros</a><a href="/comunidad/">Comunidad</a><a class="b-abrir" href="/">Abrir el lector</a></nav></header>\n')
PIE = ('<footer class="b-pie-sitio"><p class="b-autoria">Traducción, transliteración y análisis: <strong>BiEx – Biblia Exacta ©™</strong> · '
       '<a href="https://bibliaexacta.wixsite.com/biex">Sitio oficial</a></p>'
       '<p class="b-cred">Texto griego y datos morfológicos: TAGNT de STEPBible.org, MACULA Greek Linguistic Datasets [Conjuntos de Datos Lingüísticos del Griego MACULA] y SBLGNT, con licencia CC BY 4.0. '
       'Ningún verso se da por terminado: la traducción sigue abierta a ajustes; lo que aún no tiene traducción fijada se muestra en griego.</p></footer>\n</body>\n</html>\n')
ORG = {"@type": "Organization", "@id": SITIO + "/#org", "name": "Biblia Exacta", "alternateName": ["BiEx", "BiEx – Biblia Exacta", "BiEx Biblia", "BiEx Biblia Exacta", "Biblia Exacta BiEx", "Biblia BiEx"], "url": SITIO + "/"}
urls = [(SITIO + "/", "daily", "1.0"), (SITIO + "/biblia/", "weekly", "0.9"), (SITIO + "/comunidad/", "weekly", "0.8"), (SITIO + "/escudrina/", "weekly", "0.8"), (SITIO + "/privacidad.html", "monthly", "0.3")]
def migas(*p):
    return {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n, "item": u} for i, (n, u) in enumerate(p)]}
# --- cada capítulo
pares = [(c, k + 1) for c in orden for k in range(len(libros[c]["caps"]))]
for idx, (c, cap) in enumerate(pares):
    b = libros[c]; vs = b["caps"][str(cap)]; s = SLUG[c]
    url = SITIO + "/biblia/" + s + "/" + str(cap) + "/"
    prim = plano(vs[0].get("o") or vs[0].get("t") or "") if vs else ""
    titulo = b["n"] + " " + str(cap) + " · " + b["t"] + " · Biblia Exacta (BiEx)"
    desc = (b["n"] + " " + str(cap) + " en la Biblia Exacta (BiEx), traducido del griego palabra por palabra: " + prim)[:157].rstrip() + "…"
    ld = {"@context": "https://schema.org", "@graph": [ORG, migas(("Biblia Exacta", SITIO + "/"), ("La Nueva Voluntad", SITIO + "/biblia/"), (nombre(b), SITIO + "/biblia/" + s + "/"), (b["n"] + " " + str(cap), url)),
          {"@type": "WebPage", "@id": url, "url": url, "name": titulo, "inLanguage": "es", "isPartOf": {"@id": SITIO + "/#web"}, "publisher": {"@id": SITIO + "/#org"}}]}
    ant = pares[idx - 1] if idx > 0 else None; sig = pares[idx + 1] if idx + 1 < len(pares) else None
    enl = lambda p: '/biblia/' + SLUG[p[0]] + '/' + str(p[1]) + '/'
    cuerpo = "".join('<p class="b-v" id="v' + str(x["v"]) + '"><a class="b-n" href="/#/' + c + '/' + str(cap) + '/l/' + str(x["v"]) + '" aria-label="Verso ' + str(x["v"]) + ' en el lector">' + str(x["v"]) + '</a> ' + texto_verso(x) + '</p>\n' for x in vs)
    h = (cab(titulo, desc, url, ld) + '<main class="b-hoja">\n<nav class="b-migas" aria-label="Ruta"><a href="/biblia/">La Nueva Voluntad</a><span>›</span><a href="/biblia/' + s + '/">' + e(nombre(b)) + '</a><span>›</span>Capítulo ' + str(cap) + '</nav>\n'
         '<h1><span class="b-t">' + e(b["t"]) + '</span> <span class="b-tn">«' + e(b["n"]) + '»</span> <span class="b-cap">' + str(cap) + '</span></h1>\n'
         '<p class="b-intro">Traducción de BiEx – Biblia Exacta ©™ desde el griego, palabra por palabra (vista Lectura). En el lector: la vista Textual en el orden del griego, el análisis de cada palabra, los manuscritos más antiguos y las referencias cruzadas.</p>\n'
         '<p class="b-accion"><a class="b-btn" href="/#/' + c + '/' + str(cap) + '">Leer con el análisis de cada palabra</a></p>\n'
         '<div class="b-texto">\n' + cuerpo + '</div>\n'
         '<nav class="b-sigue" aria-label="Capítulos">' + ('<a rel="prev" href="' + enl(ant) + '">‹ ' + e(libros[ant[0]]["n"]) + ' ' + str(ant[1]) + '</a>' if ant else '<span></span>') +
         '<a href="/biblia/' + s + '/">Capítulos</a>' + ('<a rel="next" href="' + enl(sig) + '">' + e(libros[sig[0]]["n"]) + ' ' + str(sig[1]) + ' ›</a>' if sig else '<span></span>') + '</nav>\n</main>\n' + PIE)
    d = os.path.join(R, "biblia", s, str(cap)); os.makedirs(d, exist_ok=True)
    open(os.path.join(d, "index.html"), "w", encoding="utf-8").write(h)
    urls.append((url, "weekly", "0.7"))
# --- cada libro
for c in orden:
    b = libros[c]; s = SLUG[c]; url = SITIO + "/biblia/" + s + "/"; n = len(b["caps"])
    titulo = b["n"] + " (" + b["t"] + ") · Biblia Exacta (BiEx) · del griego, palabra por palabra"
    desc = b["n"] + " en la Biblia Exacta (BiEx): " + str(n) + (" capítulo" if n == 1 else " capítulos") + " traducidos del griego al español palabra por palabra, con el análisis morfológico de cada palabra."
    ld = {"@context": "https://schema.org", "@graph": [ORG, migas(("Biblia Exacta", SITIO + "/"), ("La Nueva Voluntad", SITIO + "/biblia/"), (nombre(b), url)),
          {"@type": "WebPage", "@id": url, "url": url, "name": titulo, "inLanguage": "es", "publisher": {"@id": SITIO + "/#org"}}]}
    caps = "".join('<li><a href="' + str(k) + '/">' + str(k) + '</a></li>' for k in range(1, n + 1))
    h = (cab(titulo, desc, url, ld) + '<main class="b-hoja">\n<nav class="b-migas" aria-label="Ruta"><a href="/biblia/">La Nueva Voluntad</a><span>›</span>' + e(nombre(b)) + '</nav>\n'
         '<h1><span class="b-t">' + e(b["t"]) + '</span> <span class="b-tn">«' + e(b["n"]) + '»</span></h1>\n'
         '<p class="b-intro">' + e(desc) + '</p>\n<p class="b-accion"><a class="b-btn" href="/#/' + c + '/1">Abrir ' + e(b["n"]) + ' en el lector</a></p>\n'
         '<h2 class="b-h2">Capítulos</h2>\n<ol class="b-caps">' + caps + '</ol>\n</main>\n' + PIE)
    d = os.path.join(R, "biblia", s); os.makedirs(d, exist_ok=True)
    open(os.path.join(d, "index.html"), "w", encoding="utf-8").write(h)
    urls.append((url, "weekly", "0.8"))
# --- los 27 libros
url = SITIO + "/biblia/"
lista = "".join('<li><a href="' + SLUG[c] + '/"><b>' + e(libros[c]["t"]) + '</b><small>«' + e(libros[c]["n"]) + '» · ' + str(len(libros[c]["caps"])) + (" capítulo" if len(libros[c]["caps"]) == 1 else " capítulos") + '</small></a></li>' for c in orden)
ld = {"@context": "https://schema.org", "@graph": [ORG, {"@type": "WebSite", "@id": SITIO + "/#web", "url": SITIO + "/", "name": "Biblia Exacta", "alternateName": ORG["alternateName"], "inLanguage": "es"}, migas(("Biblia Exacta", SITIO + "/"), ("La Nueva Voluntad", url))]}
h = (cab("La Nueva Voluntad · los 27 libros · Biblia Exacta (BiEx)", "Los 27 libros de la Nueva Voluntad en la Biblia Exacta (BiEx), en el orden en que ocurrieron: traducción del griego al español palabra por palabra, con análisis morfológico.", url, ld)
     + '<main class="b-hoja">\n<h1><span class="b-t">La Nueva Voluntad</span> <span class="b-tn">los 27 libros</span></h1>\n'
     '<p class="b-intro">BiEx – Biblia Exacta traduce la Nueva Voluntad del griego al español palabra por palabra. Los libros van en el orden χrοnοlόgικο de lo que narran y de su escritura.</p>\n'
     '<ol class="b-libros">' + lista + '</ol>\n</main>\n' + PIE)
open(os.path.join(R, "biblia", "index.html"), "w", encoding="utf-8").write(h)
# --- comunidad de estudio (AB2: «Comunidad de estudio», decisión de BiEx)
url = SITIO + "/comunidad/"
ld = {"@context": "https://schema.org", "@graph": [ORG, migas(("Biblia Exacta", SITIO + "/"), ("Comunidad de estudio", url)), {"@type": "WebPage", "@id": url, "url": url, "name": "Comunidad de estudio bíblico · Biblia Exacta (BiEx)", "inLanguage": "es", "publisher": {"@id": SITIO + "/#org"}}]}
sec = [("Lee en compañía", "Abre una sala de lectura y lee el mismo capítulo con otras personas en vivo: ves quién está leyendo y avanzan juntos, verso a verso."),
       ("Forma tu compañía", "Reúne a tus amigos, tu familia o tu grupo de estudio en una compañía: una meta común cada semana y la alegría de lograrla juntos."),
       ("Conoce personas que escudriñan", "En Escudriña te encuentras con lectores de tu ciudad, tu país y el mundo que estudian la Biblia en serio. Clasificaciones por ciudad, departamento o estado, país y continente."),
       ("Aprende de verdad", "Cada verso que lees cuenta: misiones pequeñas cada día, preguntas sobre lo leído, hallazgos y un árbol que crece con tu siembra. Nada se compra con dinero."),
       ("Con respeto", "Una comunidad para estudiar con altura: sin datos personales a la vista, con reportes y revisión del equipo. Las conversaciones se cuidan para que todos se sientan en casa.")]
cuerpo = "".join('<section class="b-sec"><h2 class="b-h2">' + e(t) + '</h2><p>' + e(p) + '</p></section>' for t, p in sec)
h = (cab("Comunidad de estudio bíblico · conoce personas que escudriñan la Biblia · BiEx", "Únete a la comunidad de estudio de Biblia Exacta (BiEx): lee en compañía, forma tu grupo y conoce personas que estudian la Biblia en serio, palabra por palabra desde el griego.", url, ld)
     + '<main class="b-hoja">\n<h1><span class="b-t">Comunidad de estudio</span> <span class="b-tn">conoce personas que escudriñan la Biblia</span></h1>\n'
     '<p class="b-intro">Biblia Exacta (BiEx) no es solo una traducción palabra por palabra desde el griego: es un lugar para estudiar la Escritura con otras personas que también buscan entenderla a fondo.</p>\n'
     '<p class="b-accion"><a class="b-btn" href="/#/escudrina">Entrar a Escudriña</a> <a class="b-btn b-btn2" href="/biblia/">Leer la Nueva Voluntad</a></p>\n' + cuerpo + '\n</main>\n' + PIE)
os.makedirs(os.path.join(R, "comunidad"), exist_ok=True)
open(os.path.join(R, "comunidad", "index.html"), "w", encoding="utf-8").write(h)
# --- sitemap
sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join('  <url><loc>' + u + '</loc><lastmod>' + HOY + '</lastmod><changefreq>' + f + '</changefreq><priority>' + p + '</priority></url>\n' for u, f, p in urls) + '</urlset>\n'
open(os.path.join(R, "sitemap.xml"), "w", encoding="utf-8").write(sm)
print("páginas:", len(pares), "capítulos +", len(orden), "libros + índice y comunidad · sitemap:", len(urls), "direcciones")
