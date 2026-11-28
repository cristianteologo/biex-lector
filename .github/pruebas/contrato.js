// Contrato de datos (AM5, BiEx, 27-nov-2026; regla 1 de blindaje de la guía del colaborador): todo nombre que la página lee
// existe en alguna parte: en su propio código, en los datos publicados, en el navegador o en el servidor del juego. Un nombre
// que no existe en ninguna (como «lanzado», que el servidor nunca envió) hace fallar la revisión automática.
// Uso: node .github/pruebas/contrato.js [url]                        revisión (el lector servido en http://127.0.0.1:8766)
//      node .github/pruebas/contrato.js --servidor <carpeta de biex-juego>   rehace .github/contrato/servidor.json
// servidor.json guarda solo los nombres del servidor que la página lee (nada más del código privado). Quien haga que la página
// lea un dato nuevo del servidor lo rehace con el código real del servidor; si no tiene acceso, lo pide (no se adivina).
const fs = require("fs"), path = require("path"), acorn = require("acorn"), walk = require("acorn-walk");
const RAIZ = path.resolve(__dirname, "..", ".."), DIR = path.join(RAIZ, ".github", "contrato");
const PAGINA = ["app.js", "juego.js", "busqueda.js", "intro.js", "intro-cargador.js", "sw.js"];
const camel = (s) => s.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
const SQL = /\bSELECT\s+([\s\S]+?)\s+FROM\b/i;
function analizar(src, archivo, modulo, def, lee) {
  const ast = acorn.parse(src, { ecmaVersion: "latest", sourceType: modulo ? "module" : "script", allowHashBang: true, allowReturnOutsideFunction: true, locations: true });
  const clave = (k) => (k.type === "Identifier" ? k.name : k.type === "Literal" && typeof k.value === "string" ? k.value : null);
  const texto = (s) => {
    if (/^data-[a-z0-9-]+$/.test(s)) def.add(camel(s.slice(5)));            // atributos data-* → dataset.nombre
    else if (/^[A-Za-z_$][\w$]*$/.test(s)) def.add(s);                       // claves escritas como texto
    const m = SQL.exec(s); if (m) for (const c of m[1].split(",")) { const a = /([A-Za-z_]\w*)\s*$/.exec(c.trim()); if (a) def.add(a[1]); }
  };
  walk.full(ast, (n) => {
    if ((n.type === "Property" || n.type === "PropertyDefinition" || n.type === "MethodDefinition") && !n.computed) { const k = clave(n.key); if (k) texto(k); }
    else if (n.type === "AssignmentExpression" && n.left.type === "MemberExpression" && !n.left.computed && n.left.property.type === "Identifier") def.add(n.left.property.name);
    else if (n.type === "MemberExpression" && n.computed && n.property.type === "Literal" && typeof n.property.value === "string") def.add(n.property.value);
    else if (n.type === "Literal" && typeof n.value === "string") texto(n.value);
    else if (n.type === "TemplateElement" && n.value.cooked) texto(n.value.cooked);
    if (lee && n.type === "MemberExpression" && !n.computed && n.property.type === "Identifier") {
      const k = n.property.name; if (!lee.has(k)) lee.set(k, archivo + ":" + n.loc.start.line);
    }
  });
}
function pagina() {
  const def = new Set(), lee = new Map();
  for (const f of PAGINA) analizar(fs.readFileSync(path.join(RAIZ, f), "utf8"), f, false, def, lee);
  // páginas HTML: sus scripts en línea (definen window.BIEX_*…) y sus atributos data-*
  for (const f of ["index.html", "artifact.html", "404.html", "privacidad.html"]) {
    if (!fs.existsSync(path.join(RAIZ, f))) continue;
    const html = fs.readFileSync(path.join(RAIZ, f), "utf8");
    for (const m of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) { try { analizar(m[1], f, false, def, null); } catch (e) { /* JSON-LD u otro tipo */ } }
    for (const m of html.matchAll(/\sdata-([a-z0-9-]+)=/g)) def.add(camel(m[1]));
  }
  return { def, lee };
}
function clavesDatos() {
  const s = new Set(), ver = (o) => { if (Array.isArray(o)) o.forEach(ver); else if (o && typeof o === "object") for (const k of Object.keys(o)) { s.add(k); ver(o[k]); } };
  const archivos = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? archivos(path.join(d, e.name)) : /\.(json|webmanifest)$/.test(e.name) ? [path.join(d, e.name)] : []));
  const lista = [...archivos(path.join(RAIZ, "datos")), ...fs.readdirSync(RAIZ).filter((x) => /\.(json|webmanifest)$/.test(x)).map((x) => path.join(RAIZ, x))];
  for (const d of ["widgets", "plantillas"]) if (fs.existsSync(path.join(RAIZ, d))) lista.push(...archivos(path.join(RAIZ, d)));
  for (const f of lista) { try { ver(JSON.parse(fs.readFileSync(f, "utf8"))); } catch (e) { /* no es JSON */ } }
  return s;
}
async function nativos(url) {
  const { chromium } = require("playwright");
  const b = await chromium.launch(), p = await b.newPage();
  await p.goto(url, { waitUntil: "domcontentloaded" });
  const l = await p.evaluate(() => {
    const s = new Set(), vistos = new Set();
    const poner = (o, prof) => {
      if (!o || (typeof o !== "object" && typeof o !== "function") || vistos.has(o) || prof > 3) return; vistos.add(o);
      for (let x = o, i = 0; x && i < 8; i++, x = Object.getPrototypeOf(x)) { try { for (const k of Object.getOwnPropertyNames(x)) s.add(k); } catch (e) { /* objeto cerrado */ } }
    };
    for (const k of Object.getOwnPropertyNames(window)) { s.add(k); let v; try { v = window[k]; } catch (e) { continue; } if (typeof v === "function") { poner(v, 1); if (v.prototype) poner(v.prototype, 1); } else if (v && typeof v === "object") poner(v, 1); }
    for (const o of [document, document.documentElement.style, navigator, location, history, screen, performance, Math, JSON, Intl, Reflect, console, crypto, crypto.subtle, navigator.clipboard, navigator.serviceWorker, navigator.storage, new Intl.DateTimeFormat(), new Intl.DateTimeFormat().resolvedOptions(), new URL("https://a.b/?c=1"), new Response(""), new DOMRect()]) poner(o, 0);
    return [...s];
  });
  await b.close();
  return new Set(l);
}
(async () => {
  const leerJSON = (f, d) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : d);
  const { def, lee } = pagina();
  const i = process.argv.indexOf("--servidor");
  if (i > 0) {
    const src = path.join(process.argv[i + 1], "src"), srv = new Set();
    for (const f of fs.readdirSync(src)) if (f.endsWith(".js")) analizar(fs.readFileSync(path.join(src, f), "utf8"), f, true, srv, null);
    const usados = [...lee.keys()].filter((k) => srv.has(k)).sort();
    const antes = new Set((leerJSON(path.join(DIR, "servidor.json"), { nombres: [] })).nombres);
    fs.writeFileSync(path.join(DIR, "servidor.json"), JSON.stringify({ nota: "Nombres del servidor del juego que la página lee (contrato.js --servidor). Solo esos: nada más del código privado.", generado: new Date().toISOString().slice(0, 10), nombres: usados }, null, 1) + "\n");
    const nuevos = usados.filter((k) => !antes.has(k)), fuera = [...antes].filter((k) => !usados.includes(k));
    console.log("servidor.json:", usados.length, "nombres" + (nuevos.length ? " · nuevos: " + nuevos.join(" ") : "") + (fuera.length ? " · ya no: " + fuera.join(" ") : ""));
    return;
  }
  const srv = new Set(leerJSON(path.join(DIR, "servidor.json"), { nombres: [] }).nombres);
  const exc = leerJSON(path.join(DIR, "excepciones.json"), { nombres: {} }).nombres;
  const datos = clavesDatos(), nat = await nativos(process.argv[2] || "http://127.0.0.1:8766/404.html");
  const raros = [...lee].filter(([k]) => !def.has(k) && !datos.has(k) && !nat.has(k) && !srv.has(k) && !(k in exc));
  if (raros.length) {
    console.log("✗ La página lee " + raros.length + " nombre(s) que no existen ni en su código, ni en los datos, ni en el navegador, ni en el servidor:");
    for (const [k, donde] of raros) console.log("  · " + k + " (" + donde + ")");
    console.log("Si es un dato del servidor, comprueba su nombre exacto en biex-juego y rehaz servidor.json; si es del navegador, súmalo con su motivo a .github/contrato/excepciones.json.");
    process.exit(1);
  }
  console.log("✓ contrato de datos: " + lee.size + " nombres leídos, todos con origen (" + srv.size + " del servidor)");
})().catch((e) => { console.error(e); process.exit(1); });
