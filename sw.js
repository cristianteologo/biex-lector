/* BiEx · trabajador de servicio (service worker) para leer sin conexión.
   Estrategia: con conexión, todo se pide a la red (siempre lo más reciente) y se guarda una copia; sin conexión,
   se sirve la última copia guardada. Las copias se guardan con una clave que no depende de la versión publicada
   (sin «@commit» ni «?v=»), así una actualización no deja sin lectura a quien está desconectado.
   «Descargar todo» (en el lector) pide cada archivo una vez para que quede guardado aquí. */
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
const esFuenteGoogle = (u) => u.hostname === "fonts.googleapis.com" || u.hostname === "fonts.gstatic.com";

self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith("biex-") && k !== CACHE && k !== FUENTES) await caches.delete(k);
    await self.clients.claim();
  })());
});

async function redPrimero(req, clave, esNavegacion) {
  const c = await caches.open(CACHE);
  try {
    // los archivos de otros sitios se piden con CORS para poder guardarlos completos (no opacos)
    const pedido = req.mode === "navigate" || new URL(req.url).origin === self.location.origin ? req : new Request(req.url, { mode: "cors", credentials: "omit", headers: req.headers.get("Range") ? {} : undefined });
    const r = await fetch(pedido);
    if (r && r.ok && r.status === 200 && (r.type === "basic" || r.type === "cors" || r.type === "default")) {
      c.put(clave, r.clone()).catch(() => {});
    }
    return r;
  } catch (err) {
    const copia = await c.match(clave);
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
    e.respondWith(redPrimero(req, claveDe("index.html"), true));
    return;
  }
  const r = ruta(req.url);
  if (!r || r.startsWith("__copia__/") || r.startsWith("wix/")) return;
  e.respondWith(redPrimero(req, claveDe(r), false));
});

// El lector pregunta qué hay guardado (para mostrar el avance de «Descargar todo») y puede borrar la copia
self.addEventListener("message", (e) => {
  const d = e.data || {};
  const puerto = e.ports && e.ports[0];
  if (d.tipo === "guardados" && puerto) {
    e.waitUntil((async () => {
      const c = await caches.open(CACHE);
      const ks = await c.keys();
      const pref = new URL("__copia__/", ALCANCE).href;
      puerto.postMessage({ rutas: ks.map((k) => k.url.startsWith(pref) ? k.url.slice(pref.length) : null).filter(Boolean) });
    })());
  } else if (d.tipo === "borrar") {
    e.waitUntil((async () => { await caches.delete(CACHE); await caches.delete(FUENTES); if (puerto) puerto.postMessage({ ok: true }); })());
  }
});
