// Escudriña · puerta del juego en Cloudflare Pages: /api/juego/* pasa al servidor del juego (Worker «biex-juego», sin
// dirección pública) por el enlace de servicio JUEGO. Añade el lugar aproximado de la conexión, que da Cloudflare
// (nunca el navegador): sirve para las clasificaciones por ciudad, región, país y continente.
// /api/juego/salud responde siempre 200 con el diagnóstico del enlace (para comprobarlo desde fuera sin el navegador).
const JSON_H = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const responder = (o, estado) => new Response(JSON.stringify(o), { status: estado || 200, headers: JSON_H });

function tipoEnlace(env) {
  if (!env.JUEGO) return "falta";
  return typeof env.JUEGO.fetch === "function" ? "servicio" : "mal_puesto:" + typeof env.JUEGO;
}

export async function onRequest({ request, env }) {
  const enlace = tipoEnlace(env);
  const salud = new URL(request.url).pathname.replace(/\/+$/, "").endsWith("/api/juego/salud");
  if (enlace !== "servicio") {
    if (salud) return responder({ ok: false, enlace, ayuda: "Falta el enlace de servicio JUEGO → biex-juego en Pages (Producción y Vista previa) y volver a implementar." });
    return responder({ error: "sin_servidor", enlace }, 503);
  }
  const cf = request.cf || {};
  const h = new Headers(request.headers);
  for (const k of [...h.keys()]) if (k.startsWith("x-biex-")) h.delete(k);
  const poner = (k, v) => { if (v) h.set("x-biex-" + k, encodeURIComponent(String(v))); };
  poner("ip", request.headers.get("cf-connecting-ip"));
  poner("pais", cf.country); poner("region", cf.region); poner("ciudad", cf.city); poner("cont", cf.continent); poner("tz", cf.timezone);
  if (salud) {
    try {
      const r = await env.JUEGO.fetch(new Request(request, { headers: h, redirect: "manual" }));
      const t = await r.text();
      let cuerpo = null; try { cuerpo = JSON.parse(t); } catch (e) { cuerpo = t.slice(0, 200); }
      return responder({ ok: r.status === 200, enlace, servidor: { estado: r.status, cuerpo } });
    } catch (e) {
      return responder({ ok: false, enlace, servidor: { error: String(e && e.message || e).slice(0, 200) } });
    }
  }
  // Prueba del capítulo (AF14 y AF26, 21-nov-2026): las preguntas salen de los archivos de ESTA publicación (env.ASSETS),
  // sin que el servidor del juego tenga que volver a pedirlas a bibliaexacta.pages.dev (esa vuelta fallaba en producción:
  // «Algo no salió bien»). El cuerpo se rehace aquí: lo que mande el navegador en «filas» nunca llega al servidor.
  const ruta = new URL(request.url).pathname.replace(/^\/api\/juego(?=\/|$)/, "");
  if (ruta === "/prueba/pedir" && request.method === "POST" && env.ASSETS) {
    let b = null; try { b = await request.clone().json(); } catch (e) { b = null; }
    const lib = b && typeof b.lib === "string" && /^[0-9A-Z]{3}$/.test(b.lib) ? b.lib : "", cap = b ? Number(b.cap) : NaN;
    if (lib && Number.isInteger(cap) && cap > 0) {
      try {
        const r = await env.ASSETS.fetch(new URL("/datos/juego/" + lib + ".json", request.url));
        const d = r.ok ? await r.json() : null, filas = d && d.c ? d.c[String(cap)] || [] : null;
        if (Array.isArray(filas)) {
          h.set("x-biex-filas", "1"); h.set("content-type", "application/json"); h.delete("content-length");
          return env.JUEGO.fetch(new Request(request.url, { method: "POST", headers: h, body: JSON.stringify({ lib, cap, filas }), redirect: "manual" }));
        }
      } catch (e) { /* sin los archivos: el servidor del juego los busca por su cuenta */ }
    }
  }
  return env.JUEGO.fetch(new Request(request, { headers: h, redirect: "manual" }));
}
