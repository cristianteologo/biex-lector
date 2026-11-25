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

// Red primero, con plazo (BiEx, 11-nov-2026: tras un rato largo sin usarla, la app no respondía ni dejaba recargar). Con la
// conexión a medias (la red del teléfono despertando, un wifi sin salida) una petición puede quedarse colgada minutos y,
// con ella, la página y el gesto de recargar. Si hay copia guardada, la red tiene un plazo: pasado ese plazo se responde con
// la copia y la respuesta de la red, cuando llegue, se guarda igual para la próxima vez. Sin copia, se espera a la red.
// (21-nov-2026: «al volver tras un rato se recarga y se pierde tiempo») con la red lenta, la copia guardada entra antes; la red sigue y pone al día la copia
const PLAZO_NAV = 1500, PLAZO_RED = 2200;
async function redPrimero(e, req, r, esNavegacion) {
  const c = await caches.open(CACHE);
  // los archivos de otros sitios se piden con CORS para poder guardarlos completos (no opacos)
  const pedido = req.mode === "navigate" || new URL(req.url).origin === self.location.origin ? req : new Request(req.url, { mode: "cors", credentials: "omit", headers: req.headers.get("Range") ? {} : undefined });
  let paraGuardar = null, reloj = 0;
  const red = fetch(pedido).then((resp) => {
    if (resp && resp.ok && resp.status === 200 && (resp.type === "basic" || resp.type === "cors" || resp.type === "default")) paraGuardar = resp.clone();
    return resp;
  });
  e.waitUntil(red.then(() => paraGuardar && guardar(c, r, paraGuardar)).catch(() => {}));
  const guardada = async () => (await c.match(claveDe(r))) || (esNavegacion ? await c.match(claveDe("index.html")) : null) || null;
  try {
    const tarde = new Promise((ok) => { reloj = setTimeout(ok, esNavegacion ? PLAZO_NAV : PLAZO_RED, null); });
    const resp = await Promise.race([red, tarde]);
    if (resp) return resp;
    return (await guardada()) || (await red); // la red tarda: la copia si la hay; si no, se sigue esperando a la red
  } catch (err) {
    const copia = await guardada();
    if (copia) return copia;
    throw err;
  } finally { clearTimeout(reloj); }
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
  if (u.origin === self.location.origin && u.pathname.startsWith(ALCANCE.pathname + "api/")) return; // el juego: siempre a la red, sin copia
  if (req.mode === "navigate") {
    if (u.origin !== self.location.origin) return;
    // Solo la página del lector (y su dirección con #/…) se guarda como «index.html». Las demás páginas del sitio (las
    // invitaciones /e/…, /escudrina, privacidad) van directo a la red: antes se guardaban encima de la página del lector y,
    // sin conexión, la app instalada podía abrir una de ellas en su lugar.
    const resto = u.pathname.startsWith(ALCANCE.pathname) ? u.pathname.slice(ALCANCE.pathname.length) : null;
    if (resto !== "" && resto !== "index.html") return;
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
    } else if (d.tipo === "widgetDatos") {
      await guardarWidgetDatos(d);
      await actualizarWidget("biex-diario");
      responder({ ok: true });
    } else if (d.tipo === "notifConfig") {
      await guardarNotifConfig(d);
      responder({ ok: true });
    }
  })().catch(() => responder(null)));
});

// ------------------------------------------------------------------ AA12: widget de escritorio (Windows 11 / Edge)
const WIDGET_TAG = "biex-diario";
const WIDGET_DATOS = "__widget__.json";
const WIDGET_FALLBACK = {
  fecha: "BiEx",
  griego: "Ἐν ἀρχῇ ἦν ὁ λόγος,",
  texto: "En iniciación estaba siendo el discurso,",
  ref: "YÔḥānā́n [Juan] 1:1",
  ruta: "#/JHN/1/l/1",
};

async function leerWidgetDatos() {
  try {
    const r = await (await caches.open(CACHE)).match(claveDe(WIDGET_DATOS));
    return r ? await r.json() : null;
  } catch (e) { return null; }
}
async function guardarWidgetDatos(d) {
  const limpio = {
    nivel: Number(d.nivel) || 0,
    rango: String(d.rango || "").slice(0, 40),
    pers: Number(d.pers) || 0,
    hoyV: Number(d.hoyV) || 0,
    apodo: String(d.apodo || "").slice(0, 40),
    t: Date.now(),
  };
  await (await caches.open(CACHE)).put(claveDe(WIDGET_DATOS), new Response(JSON.stringify(limpio), { headers: { "content-type": "application/json" } }));
  return limpio;
}
function glosaSimple(tr) {
  let s = String(tr || "").trim();
  if (!s) return "";
  s = s.replace(/\s*\[[^\]]*\]/g, "").replace(/\s*<[^>]*>/g, "").replace(/[*ᵐᶠⁿᵖ]/g, "").replace(/\s+/g, " ").trim();
  return s;
}
async function obtenerJsonLocal(r) {
  const c = await caches.open(CACHE);
  const loc = await c.match(claveDe(r));
  if (loc) { try { return await loc.json(); } catch (e) { /* reintentar red */ } }
  try {
    const resp = await fetch(new Request(new URL(r, ALCANCE).href, { credentials: "same-origin" }));
    if (resp && resp.ok) {
      await guardar(c, r, resp.clone());
      return await resp.json();
    }
  } catch (e) { /* sin red */ }
  return null;
}
async function versoDelDia() {
  const lista = await obtenerJsonLocal("datos/destacados.json");
  const hoy = new Date();
  const fecha = hoy.toLocaleDateString("es", { day: "numeric", month: "short" });
  if (!Array.isArray(lista) || !lista.length) return Object.assign({}, WIDGET_FALLBACK, { fecha });
  const dia = Math.floor(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()) / 864e5);
  const item = lista[Math.abs(dia) % lista.length] || lista[0];
  const ps = Array.isArray(item.p) ? item.p : [];
  const griego = ps.map((w) => String(w.g || "") + String(w.pu || "").replace(/¶/g, "")).join(" ").trim() || WIDGET_FALLBACK.griego;
  const texto = ps.map((w) => glosaSimple(w.lo || w.tr) + String(w.pu || "").replace(/¶/g, "")).filter(Boolean).join(" ").trim() || WIDGET_FALLBACK.texto;
  const nom = item.t ? item.t + (item.n ? " [" + item.n + "]" : "") : (item.n || item.c || "");
  const ref = nom + " " + item.cap + ":" + item.v;
  return { fecha, griego, texto, ref, ruta: "#/" + item.c + "/" + item.cap + "/l/" + item.v };
}
async function actualizarWidget(tag) {
  if (!self.widgets || !self.widgets.updateByTag) return;
  const t = tag || WIDGET_TAG;
  try {
    const tplObj = await obtenerJsonLocal("widgets/verso-dia.json");
    if (!tplObj) return;
    const v = await versoDelDia();
    const yo = await leerWidgetDatos();
    const estado = yo && yo.nivel
      ? "Nivel " + yo.nivel + (yo.rango ? " · " + yo.rango : "") + (yo.apodo ? " (" + yo.apodo + ")" : "")
      : "Escudriña · Estudio diario";
    const sub = yo && yo.nivel
      ? (yo.pers ? "Perseverancia: " + yo.pers + (yo.pers === 1 ? " día" : " días") : "Sigue tu lectura diaria") + (yo.hoyV ? " · Hoy: " + yo.hoyV + (yo.hoyV === 1 ? " verso" : " versos") : "")
      : "Toca abajo para leer este pasaje y continuar tu avance.";
    const datos = Object.assign({}, v, { estado, sub });
    await self.widgets.updateByTag(t, { template: JSON.stringify(tplObj), data: JSON.stringify(datos) });
  } catch (e) { /* widget no instalado o sin soporte */ }
}
self.addEventListener("widgetinstall", (e) => { e.waitUntil(actualizarWidget(e.widget && e.widget.definition && e.widget.definition.tag)); });
self.addEventListener("widgetresume", (e) => { e.waitUntil(actualizarWidget(e.widget && e.widget.definition && e.widget.definition.tag)); });
self.addEventListener("widgetuninstall", () => {});
self.addEventListener("widgetclick", (e) => {
  e.waitUntil((async () => {
    const act = e.action || "";
    const data = (e.data && typeof e.data === "object") ? e.data : {};
    if (act === "actualizar") { await actualizarWidget(WIDGET_TAG); return; }
    let rutaIr = typeof data.ruta === "string" && /^#\/[A-Za-z0-9/_-]{1,80}$/.test(data.ruta) ? data.ruta : "";
    if (!rutaIr) rutaIr = act === "abrir-escudrina" ? "#/escudrina" : (await versoDelDia()).ruta;
    const url = new URL("./" + rutaIr, ALCANCE).href;
    const cls = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const cl of cls) {
      if (cl.url.startsWith(ALCANCE.href) && "focus" in cl) {
        try { await cl.navigate(url); } catch (er) { /* mantener pestaña */ }
        await cl.focus();
        return;
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(url);
  })());
});

// ------------------------------------------------------------------ PR #14 · Notificaciones nativas (app instalada / navegador)
const NOTIF_DATOS = "__notif__.json";
async function leerNotifConfig() {
  try {
    const r = await (await caches.open(CACHE)).match(claveDe(NOTIF_DATOS));
    return r ? await r.json() : null;
  } catch (e) { return null; }
}
async function guardarNotifConfig(d) {
  const cur = (await leerNotifConfig()) || {};
  const limpio = {
    on: !!d.on,
    coloso: d.coloso !== false,
    lectura: d.lectura !== false,
    cosecha: d.cosecha !== false,
    ultDia: cur.ultDia || "",
    t: Date.now(),
  };
  await (await caches.open(CACHE)).put(claveDe(NOTIF_DATOS), new Response(JSON.stringify(limpio), { headers: { "content-type": "application/json" } }));
  return limpio;
}
async function abrirRutaCliente(rutaDestino) {
  const rutaOk = typeof rutaDestino === "string" && /^#\/[A-Za-z0-9/_?.=&-]{0,120}$/.test(rutaDestino) ? rutaDestino : "#/";
  const url = new URL("./" + rutaOk, ALCANCE).href;
  const cls = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const cl of cls) {
    if (cl.url.startsWith(ALCANCE.href) && "focus" in cl) {
      try { await cl.navigate(url); } catch (er) { /* mantener pestaña */ }
      await cl.focus();
      return;
    }
  }
  if (self.clients.openWindow) await self.clients.openWindow(url);
}
async function revisarNotifSegundoPlano() {
  if (!self.registration || !self.registration.showNotification) return;
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const cfg = await leerNotifConfig();
  if (!cfg || !cfg.on) return;
  const hoy = new Date().toISOString().slice(0, 10);
  if (cfg.ultDia === hoy) return;
  const v = await versoDelDia();
  const icono = new URL("iconos/icon-192.png", ALCANCE).href;
  let titulo = "BiEx · Tu lectura de hoy";
  let cuerpo = v && v.texto ? "«" + v.texto.slice(0, 110) + "» — " + v.ref : "Continúa tu lectura diaria en Biblia Exacta.";
  let rutaIr = (v && v.ruta) || "#/seguir";
  const colosoMs = Date.UTC(2026, 10, 28, 18, 0, 0);
  const faltaCol = colosoMs - Date.now();
  if (cfg.coloso && faltaCol > 0 && faltaCol <= 36 * 36e5) {
    titulo = "El Coloso de la Tradición se acerca";
    cuerpo = "Prepárate en Escudriña: la incursión comunitaria abre muy pronto.";
    rutaIr = "#/escudrina/mundo";
  } else if (!cfg.lectura) {
    return;
  }
  await self.registration.showNotification(titulo, {
    body: cuerpo,
    icon: icono,
    badge: icono,
    tag: "biex-dia-" + hoy,
    renotify: false,
    data: { ruta: rutaIr },
  });
  await (await caches.open(CACHE)).put(claveDe(NOTIF_DATOS), new Response(JSON.stringify(Object.assign({}, cfg, { ultDia: hoy })), { headers: { "content-type": "application/json" } }));
}
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const data = (e.notification && e.notification.data && typeof e.notification.data === "object") ? e.notification.data : {};
  e.waitUntil(abrirRutaCliente(data.ruta || "#/"));
});

// Actualización en segundo plano (Chrome/Edge la concede a la app instalada; como mucho, una vez al día)
self.addEventListener("periodicsync", (e) => {
  if (e.tag === "biex-actualizar") e.waitUntil(Promise.all([refrescar().catch(() => {}), actualizarWidget(WIDGET_TAG), revisarNotifSegundoPlano().catch(() => {})]));
});
