/* BiEx · trabajador de servicio (service worker) para leer sin conexión.
   Estrategia: con conexión, todo se pide a la red (siempre lo más reciente) y se guarda una copia; sin conexión,
   se sirve la última copia guardada. Las copias se guardan con una clave que no depende de la versión publicada
   (sin «@commit» ni «?v=»), así una actualización no deja sin lectura a quien está desconectado.
   Cada copia lleva su huella (cabecera x-biex-h: los 10 primeros caracteres del SHA-1 de su contenido, la misma que
   wix/sellar.py anota en datos/archivos.json): así se sabe qué cambió en una publicación nueva y solo eso se baja.
   La copia se actualiza sola: el lector compara y baja lo cambiado al abrirse y al volver tras una hora («comparar»);
   y, si el navegador lo concede a la app instalada, también en segundo plano (periodicsync «biex-actualizar»). */
"use strict";
const CACHE = "biex-v1";
const FUENTES = "biex-fuentes-v1";
// De dónde carga el lector sus archivos: el mismo sitio, jsDelivr fijado a un commit, githack o GitHub Pages
const BASES = [
  /^https:\/\/cdn\.jsdelivr\.net\/gh\/[^/]+\/biex-lector@[^/]+\//,
  /^https:\/\/rawcdn\.githack\.com\/[^/]+\/biex-lector\/[^/]+\//,
  /^https:\/\/raw\.githack\.com\/[^/]+\/biex-lector\/[^/]+\//,
  /^https:\/\/[^/]+\.github\.io\/biex-lector\//,
];
const ALCANCE = new URL(self.registration.scope);
// Clave estable: la ruta del archivo dentro del lector (p. ej., «datos/libros/MRK.json»)
function ruta(url) {
  const u = new URL(url);
  if (u.origin === ALCANCE.origin && u.pathname.startsWith(ALCANCE.pathname)) return u.pathname.slice(ALCANCE.pathname.length) || "index.html";
  const s = u.origin + u.pathname;
  for (const re of BASES) { const m = s.match(re); if (m) return s.slice(m[0].length); }
  return null;
}
const claveDe = (r) => new Request(new URL("__copia__/" + r, ALCANCE).href);
const ESTADO = "__estado__.json"; // estado de la copia (no es un archivo del lector)
const esFuenteGoogle = (u) => u.hostname === "fonts.googleapis.com" || u.hostname === "fonts.gstatic.com";
const esVoz = (r) => /^voz\/.+\.(mp4|ogg)$/.test(r);

// ------------------------------------------------------------------ huellas y estado de la copia
const huella = async (buf) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-1", buf)).slice(0, 5), (b) => b.toString(16).padStart(2, "0")).join("");
// gen: publicación aplicada por completo · listaGen y esperados: huellas de la lista más reciente · completa: se pidió
// «Descargar todo» · voz: formato de la narración que reproduce el navegador · base y revisado: última revisión
let EST = null;
async function estado() {
  if (EST) return EST;
  try { const r = await (await caches.open(CACHE)).match(claveDe(ESTADO)); EST = r ? await r.json() : {}; } catch (e) { EST = {}; }
  if (!EST || typeof EST !== "object") EST = {};
  return EST;
}
async function anotar(cambios) {
  const e = Object.assign(await estado(), cambios);
  await (await caches.open(CACHE)).put(claveDe(ESTADO), new Response(JSON.stringify(e), { headers: { "content-type": "application/json" } }));
  return e;
}
// La lista más reciente (por su fecha) fija las huellas vigentes; una lista anterior no la reemplaza
async function vigentes(L) {
  const e = await estado();
  if (!L || !Array.isArray(L.archivos) || !L.gen || e.listaGen === L.gen) return e;
  if (e.fecha && L.fecha && L.fecha < e.fecha) return e;
  return anotar({ listaGen: L.gen, fecha: L.fecha || e.fecha || "", esperados: Object.fromEntries(L.archivos.filter((a) => a[2]).map((a) => [a[0], a[2]])) });
}
// Guarda una copia con su huella. No pisa la versión vigente con otra anterior (p. ej., la que pide una página
// que quedó abierta desde antes de una publicación nueva).
async function guardar(c, r, resp) {
  const buf = await resp.arrayBuffer();
  const h = await huella(buf);
  const clave = claveDe(r);
  const esp = ((await estado()).esperados || {})[r];
  if (esp && h !== esp) { const ant = await c.match(clave); if (ant && ant.headers.get("x-biex-h") === esp) return esp; }
  const cab = { "x-biex-h": h };
  const tipo = resp.headers.get("content-type"); if (tipo) cab["content-type"] = tipo;
  await c.put(clave, new Response(buf, { status: 200, headers: cab }));
  return h;
}
async function enTandas(lista, n, fn) {
  const out = new Array(lista.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, lista.length) }, async () => { while (i < lista.length) { const k = i++; out[k] = await fn(lista[k], k); } }));
  return out;
}
// Qué hay que (volver a) bajar de una lista [ruta, bytes, huella]: lo guardado con otra huella y, si la copia es
// completa, lo que nunca se guardó (de la narración, solo el formato elegido). Las copias de antes de las huellas
// se miden aquí mismo, sin volver a bajarlas.
async function comparar(lista, completa, voz) {
  const c = await caches.open(CACHE);
  const res = await enTandas(lista, 8, async ([r, b, h]) => {
    const m = await c.match(claveDe(r));
    if (!m) return completa && (!esVoz(r) || (voz && r.endsWith("." + voz))) ? { r } : null;
    let hm = m.headers.get("x-biex-h");
    if (!hm) { try { hm = await guardar(c, r, m); } catch (e) { hm = ""; } }
    return h && hm !== h ? { r, cambia: true } : { r, b: b || 0, ok: true };
  });
  const faltan = []; let hay = 0, guardados = 0, cambian = 0;
  for (const x of res) {
    if (!x) continue;
    if (x.ok) { hay += x.b; guardados++; } else { faltan.push(x.r); if (x.cambia) { cambian++; guardados++; } }
  }
  return { faltan, cambian, hay, guardados };
}

// ------------------------------------------------------------------ actualización en segundo plano
// Publicación vigente: la página de inicio del sitio dice de dónde carga el lector (BIEX_BASES); si no, de aquí mismo
function basesDe(html) {
  let b = [];
  const m = /BIEX_BASES\s*=\s*(\[[^\]]*\])/.exec(html);
  try { if (m) b = JSON.parse(m[1]).filter((u) => typeof u === "string" && /^https:\/\/[^\s"'<>]+\/$/.test(u)); } catch (e) { b = []; }
  return b.length ? b : [ALCANCE.href];
}
let refrescando = null;
function refrescar() {
  if (refrescando) return refrescando;
  refrescando = (async () => {
    const con = self.navigator && self.navigator.connection;
    if (con && con.saveData) return { omitido: "ahorro de datos" };
    const e = await estado();
    const c = await caches.open(CACHE);
    if (!e.completa && (await c.keys()).length < 2) return { omitido: "sin copia" };
    const pag = await fetch(new Request(ALCANCE.href, { cache: "no-store", credentials: "same-origin" }));
    if (!pag.ok) throw new Error("inicio " + pag.status);
    const html = await pag.text();
    let L = null, base = null;
    for (const b of basesDe(html)) {
      try { const x = await fetch(new Request(b + "datos/archivos.json", { mode: "cors", credentials: "omit", cache: "no-store" })); if (x.ok) { L = await x.json(); base = b; break; } } catch (er) { /* la siguiente */ }
    }
    if (!L || !Array.isArray(L.archivos)) throw new Error("sin lista de archivos");
    await vigentes(L);
    const cmp = await comparar(L.archivos, !!e.completa, e.voz);
    let fallos = 0;
    await enTandas(cmp.faltan, 4, async (r) => {
      try { const x = await fetch(new Request(base + r, { mode: "cors", credentials: "omit", cache: "no-cache" })); if (!x.ok) throw new Error(x.status); await guardar(c, r, x); }
      catch (er) { fallos++; }
    });
    const fin = { revisado: Date.now(), base };
    if (!fallos) {
      fin.gen = L.gen;
      // la página de inicio nueva, al final: sin conexión se abre ya la versión que quedó completa
      await guardar(c, "index.html", new Response(html, { headers: { "content-type": pag.headers.get("content-type") || "text/html; charset=utf-8" } }));
    }
    await anotar(fin);
    const aviso = { biex: "copia", bajados: cmp.faltan.length - fallos, fallos, gen: L.gen };
    for (const cl of await self.clients.matchAll({ type: "window" })) cl.postMessage(aviso);
    return aviso;
  })().finally(() => { refrescando = null; });
  return refrescando;
}

// ------------------------------------------------------------------ ciclo de vida y peticiones
self.addEventListener("install", () => { self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith("biex-") && k !== CACHE && k !== FUENTES) await caches.delete(k);
    await self.clients.claim();
  })());
});

async function redPrimero(e, req, r, esNavegacion) {
  const c = await caches.open(CACHE);
  try {
    // los archivos de otros sitios se piden con CORS para poder guardarlos completos (no opacos)
    const pedido = req.mode === "navigate" || new URL(req.url).origin === self.location.origin ? req : new Request(req.url, { mode: "cors", credentials: "omit", headers: req.headers.get("Range") ? {} : undefined });
    const resp = await fetch(pedido);
    if (resp && resp.ok && resp.status === 200 && (resp.type === "basic" || resp.type === "cors" || resp.type === "default")) {
      e.waitUntil(guardar(c, r, resp.clone()).catch(() => {}));
    }
    return resp;
  } catch (err) {
    const copia = await c.match(claveDe(r));
    if (copia) return copia;
    if (esNavegacion) { const ini = await c.match(claveDe("index.html")); if (ini) return ini; }
    throw err;
  }
}

async function fuentes(req) {
  const c = await caches.open(FUENTES);
  const copia = await c.match(req.url);
  if (copia) return copia;
  const r = await fetch(new Request(req.url, { mode: "cors", credentials: "omit" }));
  if (r.ok) c.put(req.url, r.clone()).catch(() => {});
  return r;
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const u = new URL(req.url);
  if (u.protocol !== "https:" && u.hostname !== "localhost") return;
  if (esFuenteGoogle(u)) { e.respondWith(fuentes(req).catch(() => fetch(req))); return; }
  if (req.mode === "navigate") {
    if (u.origin !== self.location.origin) return;
    // la página del lector (y su dirección con #/…) se guarda como «index.html»
    e.respondWith(redPrimero(e, req, "index.html", true));
    return;
  }
  if (u.searchParams.has("biex-consulta")) return; // consulta de la versión vigente: directo a la red, sin copia
  const r = ruta(req.url);
  if (!r || r.startsWith("__") || r.startsWith("wix/")) return;
  e.respondWith(redPrimero(e, req, r, false));
});

// El lector pregunta por la copia (estado, qué falta o cambió), anota lo aplicado, pide revisar o borra la copia
self.addEventListener("message", (e) => {
  const d = e.data || {};
  const puerto = e.ports && e.ports[0];
  const responder = (x) => { if (puerto) puerto.postMessage(x); };
  e.waitUntil((async () => {
    if (d.tipo === "estado") {
      const est = await estado();
      const ks = await (await caches.open(CACHE)).keys();
      responder({ gen: est.gen || null, completa: !!est.completa, voz: est.voz || null, revisado: est.revisado || 0, guardados: ks.filter((k) => !k.url.endsWith("/__copia__/" + ESTADO)).length });
    } else if (d.tipo === "comparar" && Array.isArray(d.lista)) {
      await vigentes({ archivos: d.lista, gen: d.gen, fecha: d.fecha });
      responder(await comparar(d.lista, !!d.completa, d.voz));
    } else if (d.tipo === "aplicada") {
      const cambios = { revisado: Date.now() };
      if (d.gen) cambios.gen = d.gen;
      if (d.completa) cambios.completa = true;
      if (d.voz === "ogg" || d.voz === "mp4") cambios.voz = d.voz;
      if (typeof d.base === "string") cambios.base = d.base;
      await anotar(cambios); responder({ ok: true });
    } else if (d.tipo === "refrescar") {
      responder(await refrescar().catch((er) => ({ error: String((er && er.message) || er) })));
    } else if (d.tipo === "guardados") { // lectores anteriores a las huellas
      const ks = await (await caches.open(CACHE)).keys(); const pref = new URL("__copia__/", ALCANCE).href;
      responder({ rutas: ks.map((k) => (k.url.startsWith(pref) ? k.url.slice(pref.length) : null)).filter((x) => x && x !== ESTADO) });
    } else if (d.tipo === "borrar") {
      await caches.delete(CACHE); await caches.delete(FUENTES); EST = null; responder({ ok: true });
    }
  })().catch(() => responder(null)));
});

// Actualización en segundo plano (Chrome la concede a la app instalada; como mucho, una vez al día)
self.addEventListener("periodicsync", (e) => { if (e.tag === "biex-actualizar") e.waitUntil(refrescar().catch(() => {})); });
