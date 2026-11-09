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
  return env.JUEGO.fetch(new Request(request, { headers: h, redirect: "manual" }));
}
