"""Genera el código que se inserta en el sitio oficial (Wix › Código personalizado) a partir de la plantilla.
Uso: python3 generar_insercion.py BASE_URL BASE_URL_ALTERNA URL_COMPLETA > insercion.html
BASE_URL: jsDelivr fijado a un commit; BASE_URL_ALTERNA: la misma versión por otra red (rawcdn.githack.com);
URL_COMPLETA: el lector a pantalla completa (sitio headless), que también sirve de segunda vía y de enlace de respaldo."""
import sys, pathlib
def barra(u): return u if u.endswith("/") else u + "/"
base, base2 = barra(sys.argv[1]), barra(sys.argv[2])
completo = sys.argv[3] if len(sys.argv) > 3 else ""
t = (pathlib.Path(__file__).parent / "insercion.plantilla.html").read_text(encoding="utf-8")
out = t.replace("__BASE__", base).replace("__BASE2__", base2).replace("__COMPLETO__", completo)
sys.stdout.write(out)
sys.stderr.write("caracteres: %d (límite de Wix: 15000)\n" % len(out))
