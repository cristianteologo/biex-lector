// Prueba de humo del lector (la corre la revisión automática de cada propuesta; también en local):
// las vistas principales cargan sin errores de consola y sin desplazamiento lateral, en teléfono y en escritorio.
// Uso: python3 -m http.server 8766 (en la raíz del repositorio) y node .github/pruebas/humo.js [url]
const { chromium } = require("playwright");
const URL = process.argv[2] || "http://127.0.0.1:8766/index.html";
const RUTAS = ["#/", "#/libros", "#/MRK/1", "#/MRK/1/a", "#/JHN/3/o", "#/cronologia", "#/datos", "#/escudrina"];
const IGNORAR = /Failed to load resource|net::ERR_|\/api\/juego|status of 40[0-9]|status of 50[0-9]/;
(async () => {
  const b = await chromium.launch(); let fallos = 0;
  for (const [w, h, movil] of [[360, 780, true], [1280, 800, false]]) {
    const p = await b.newPage({ viewport: { width: w, height: h }, isMobile: movil, hasTouch: movil });
    const errores = [];
    p.on("pageerror", (e) => errores.push(e.message));
    p.on("console", (m) => { if (m.type() === "error" && !IGNORAR.test(m.text())) errores.push(m.text()); });
    await p.addInitScript(() => { try { localStorage.setItem("biex:intro:visto", "1"); } catch (e) {} });
    for (const r of RUTAS) {
      await p.goto(URL + r); await p.waitForTimeout(1800);
      const lado = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (lado > 1) { fallos++; console.log("✗ desplazamiento lateral de " + lado + " px en " + r + " a " + w + " px"); }
    }
    if (errores.length) { fallos++; console.log("✗ errores de consola a " + w + " px: " + errores.slice(0, 5).join(" | ")); }
    else console.log("✓ " + w + " px: " + RUTAS.length + " vistas sin errores de consola");
    await p.close();
  }
  await b.close();
  console.log(fallos ? "✗ " + fallos + " fallos" : "✓ prueba de humo correcta");
  process.exit(fallos ? 1 : 0);
})().catch((e) => { console.log("✗ " + e.message); process.exit(1); });
