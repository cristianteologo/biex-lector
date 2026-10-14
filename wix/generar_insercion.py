"""Genera el código que se inserta en el sitio oficial (Wix › Código personalizado) a partir de la plantilla.
Uso: python3 generar_insercion.py BASE_URL [URL_COMPLETA] > insercion.html"""
import sys, pathlib
base = sys.argv[1]
if not base.endswith("/"): base += "/"
completo = sys.argv[2] if len(sys.argv) > 2 else ""
t = (pathlib.Path(__file__).parent / "insercion.plantilla.html").read_text(encoding="utf-8")
out = t.replace("__BASE__", base).replace("__COMPLETO__", completo)
sys.stdout.write(out)
sys.stderr.write("caracteres: %d (límite de Wix: 15000)\n" % len(out))
